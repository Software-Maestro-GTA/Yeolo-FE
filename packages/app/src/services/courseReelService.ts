/**
 * @file courseReelService.ts
 * @description Course-day reel location keys, storyboard, explicit photo picking and on-device MP4 export lifecycle.
 */
import type { ItineraryDay, ItineraryStop } from '@yeolo/common';
import { requireOptionalNativeModule } from 'expo';
import * as ImagePicker from 'expo-image-picker';
import { APP_CONFIG } from '../constants/config';
import { UI_STRINGS } from '../constants/strings';
import { palette } from '../theme/colors';
import { REEL_BRAND_MARK_URI } from '../constants/reelBrandMark';

export interface ReelPhoto {
  /** Local photo key from reelStopKey; never passed to Google Maps as a place ID. */
  placeId: string;
  uri: string;
  caption: string;
  placeName?: string;
}
export interface ReelPoint {
  x: number;
  y: number;
  label: string;
  name?: string;
  nameX?: number;
  nameY?: number;
  nameWidth?: number;
}
export interface ReelMapSnapshot {
  uri: string;
  points: ReelPoint[];
}
export interface ReelMapCoordinate {
  latitude: number;
  longitude: number;
  label: string;
}
type ReelLocation = Pick<ReelMapCoordinate, 'latitude' | 'longitude'>;
export interface ReelDayEdits {
  deleted?: readonly string[];
}
export interface ReelPlanOptions {
  /** Undefined keeps the city/count default; an explicit empty string hides the title. */
  introTitle?: string;
  footerLocation?: string;
}
export interface ReelScene {
  kind: 'photo' | 'route';
  role?: 'hook' | 'stop' | 'route';
  number?: string;
  uri: string;
  title: string;
  caption: string;
  seconds: number;
  points: ReelPoint[];
}
export interface ReelPlan {
  rendererVersion: number;
  brandMark: { uri: string };
  layout: typeof APP_CONFIG.REEL.LAYOUT;
  width: number;
  height: number;
  fps: number;
  scenes: ReelScene[];
  backgroundColor: string;
  accentColor: string;
  textColor: string;
}
interface ReelNativeModule {
  rendererVersion?: number;
  captureMapAsync(tag: number, coordinates: string): Promise<ReelMapSnapshot>;
  generateAsync(json: string, jobId: string): Promise<string>;
  cancel(): void;
  deleteAsync(uri: string): Promise<void>;
  previewAsync(uri: string): Promise<void>;
  shareAsync(uri: string): Promise<void>;
  saveAsync(uri: string): Promise<boolean>;
  addListener(
    name: string,
    listener: (event: { jobId: string; progress: number }) => void,
  ): { remove(): void };
}

function nativeModule(): ReelNativeModule {
  const module = requireOptionalNativeModule<ReelNativeModule>('YeoloReel');
  if (!module) throw new Error(UI_STRINGS.REEL.UNAVAILABLE);
  return module;
}

/** Opens the system photo picker without requesting full-library access. */
export async function pickReelPhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    allowsMultipleSelection: false,
    quality: 0.9,
  });
  return result.canceled ? null : result.assets?.[0]?.uri || null;
}

export function reelMapCoordinates(day: ItineraryDay): ReelMapCoordinate[] {
  const stops = [...day.stops].sort((a, b) => a.sequence - b.sequence);
  return stops
    .filter(({ place }) => isValidReelLocation(place))
    .map(({ place, sequence }) => ({
      latitude: place.latitude,
      longitude: place.longitude,
      label: String(sequence),
    }));
}

/** Accepts finite coordinates supported by the Google Maps Mercator capture. */
function isValidReelLocation(
  location?: Partial<ReelLocation> | null,
): location is ReelLocation {
  return (
    typeof location?.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    Math.abs(location.latitude) <= 85 &&
    Math.abs(location.longitude) <= 180
  );
}

/** Excludes deleted reel items without mutating the itinerary, coordinates or photo keys. */
export function applyReelDayEdits(
  day: ItineraryDay,
  edits: ReelDayEdits,
): ItineraryDay {
  if (!edits.deleted?.length) return day;
  return {
    ...day,
    stops: day.stops.filter(
      (stop) => !edits.deleted?.includes(reelStopKey(stop)),
    ),
  };
}

/** Identifies a map capture by its active date, coordinates and original stop sequences. */
export function reelMapSignature(day: ItineraryDay): string {
  return JSON.stringify([
    day.day,
    reelPhotoStops(day).map(reelStopKey),
    reelMapCoordinates(day),
  ]);
}

