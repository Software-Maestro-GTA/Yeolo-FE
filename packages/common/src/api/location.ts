/**
 * @file location.ts
 * @description API client functions for country and city autocomplete endpoints (API-LOC-1, API-LOC-2).
 */
import { createHttpClient } from './kyClient';
import type {
  CountryAutocompleteResponse,
  CityAutocompleteResponse,
} from '../types';

export async function fetchCountryAutocomplete(
  baseUrl: string,
  keyword: string,
): Promise<CountryAutocompleteResponse> {
  const client = createHttpClient(baseUrl);
  const response = await client
    .get('api/locations/countries/autocomplete', {
      searchParams: { keyword },
    })
    .json<CountryAutocompleteResponse>();
  return response;
}

export async function fetchCityAutocomplete(
  baseUrl: string,
  keyword: string,
): Promise<CityAutocompleteResponse> {
  const client = createHttpClient(baseUrl);
  const response = await client
    .get('api/locations/cities/autocomplete', {
      searchParams: { keyword },
    })
    .json<CityAutocompleteResponse>();
  return response;
}
