/**
 * @file photoService.ts
 * @description Bounded device-library metadata collection with representative location/time sampling.
 */
import {
  requestPermissionsAsync,
  Query,
  AssetField,
  MediaType,
  type Asset,
} from 'expo-media-library';
import { logger, type ImageMetadata } from '@yeolo/common';
import { APP_CONFIG } from '../constants/config';
import { UI_STRINGS } from '../constants/strings';
import {
  photoSamplingPeriods,
  selectRepresentativePhotos,
} from './photoSelection';

/**
 * Collect representative metadata within the user's allowed photo scope; no pixels are read.
 * @param limit - Payload cap (5–100); larger values are clamped to the configured cap.
 * @param timezone - Timestamp representation, UTC by default; not inferred capture-location timezone.
 * @returns Representative metadata using the existing analysis API contract.
 * @throws Error for denied permissions, missing/insufficient metadata or native query failures.
 */
export async function fetchPhotosWithExifData(
  limit: number = APP_CONFIG.ANALYSIS_PHOTO_LIMIT,
  timezone: string = 'UTC',
): Promise<ImageMetadata[]> {
  const policy = APP_CONFIG.PHOTO_SAMPLING;
  if (!Number.isInteger(limit) || limit < policy.MIN_REPRESENTATIVES)
    throw new RangeError(
      'Photo payload limit must be an integer of at least 5.',
    );
  const payloadLimit = Math.min(limit, APP_CONFIG.ANALYSIS_PHOTO_LIMIT);
  const permission = await requestPermissionsAsync(false, ['photo']);
  if (permission.status !== 'granted')
    throw new Error(UI_STRINGS.TASTE_ANALYSIS.PERMISSION_ERROR);
  const now = Date.now();
  const periods = photoSamplingPeriods(now);
  const seen = new Set<string>();
  const images: ImageMetadata[] = [];
  let queried = 0;
  let failed = 0;

  async function readMetadata(asset: Asset): Promise<ImageMetadata | null> {
    try {
      const creationTime = await asset.getCreationTime();
      if (
        creationTime === null ||
        !Number.isFinite(creationTime) ||
        creationTime < periods[periods.length - 1].start ||
        creationTime > now
      )
        return null;
      const location = await asset.getLocation();
      if (
        !location ||
        !Number.isFinite(location.latitude) ||
        !Number.isFinite(location.longitude) ||
        Math.abs(location.latitude) > 90 ||
        Math.abs(location.longitude) > 180
      )
        return null;
      return {
        sourceImageId: asset.id,
        capturedAt: new Date(creationTime).toISOString(),
        latitude: location.latitude,
        longitude: location.longitude,
        timezone,
      };
    } catch {
      // Log aggregate counts only: native errors can contain asset identifiers/paths.
      failed++;
      return null;
    }
  }

  for (const period of periods) {
    for (
      let offset = 0;
      offset < policy.CANDIDATES_PER_PERIOD;
      offset += policy.PAGE_SIZE
    ) {
      const pageSize = Math.min(
        policy.PAGE_SIZE,
        policy.CANDIDATES_PER_PERIOD - offset,
      );
      const assets = await new Query()
        .eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
        .gte(AssetField.CREATION_TIME, period.start)
        .lt(AssetField.CREATION_TIME, period.end)
        .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
        .offset(offset)
        .limit(pageSize)
        .exe();
      queried += assets.length;
      const unique = assets.filter((asset) => {
        if (!asset.id || seen.has(asset.id)) return false;
        seen.add(asset.id);
        return true;
      });
      for (
        let index = 0;
        index < unique.length;
        index += policy.METADATA_CONCURRENCY
      ) {
        const batch = await Promise.all(
          unique
            .slice(index, index + policy.METADATA_CONCURRENCY)
            .map(readMetadata),
        );
        for (const metadata of batch) if (metadata) images.push(metadata);
      }
      if (assets.length < pageSize) break;
    }
  }

  const selected = selectRepresentativePhotos(images, payloadLimit, now);
  const days = new Set(selected.map((image) => image.capturedAt.slice(0, 10)))
    .size;
  logger.info('[PhotoService] Sampling counts:', {
    queried,
    valid: images.length,
    selected: selected.length,
    days,
    failed,
  });
  const limited = permission.accessPrivileges === 'limited';
  if (selected.length < policy.MIN_REPRESENTATIVES || days < policy.MIN_DAYS) {
    const strings = UI_STRINGS.TASTE_ANALYSIS;
    throw new Error(
      limited
        ? strings.LIMITED_PHOTOS_ERROR
        : queried === 0
          ? strings.NO_PHOTOS_ERROR
          : images.length === 0
            ? strings.NO_EXIF_ERROR
            : strings.INSUFFICIENT_PHOTOS_ERROR,
    );
  }
  return selected;
}