/** Fits the current locations, including a useful close view when only one place remains. */
export function reelMapRegion(coordinates: readonly ReelLocation[]) {
  if (!coordinates.length) return undefined;
  const latitudes = coordinates.map((p) => p.latitude);
  const longitudes = coordinates.map((p) => p.longitude);
  const minLat = Math.min(...latitudes),
    maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes),
    maxLng = Math.max(...longitudes);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.008, (maxLat - minLat) * 1.7),
    longitudeDelta: Math.max(0.008, (maxLng - minLng) * 1.7),
  };
}
/** Returns a local per-day key, preserving stops without a Google place ID by their sequence. */
export function reelStopKey(stop: ItineraryStop): string {
  return stop.place.googlePlaceId?.trim() || `stop:${stop.sequence}`;
}

/** Keeps stable photo keys while applying a reel-only display order to unique stops. */
export function reelPhotoStops(
  day: ItineraryDay,
  order?: readonly string[],
): ItineraryStop[] {
  const seen = new Set<string>();
  const stops = [...day.stops]
    .sort((a, b) => a.sequence - b.sequence)
    .filter((stop) => {
      const key = reelStopKey(stop);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (!order) return stops;
  const ranks = new Map(order.map((key, index) => [key, index]));
  return stops.sort(
    (a, b) =>
      (ranks.get(reelStopKey(a)) ?? order.length) -
      (ranks.get(reelStopKey(b)) ?? order.length),
  );
}

/** Builds an exportable day-specific storyboard; throws for empty/invalid photo selection. */
export function buildReelPlan(
  day: ItineraryDay,
  photos: ReelPhoto[],
  cityName: string,
  introDescription: string,
  firstPlaceId?: string,
  map?: ReelMapSnapshot | null,
  photoOrder?: readonly string[],
  options: ReelPlanOptions = {},
): ReelPlan {
  const c = APP_CONFIG.REEL;
  const selected = reelPhotoStops(day, photoOrder).flatMap((stop) => {
    const photo = photos.find((p) => p.placeId === reelStopKey(stop) && p.uri);
    return photo ? [{ stop, photo }] : [];
  });
  if (!selected.length) throw new Error(UI_STRINGS.REEL.EMPTY_PHOTOS);
  if (selected.length > c.MAX_PHOTOS) throw new Error(UI_STRINGS.REEL.LIMIT);
  const first =
    selected.find((s) => s.photo.placeId === firstPlaceId) || selected[0];
  const videoTitle =
    options.introTitle ??
    `${cityName.trim() || UI_STRINGS.REEL.CITY_FALLBACK} 여행 코스 ${selected.length}곳`;
  const routePoints = (map?.points ?? [])
    .flatMap((point) => {
      const index = selected.findIndex(
        ({ stop }) => String(stop.sequence) === point.label,
      );
      if (index < 0) return [];
      const { stop, photo } = selected[index];
      return [
        {
          ...point,
          label: String(index + 1),
          name: photo.placeName?.trim() || stop.place.placeName,
          x: (c.LAYOUT.mapX + point.x * c.LAYOUT.mapSize) / c.WIDTH,
          y:
            (c.LAYOUT.mapY +
              ((point.y - 0.1) * c.HEIGHT * c.LAYOUT.mapSize) / c.WIDTH) /
            c.HEIGHT,
        },
      ];
    })
    .sort((a, b) => Number(a.label) - Number(b.label));
  const photoScene = (
    uri: string,
    sceneTitle: string,
    caption: string,
    seconds: number,
  ): ReelScene => ({
    kind: 'photo',
    uri,
    title: sceneTitle.trim().slice(0, c.TITLE_LIMIT),
    caption: caption.trim().slice(0, c.CAPTION_LIMIT),
    seconds,
    points: [],
  });
  return {
    rendererVersion: c.RENDERER_VERSION,
    brandMark: { uri: REEL_BRAND_MARK_URI },
    layout: c.LAYOUT,
    width: c.WIDTH,
    height: c.HEIGHT,
    fps: c.FPS,
    backgroundColor: palette.deepNavy,
    accentColor: palette.primary,
    textColor: palette.white,
    scenes: [
      {
        ...photoScene(
          first.photo.uri,
          videoTitle,
          introDescription,
          c.INTRO_SECONDS,
        ),
        role: 'hook',
      },
      ...selected.map(({ stop, photo }, index): ReelScene => ({
        ...photoScene(
          photo.uri,
          photo.placeName ?? stop.place.placeName,
          photo.caption,
          c.PHOTO_SECONDS,
        ),
        role: 'stop',
        number: (photo.placeName ?? stop.place.placeName).trim()
          ? String(index + 1)
          : undefined,
      })),
      {
        kind: 'route',
        role: 'route',
        uri: map?.uri || '',
        title: '',
        caption: [reelDateLabel(day.date), options.footerLocation?.trim()]
          .filter(Boolean)
          .join('\n'),
        seconds: c.ROUTE_SECONDS,
        points: layoutReelMapNames(routePoints),
      },
    ],
  };
}

/** Formats the selected itinerary date without timezone shifts or substituting today's date. */
function reelDateLabel(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
  const parsed = new Date(`${date}T00:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  )
    return '';
  return `${date.replace(/-/g, '. ')}.`;
}

/** Encodes real H.264 MP4 and unsubscribes progress listeners on success or failure. */
export async function generateReel(
  plan: ReelPlan,
  onProgress: (value: number) => void,
): Promise<string> {
  const module = nativeModule();
  if (plan.scenes.some((s) => s.kind === 'route' && !s.uri))
    throw new Error(UI_STRINGS.REEL.MAP_ERROR);
  if (plan.rendererVersion && module.rendererVersion !== plan.rendererVersion)
    throw new Error(UI_STRINGS.REEL.UNAVAILABLE);
  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const listener = module.addListener('onProgress', (event) => {
    if (event.jobId === jobId && Number.isFinite(event.progress))
      onProgress(Math.max(0, Math.min(1, event.progress)));
  });
  try {
    return await module.generateAsync(JSON.stringify(plan), jobId);
  } finally {
    listener.remove();
  }
}

/** Captures the loaded Google Maps SDK view, preserving attribution and projected route positions. */
export async function captureReelMap(
  tag: number,
  coordinates: ReelMapCoordinate[],
): Promise<ReelMapSnapshot> {
  const module = nativeModule();
  if (!module.captureMapAsync) throw new Error(UI_STRINGS.REEL.UNAVAILABLE);
  return module.captureMapAsync(tag, JSON.stringify(coordinates));
}

export function cancelReel(): void {
  requireOptionalNativeModule<ReelNativeModule>('YeoloReel')?.cancel();
}
export async function deleteReel(uri: string): Promise<void> {
  await nativeModule().deleteAsync(uri);
}
export async function previewReel(uri: string): Promise<void> {
  await nativeModule().previewAsync(uri);
}
export async function shareReel(uri: string): Promise<void> {
  await nativeModule().shareAsync(uri);
}
export async function saveReel(uri: string): Promise<boolean> {
  return await nativeModule().saveAsync(uri);
}

/** Resolves wall-clock playback to the same discrete scene/frame used by native exports. */
export function reelPlaybackFrame(plan: ReelPlan, seconds: number) {
  let frame = Math.max(0, Math.floor(seconds * plan.fps));
  for (let index = 0; index < plan.scenes.length; index++) {
    const count = Math.round(plan.scenes[index].seconds * plan.fps);
    if (frame < count)
      return { index, fraction: frame / Math.max(1, count - 1) };
    frame -= count;
  }
  return { index: plan.scenes.length - 1, fraction: 1 };
}

/** Places compact name tags without covering other numbers, labels or the SDK attribution strip. */
export function layoutReelMapNames(points: ReelPoint[]): ReelPoint[] {
  const l = APP_CONFIG.REEL.LAYOUT;
  type Box = { x: number; y: number; width: number; height: number };
  const placed: Box[] = [];
  const circles = points.map((p) => ({
    x: p.x * 720 - 22,
    y: p.y * 1280 - 22,
    width: 44,
    height: 44,
  }));
  const overlap = (a: Box, b: Box) =>
    Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return points.map((point) => {
    const units = [...(point.name ?? '')].reduce(
      (sum, ch) =>
        sum + (/[^\x00-\x7f]/.test(ch) ? 1 : /\s/.test(ch) ? 0.35 : 0.62),
      0,
    );
    const width = Math.min(
      224,
      Math.max(72, Math.ceil(units * l.mapNameSize) + 20),
    );
    const x = point.x * 720,
      y = point.y * 1280,
      h = l.mapNameHeight;
    const candidates = [
      { x: x + 26, y: y - h / 2 },
      { x: x - width - 26, y: y - h / 2 },
      { x: x - width / 2, y: y - h - 26 },
      { x: x - width / 2, y: y + 26 },
      ...[-80, -40, 40, 80].flatMap((d) => [
        { x: x + 26, y: y - h / 2 + d },
        { x: x - width - 26, y: y - h / 2 + d },
      ]),
    ].map((p) => ({
      x: Math.max(l.mapX + 8, Math.min(l.mapX + l.mapSize - width - 8, p.x)),
      y: Math.max(l.mapY + 8, Math.min(l.mapY + l.mapSize - h - 52, p.y)),
      width,
      height: h,
    }));
    const score = (box: Box) =>
      [...placed, ...circles].reduce(
        (sum, other) => sum + overlap(box, other),
        0,
      );
    const chosen = candidates.reduce((best, candidate) =>
      score(candidate) < score(best) ? candidate : best,
    );
    placed.push(chosen);
    return {
      ...point,
      nameX: chosen.x,
      nameY: chosen.y,
      nameWidth: chosen.width,
    };
  });
}
