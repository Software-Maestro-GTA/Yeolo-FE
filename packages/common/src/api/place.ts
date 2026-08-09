/**
 * @file place.ts
 * @description API service functions for Place domain endpoints (API-PLACE-1).
 */
import { createHttpClient } from './kyClient';
import { ApiError } from './errors';
import { logger } from '../utils/logger';
import type { PlaceDetail, PlaceDetailResponse } from '../types/place';

/**
 * Fetch detailed place information by placeId (API-PLACE-1).
 * @param apiUrl Base backend API URL
 * @param accessToken User JWT access token
 * @param placeId Place identifier
 * @returns Promise resolving to PlaceDetail
 */
export async function getPlaceDetailApi(
  apiUrl?: string,
  accessToken?: string,
  placeId?: string,
): Promise<PlaceDetail> {
  const targetPlaceId = placeId || '';
  try {
    logger.info(
      '[PlaceAPI] getPlaceDetailApi request, placeId:',
      targetPlaceId,
    );
    const client = createHttpClient(apiUrl);
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await client.get(`api/places/${targetPlaceId}`, {
      headers,
    });

    const json = (await response
      .json()
      .catch(() => null)) as PlaceDetailResponse | null;

    logger.info(
      '[PlaceAPI] getPlaceDetailApi response status:',
      response.status,
      'body:',
      json,
    );

    if (response.ok && json && json.data && json.data.place) {
      return json.data.place;
    }

    const errorStatus = json?.status || response.status || 500;
    const errorMessage = json?.message || '장소 정보를 불러올 수 없습니다.';
    throw new ApiError(errorStatus, errorMessage);
  } catch (error: any) {
    logger.error(
      `[PlaceAPI] getPlaceDetailApi error (placeId: ${targetPlaceId}):`,
      error,
    );
    if (error instanceof ApiError) {
      throw error;
    }
    if (error?.response) {
      let status = error.response.status || 400;
      let message = '장소 정보를 불러오지 못했습니다.';
      try {
        const json = await error.response.json();
        if (json?.message) message = json.message;
      } catch (_) {
        // Fallback
      }
      throw new ApiError(status, message);
    }
    throw new ApiError(500, error?.message || '네트워크 오류가 발생했습니다.');
  }
}
