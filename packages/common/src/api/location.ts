/**
 * @file location.ts
 * @description API client functions for country list (API-LOC-1), city list by country (API-LOC-2), and location keyword search (API-LOC-3).
 */
import { createPublicHttpClient } from './kyClient';
import { ApiError } from './errors';
import { logger } from '../utils/logger';
import type {
  CountryListResponse,
  CityListResponse,
  LocationSearchResponse,
} from '../types/location';

/**
 * Fetches all supported countries (API-LOC-1).
 * Endpoint: GET /api/locations/countries
 *
 * @param baseUrl Base API URL
 * @param signal Optional cancellation signal
 * @returns Promise resolving to CountryListResponse
 */
export async function fetchCountriesApi(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<CountryListResponse> {
  logger.info('[LocationAPI] fetchCountriesApi request');
  const client = createPublicHttpClient(baseUrl);
  const response = await client.get('api/locations/countries', {
    signal: signal ?? null,
  });

  const result = (await response
    .json()
    .catch(() => null)) as CountryListResponse | null;

  if (!response.ok || !result || result.status !== 200) {
    const errorStatus = result?.status || response.status || 500;
    const errorMessage = result?.message || '국가 목록 조회에 실패했습니다.';
    logger.error(
      `[LocationAPI] fetchCountriesApi error (${errorStatus}):`,
      errorMessage,
    );
    throw new ApiError(errorStatus, errorMessage);
  }

  return result;
}

/**
 * Fetches all supported cities for a given country name (API-LOC-2).
 * Endpoint: GET /api/locations/cities?countryName={countryName}
 *
 * @param baseUrl Base API URL
 * @param countryName Target country name
 * @param signal Optional cancellation signal
 * @returns Promise resolving to CityListResponse
 */
export async function fetchCitiesApi(
  baseUrl: string,
  countryName: string,
  signal?: AbortSignal,
): Promise<CityListResponse> {
  logger.info('[LocationAPI] fetchCitiesApi request:', { countryName });
  const client = createPublicHttpClient(baseUrl);
  const response = await client.get('api/locations/cities', {
    searchParams: { countryName },
    signal: signal ?? null,
  });

  const result = (await response
    .json()
    .catch(() => null)) as CityListResponse | null;

  if (!response.ok || !result || result.status !== 200) {
    const errorStatus = result?.status || response.status || 500;
    const errorMessage = result?.message || '도시 목록 조회에 실패했습니다.';
    logger.error(
      `[LocationAPI] fetchCitiesApi error (${errorStatus}):`,
      errorMessage,
    );
    throw new ApiError(errorStatus, errorMessage);
  }

  return result;
}

/**
 * Searches countries and cities by keyword (API-LOC-3).
 * Endpoint: GET /api/locations/search?keyword={keyword}
 *
 * @param baseUrl Base API URL
 * @param keyword Search keyword
 * @param signal Optional cancellation signal
 * @returns Promise resolving to LocationSearchResponse
 */
export async function searchLocationsApi(
  baseUrl: string,
  keyword: string,
  signal?: AbortSignal,
): Promise<LocationSearchResponse> {
  logger.info('[LocationAPI] searchLocationsApi request:', { keyword });
  const client = createPublicHttpClient(baseUrl);
  const response = await client.get('api/locations/search', {
    searchParams: { keyword },
    signal: signal ?? null,
  });

  const result = (await response
    .json()
    .catch(() => null)) as LocationSearchResponse | null;

  if (!response.ok || !result || result.status !== 200) {
    const errorStatus = result?.status || response.status || 500;
    const errorMessage = result?.message || '검색 키워드를 입력해주세요.';
    logger.error(
      `[LocationAPI] searchLocationsApi error (${errorStatus}):`,
      errorMessage,
    );
    throw new ApiError(errorStatus, errorMessage);
  }

  return result;
}
