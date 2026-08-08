/**
 * @file geocode.ts
 * @description Geocoding utility service using OpenStreetMap Nominatim API with in-memory caching.
 */

import { logger } from '../utils/logger';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

export interface NominatimItem {
  lat: string;
  lon: string;
  class?: string;
  type?: string;
  display_name?: string;
}

const geocodeCache = new Map<string, GeocodeResult | null>();

export async function fetchGeocode(
  query: string,
): Promise<GeocodeResult | null> {
  if (geocodeCache.has(query)) {
    logger.info('[GeocodeService] Cache hit for query:', query);
    return geocodeCache.get(query) || null;
  }

  logger.info('[GeocodeService] Fetching geocode for query:', query);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=kr&limit=5`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'YeoloTravelApp/1.0',
      },
    });
    const data: NominatimItem[] = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const bestMatch =
        data.find(
          (item) =>
            item.class === 'tourism' ||
            item.class === 'amenity' ||
            item.class === 'leisure' ||
            item.type === 'point',
        ) || data[0];
      if (bestMatch && bestMatch.lat && bestMatch.lon) {
        const result: GeocodeResult = {
          latitude: parseFloat(bestMatch.lat),
          longitude: parseFloat(bestMatch.lon),
        };
        geocodeCache.set(query, result);
        return result;
      }
    }
  } catch (err) {
    // ignore fetch error
  }

  geocodeCache.set(query, null);
  return null;
}

/**
 * OpenStreetMap Nominatim Geocoding API를 활용한 스마트 검색어 정제 및 다단계 지오코딩 공통 유틸
 */
export async function geocodePlace(
  placeName: string,
  city: string,
): Promise<GeocodeResult | null> {
  const cacheKey = `${placeName}::${city}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) || null;
  }

  const cleanedName = placeName
    .replace(/^(감성|카페|맛집|해수욕장|해변|미술관|전시|관광지|추천)\s+/g, '')
    .replace(/\s+(카페|맛집|해변|미술관)$/g, '')
    .trim();

  const noSpaceName = placeName.replace(/\s+/g, '');
  const noSpaceCleanedName = cleanedName.replace(/\s+/g, '');

  const candidateQueries = Array.from(
    new Set([
      `${cleanedName} ${city}`.trim(),
      `${noSpaceCleanedName} ${city}`.trim(),
      `${noSpaceName} ${city}`.trim(),
      noSpaceName,
      cleanedName,
      `${placeName} ${city}`.trim(),
      placeName,
    ]),
  ).filter(Boolean);

  for (const query of candidateQueries) {
    const coords = await fetchGeocode(query);
    if (coords) {
      geocodeCache.set(cacheKey, coords);
      return coords;
    }
  }

  geocodeCache.set(cacheKey, null);
  return null;
}
