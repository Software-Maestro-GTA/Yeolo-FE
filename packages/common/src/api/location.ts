/**
 * @file location.ts
 * @description API client functions for country and city autocomplete endpoints (API-LOC-1, API-LOC-2).
 */
import { createPublicHttpClient } from './kyClient';
import type {
  CountryAutocompleteResponse,
  CityAutocompleteResponse,
} from '../types';

/**
 * Fetches country autocomplete suggestions (API-LOC-1).
 *
 * @param baseUrl Base API URL
 * @param keyword Country name search keyword
 * @param limit Optional maximum number of suggestions
 * @returns Promise resolving to CountryAutocompleteResponse
 */
export async function fetchCountryAutocomplete(
  baseUrl: string,
  keyword: string,
  limit?: number,
): Promise<CountryAutocompleteResponse> {
  const client = createPublicHttpClient(baseUrl);
  const searchParams: Record<string, string | number> = { keyword };
  if (typeof limit === 'number') {
    searchParams.limit = limit;
  }
  const response = await client
    .get('api/locations/countries/autocomplete', {
      searchParams,
    })
    .json<CountryAutocompleteResponse>();
  return response;
}

/**
 * Fetches city autocomplete suggestions with optional country filter (API-LOC-2).
 *
 * @param baseUrl Base API URL
 * @param keyword City name search keyword
 * @param country Optional country name or ID filter
 * @param limit Optional maximum number of suggestions
 * @returns Promise resolving to CityAutocompleteResponse
 */
export async function fetchCityAutocomplete(
  baseUrl: string,
  keyword: string,
  country?: string,
  limit?: number,
): Promise<CityAutocompleteResponse> {
  const client = createPublicHttpClient(baseUrl);
  const searchParams: Record<string, string | number> = { keyword };
  if (country) {
    searchParams.country = country;
  }
  if (typeof limit === 'number') {
    searchParams.limit = limit;
  }
  const response = await client
    .get('api/locations/cities/autocomplete', {
      searchParams,
    })
    .json<CityAutocompleteResponse>();
  return response;
}
