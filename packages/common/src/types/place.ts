/**
 * @file place.ts
 * @description Data model interfaces and response types for Place API operations (API-PLACE-1).
 */

export interface PlaceDetail {
  placeId: string;
  placeName: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number | null;
  photoUrls?: string[];
  openingHours?: string[];
}

export interface PlaceDetailResponse {
  status: number;
  message: string;
  data: {
    place: PlaceDetail;
  } | null;
}
