/**
 * @file location.ts
 * @description Location API request and response types for API-LOC-1, API-LOC-2, and API-LOC-3.
 */

export interface CountryItem {
  countryName: string;
}

export interface CountryListResponse {
  status: number;
  message: string;
  data: {
    countries: CountryItem[];
  };
}

export interface CityListParams {
  countryName: string;
}

export interface CityItem {
  cityName: string;
}

export interface CityListResponse {
  status: number;
  message: string;
  data: {
    cities: CityItem[];
  };
}

export interface LocationSearchParams {
  keyword: string;
}

export interface LocationSearchResultItem {
  countryName: string;
  cities: CityItem[];
}

export interface LocationSearchResponse {
  status: number;
  message: string;
  data: {
    results: LocationSearchResultItem[];
  };
}
