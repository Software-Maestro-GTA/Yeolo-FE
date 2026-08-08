/**
 * @file photoService.ts
 * @description Device photo library access and EXIF metadata extraction service.
 */
import {
  requestPermissionsAsync,
  Query,
  AssetField,
  MediaType,
} from 'expo-media-library';
import type { ImageMetadata } from '@yeolo/common';
import { logger } from '@yeolo/common';
import { UI_STRINGS } from '../constants';

/**
 * Request device photo library permission and fetch recent images with EXIF location & time metadata.
 * @param limit - Maximum number of recent photo assets to query.
 * @param timezone - Target timezone (default: 'UTC').
 * @returns Promise<ImageMetadata[]> Array of parsed image metadata.
 */
export async function fetchPhotosWithExifData(
  limit: number = 100,
  timezone: string = 'UTC',
): Promise<ImageMetadata[]> {
  // 1. Request permission
  const { status } = await requestPermissionsAsync();
  if (status !== 'granted') {
    logger.error('[PhotoService] Permission denied for media library');
    throw new Error(UI_STRINGS.TASTE_ANALYSIS.PERMISSION_ERROR);
  }

  // 2. Query recent image assets descending by creation time
  const assets = await new Query()
    .eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
    .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
    .limit(limit)
    .exe();

  if (!assets || assets.length === 0) {
    logger.error('[PhotoService] No photo assets found on device library');
    throw new Error(UI_STRINGS.TASTE_ANALYSIS.NO_PHOTOS_ERROR);
  }

  // 3. Extract latitude, longitude, and creation time metadata
  const parsedImages: ImageMetadata[] = [];

  for (const asset of assets) {
    try {
      const location = await asset.getLocation();
      const creationTime = await asset.getCreationTime();

      if (
        !location ||
        location.latitude === undefined ||
        location.longitude === undefined ||
        location.latitude === null ||
        location.longitude === null ||
        !creationTime
      ) {
        continue;
      }

      parsedImages.push({
        sourceImageId: asset.id,
        capturedAt: new Date(creationTime).toISOString(),
        latitude: location.latitude,
        longitude: location.longitude,
        timezone,
      });
    } catch (err) {
      logger.warn(
        `[PhotoService] Failed to fetch location metadata for asset ${asset.id}:`,
        err,
      );
    }
  }

  if (parsedImages.length === 0) {
    logger.error(
      `[PhotoService] All ${assets.length} photos were skipped because none contained valid EXIF GPS coordinates (latitude/longitude).`,
    );
    throw new Error(UI_STRINGS.TASTE_ANALYSIS.NO_EXIF_ERROR);
  }

  logger.info(
    `[PhotoService] Successfully extracted EXIF metadata from ${parsedImages.length} of ${assets.length} photos`,
  );

  return parsedImages;
}
