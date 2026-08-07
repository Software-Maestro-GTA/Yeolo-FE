/**
 * @file courseService.ts
 * @description Course detail geocoding helper and location coordinate transformation service.
 */
import {
  geocodePlace,
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
 * Perform geocoding for all stops in an itinerary day and produce adjusted map coordinates.
 */
export async function processCourseStopsMapData(
  stops: ItineraryStop[] = [],
  city: string = ''
): Promise<ProcessedCourseMapData> {
  if (!stops || stops.length === 0) {
    const defaultRegion = calculateRegion([]);
    return {
      coordinates: [],
      region: defaultRegion,
      leafletHtml: getLeafletMapHtml([]),
    };
  }

  const rawStops = (
    await Promise.all(
      stops.map(async (stop, index) => {
        const coords = await geocodePlace(stop.placeName, city);
        if (coords) {
          logger.info(`[CourseService] Geocoded coords for "${stop.placeName}" (${city}):`, coords);
          return {
            ...coords,
            placeName: stop.placeName,
            sequence: stop.sequence ?? index + 1,
          };
        }

        logger.warn(`[CourseService] Failed to geocode coords for "${stop.placeName}" (${city})`);
        return null;
      })
    )
  ).filter((item): item is NonNullable<typeof item> => item !== null);

  const coordinates = getAdjustedCoordinates(rawStops);
  const region = calculateRegion(coordinates);
  const leafletHtml = getLeafletMapHtml(coordinates);

  logger.info(`[CourseService] Final processed map data: ${coordinates.length} valid coordinates for city "${city}"`);

  return {
    coordinates,
    region,
    leafletHtml,
  };
}
