/**
 * @file photoSelection.ts
 * @description Deterministic location/time representative sampling without reading image pixels.
 */
import type { ImageMetadata } from '@yeolo/common';
import { APP_CONFIG } from '../constants/config';

const DAY_MS = 86_400_000;
const POLICY = APP_CONFIG.PHOTO_SAMPLING;

/**
 * Divide the rolling lookback into non-overlapping time windows, newest first.
 * @param now - Snapshot time in epoch milliseconds.
 * @returns Half-open windows covering the last 365 days, including now.
 */
export function photoSamplingPeriods(now: number) {
  const start = now - POLICY.LOOKBACK_DAYS * DAY_MS;
  const width = (now + 1 - start) / POLICY.PERIOD_COUNT;
  return Array.from({ length: POLICY.PERIOD_COUNT }, (_, index) => ({
    start: Math.floor(start + (POLICY.PERIOD_COUNT - index - 1) * width),
    end: Math.floor(start + (POLICY.PERIOD_COUNT - index) * width),
  }));
}

function distanceMeters(a: ImageMetadata, b: ImageMetadata): number {
  const radians = Math.PI / 180;
  const lat = Math.sin(((b.latitude - a.latitude) * radians) / 2);
  const lon = Math.sin(((b.longitude - a.longitude) * radians) / 2);
  const haversine =
    lat * lat +
    Math.cos(a.latitude * radians) * Math.cos(b.latitude * radians) * lon * lon;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

function spreadAcrossDay(visits: ImageMetadata[]): ImageMetadata[] {
  if (visits.length <= POLICY.MAX_PER_DAY) return visits;
  return Array.from(
    { length: POLICY.MAX_PER_DAY },
    (_, index) =>
      visits[
        Math.floor((index * (visits.length - 1)) / (POLICY.MAX_PER_DAY - 1))
      ],
  );
}

/**
 * Select one record per approximate visit, then balance days and time periods.
 * @param images - Validated metadata from the bounded library scan.
 * @param limit - Maximum output size.
 * @param now - Snapshot time used by collection.
 * @returns Representative records in chronological order; these are not verified POI visits.
 */
export function selectRepresentativePhotos(
  images: ImageMetadata[],
  limit: number,
  now: number,
): ImageMetadata[] {
  const sorted = [...images].sort(
    (a, b) =>
      Date.parse(a.capturedAt) - Date.parse(b.capturedAt) ||
      a.sourceImageId.localeCompare(b.sourceImageId),
  );
  const byDay = new Map<string, ImageMetadata[]>();
  for (const image of sorted) {
    const day = image.capturedAt.slice(0, 10); // UTC, not the device's current timezone.
    const visits = byDay.get(day) || [];
    const time = Date.parse(image.capturedAt);
    // Fixed anchors avoid an unlimited time/distance chain through a burst.
    const existing = visits.some(
      (visit) =>
        time - Date.parse(visit.capturedAt) <=
          POLICY.VISIT_WINDOW_MINUTES * 60_000 &&
        distanceMeters(visit, image) <= POLICY.VISIT_RADIUS_METERS,
    );
    if (!existing) visits.push(image);
    byDay.set(day, visits);
  }

  const queues = photoSamplingPeriods(now).map(({ start, end }) => {
    const days = [...byDay.values()]
      .map((visits) =>
        spreadAcrossDay(
          visits.filter((image) => {
            const time = Date.parse(image.capturedAt);
            return time >= start && time < end;
          }),
        ),
      )
      .filter((visits) => visits.length > 0);
    const queue: ImageMetadata[] = [];
    // One visit from every day before a second visit from any day.
    for (let round = 0; round < POLICY.MAX_PER_DAY; round++) {
      for (const day of days) {
        if (day[round]) queue.push(day[round]);
      }
    }
    return queue;
  });

  const selected: ImageMetadata[] = [];
  const dayCounts = new Map<string, number>();
  while (selected.length < limit) {
    let added = false;
    for (const queue of queues) {
      let image = queue.shift();
      while (
        image &&
        (dayCounts.get(image.capturedAt.slice(0, 10)) || 0) >=
          POLICY.MAX_PER_DAY
      )
        image = queue.shift();
      if (!image) continue;
      const day = image.capturedAt.slice(0, 10);
      selected.push(image);
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
      added = true;
      if (selected.length === limit) break;
    }
    if (!added) break;
  }
  return selected.sort(
    (a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt),
  );
}
