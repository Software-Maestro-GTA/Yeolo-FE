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
export interface ReelScene {
  kind: 'photo' | 'route';
  uri: string;
  title: string;
  caption: string;
  seconds: number;
  points: ReelPoint[];
}
export interface ReelPlan {
  width: number;
  height: number;
  fps: number;
  scenes: ReelScene[];
  backgroundColor: string;
  accentColor: string;
  textColor: string;
}
interface ReelNativeModule {
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
    .filter(
      ({ place }) =>
        Number.isFinite(place.latitude) &&
        Number.isFinite(place.longitude) &&
        Math.abs(place.latitude) <= 85 &&
        Math.abs(place.longitude) <= 180,
    )
    .map(({ place, sequence }) => ({
      latitude: place.latitude,
      longitude: place.longitude,
      label: String(sequence),
    }));
}
/** Returns a local per-day key, preserving stops without a Google place ID by their sequence. */
export function reelStopKey(stop: ItineraryStop): string {
  return stop.place.googlePlaceId?.trim() || `stop:${stop.sequence}`;
}

/** Deduplicates identified locations while keeping stops without Google place IDs. */
export function reelPhotoStops(day: ItineraryDay): ItineraryStop[] {
  const seen = new Set<string>();
  return [...day.stops]
    .sort((a, b) => a.sequence - b.sequence)
    .filter((stop) => {
      const key = reelStopKey(stop);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** Builds an exportable day-specific storyboard; throws for empty/invalid photo selection. */
export function buildReelPlan(
  day: ItineraryDay,
  photos: ReelPhoto[],
  title: string,
  ending: string,
  firstPlaceId?: string,
  map?: ReelMapSnapshot | null,
  photoOrder?: readonly string[],
): ReelPlan {
  const c = APP_CONFIG.REEL;
  const selected = reelPhotoStops(day).flatMap((stop) => {
    const photo = photos.find((p) => p.placeId === reelStopKey(stop) && p.uri);
    return photo ? [{ stop, photo }] : [];
  });
  if (photoOrder) {
    selected.sort((a, b) => {
      const left = photoOrder.indexOf(a.photo.placeId);
      const right = photoOrder.indexOf(b.photo.placeId);
      return (
        (left < 0 ? photoOrder.length : left) -
        (right < 0 ? photoOrder.length : right)
      );
    });
  }
  if (!selected.length) throw new Error(UI_STRINGS.REEL.EMPTY_PHOTOS);
  if (selected.length > c.MAX_PHOTOS) throw new Error(UI_STRINGS.REEL.LIMIT);
  const first =
    selected.find((s) => s.photo.placeId === firstPlaceId) || selected[0];
  const videoTitle = title.trim().slice(0, c.TITLE_LIMIT);
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
    width: c.WIDTH,
    height: c.HEIGHT,
    fps: c.FPS,
    backgroundColor: palette.deepNavy,
    accentColor: palette.warning,
    textColor: palette.white,
    scenes: [
      photoScene(
        first.photo.uri,
        videoTitle,
        UI_STRINGS.REEL.INTRO_DEFAULT,
        c.INTRO_SECONDS,
      ),
      {
        kind: 'route',
        uri: map?.uri || '',
        title: UI_STRINGS.REEL.ROUTE_TITLE,
        caption: `DAY ${day.day} · ${day.date || ''}`,
        seconds: c.ROUTE_SECONDS,
        points: map?.points || [],
      },
      ...selected.map(({ stop, photo }) =>
        photoScene(
          photo.uri,
          photo.placeName ?? stop.place.placeName,
          photo.caption,
          c.PHOTO_SECONDS,
        ),
      ),
      photoScene(first.photo.uri, videoTitle, ending, c.ENDING_SECONDS),
    ],
  };
}

/** Encodes real H.264 MP4 and unsubscribes progress listeners on success or failure. */
export async function generateReel(
  plan: ReelPlan,
  onProgress: (value: number) => void,
): Promise<string> {
  const module = nativeModule();
  if (plan.scenes.some((s) => s.kind === 'route' && !s.uri))
    throw new Error(UI_STRINGS.REEL.MAP_ERROR);
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
