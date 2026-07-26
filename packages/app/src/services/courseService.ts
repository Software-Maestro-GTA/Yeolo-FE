/**
 * @file courseService.ts
 * @description Course detail geocoding helper and location coordinate transformation service.
 * @requirements REQ-9
 * @functional FUN-3
 * @author Antigravity Agent
 */
import {
  geocodePlace,
  getAdjustedCoordinates,
  calculateRegion,
  getLeafletMapHtml,
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
      leafletHtml: '',
    };
  }

  const rawStops = (
    await Promise.all(
      stops.map(async (stop) => {
        const coords = await geocodePlace(stop.placeName, city);
        if (!coords) return null;
        return {
          ...coords,
          placeName: stop.placeName,
          sequence: stop.sequence,
        };
      })
    )
  ).filter((item): item is NonNullable<typeof item> => item !== null);

  const coordinates = getAdjustedCoordinates(rawStops);
  const region = calculateRegion(coordinates);
  const leafletHtml = getLeafletMapHtml(coordinates);

  return {
    coordinates,
    region,
    leafletHtml,
  };
}
