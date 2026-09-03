/**
 * @file location.ts
 * @description Location autocomplete API request/response types for API-LOC-1 and API-LOC-2.
 */

export interface CountryAutocompleteParams {
  keyword: string;
  limit?: number;
}

export interface CityAutocompleteParams {
  keyword: string;
  country?: string;
  limit?: number;
}

export interface CountryAutocompleteItem {
  countryId: string;
  countryNameKo: string;
}

export interface CityAutocompleteItem {
  cityId: string;
  cityNameKo: string;
  countryId: string;
  countryNameKo: string;
}

export interface CountryAutocompleteResponse {
  status: number;
  message: string;
  data: {
    countries: CountryAutocompleteItem[];
  };
}

export interface CityAutocompleteResponse {
  status: number;
  message: string;
  data: {
    cities: CityAutocompleteItem[];
  };
}
