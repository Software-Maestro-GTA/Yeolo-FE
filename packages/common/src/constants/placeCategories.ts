/**
 * @file placeCategories.ts
 * @description Korean display labels for the seven verified public place categories; raw place types remain unchanged.
 */

export const PLACE_CATEGORY_LABELS = {
  FOOD: '맛집·미식',
  CAFE: '카페·디저트',
  SPOT: '스팟·명소',
  CULTURE: '문화·전시',
  NATURE: '자연·산책',
  ACTIVITY: '액티비티·체험',
  NIGHTLIFE: '야경·나이트',
} as const;

export type PlaceCategoryCode = keyof typeof PLACE_CATEGORY_LABELS;

/**
 * Formats a server-assigned category for display without reclassifying the place.
 * @param category Public category code or a legacy display value.
 * @returns The Korean label, an unchanged legacy value, or an empty string when absent.
 */
export function getPlaceCategoryLabel(category?: string | null): string {
  const value = category?.trim() || '';
  return Object.prototype.hasOwnProperty.call(PLACE_CATEGORY_LABELS, value)
    ? PLACE_CATEGORY_LABELS[value as PlaceCategoryCode]
    : value;
}
