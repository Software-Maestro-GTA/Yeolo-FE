/**
 * @file courseService.ts
 * @description Course detail location coordinate transformation service using server provided coordinates.
 */
import {
  getAdjustedCoordinates,
  calculateRegion,
  isValidCoordinate,
  logger,
  type ItineraryStop,
  type MapCoordinate,
  type MapRegion,
} from '@yeolo/common';

export interface ProcessedCourseMapData {
  coordinates: MapCoordinate[];
  region?: MapRegion;
}

/**
 * Generate fallback destination image URL for a given country and city.
 */
export function getDestinationImageUrl(country: string, city: string): string {
  const keyword = (city || country || '여행').trim();
  return `https://loremflickr.com/600/400/${encodeURIComponent(keyword)}`;
}

/**
 * Process itinerary day stops using server-provided coordinates to produce map data.
 */
export async function processCourseStopsMapData(
  stops: ItineraryStop[] = [],
  city: string = '',
): Promise<ProcessedCourseMapData> {
  if (!stops || stops.length === 0) {
    const defaultRegion = calculateRegion([]);
    return {
      coordinates: [],
      region: defaultRegion,
    };
  }

  const rawStops: MapCoordinate[] = stops
    .filter((stop) =>
      isValidCoordinate({
        latitude: stop.place?.latitude,
        longitude: stop.place?.longitude,
      }),
    )
    .map((stop, index) => ({
      latitude: stop.place.latitude,
      longitude: stop.place.longitude,
      placeName: stop.place.placeName,
      sequence: stop.sequence ?? index + 1,
    }));

  const coordinates = getAdjustedCoordinates(rawStops);
  const region = calculateRegion(coordinates);

  logger.info(
    `[CourseService] Final processed map data: ${coordinates.length} valid coordinates for city "${city}"`,
  );

  return {
    coordinates,
    region,
  };
}
