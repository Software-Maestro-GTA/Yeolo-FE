/**
 * @file courseService.ts
 * @description Course detail location coordinate transformation service using server provided coordinates.
 */
import {
  getAdjustedCoordinates,
  calculateRegion,
  getLeafletMapHtml,
  logger,
  type ItineraryStop,
  type MapCoordinate,
  type MapRegion,
} from '@yeolo/common';

export interface ProcessedCourseMapData {
  coordinates: MapCoordinate[];
  region?: MapRegion;
  leafletHtml: string;
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
      leafletHtml: getLeafletMapHtml([]),
    };
  }

  const rawStops: MapCoordinate[] = stops
    .filter(
      (stop) =>
        typeof stop.latitude === 'number' &&
        typeof stop.longitude === 'number' &&
        !isNaN(stop.latitude) &&
        !isNaN(stop.longitude),
    )
    .map((stop, index) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
      placeName: stop.placeName,
      sequence: stop.sequence ?? index + 1,
    }));

  const coordinates = getAdjustedCoordinates(rawStops);
  const region = calculateRegion(coordinates);
  const leafletHtml = getLeafletMapHtml(coordinates);

  logger.info(
    `[CourseService] Final processed map data: ${coordinates.length} valid coordinates for city "${city}"`,
  );

  return {
    coordinates,
    region,
    leafletHtml,
  };
}
