/**
 * @file geocode.ts
 * @description Geocoding utility service using OpenStreetMap Nominatim API.
 * @author Antigravity Agent
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

export async function fetchGeocode(query: string): Promise<GeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=kr&limit=5`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'YeoloTravelApp/1.0',
      },
    });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const bestMatch =
        data.find(
          (item: any) =>
            item.class === 'tourism' ||
            item.class === 'amenity' ||
            item.class === 'leisure' ||
            item.type === 'point'
        ) || data[0];
      return {
        latitude: parseFloat(bestMatch.lat),
        longitude: parseFloat(bestMatch.lon),
      };
    }
  } catch (err) {
    // ignore fetch error
  }
  return null;
}

/**
 * OpenStreetMap Nominatim Geocoding API를 활용한 스마트 검색어 정제 및 다단계 지오코딩 공통 유틸
 */
export async function geocodePlace(placeName: string, city: string): Promise<GeocodeResult | null> {
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
    ])
  ).filter(Boolean);

  for (const query of candidateQueries) {
    const coords = await fetchGeocode(query);
    if (coords) {
      return coords;
    }
  }

  return null;
}
