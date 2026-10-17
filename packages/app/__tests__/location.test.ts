/**
 * @file location.test.ts
 * @description Unit tests for fetchCountriesApi (API-LOC-1), fetchCitiesApi (API-LOC-2), and searchLocationsApi (API-LOC-3) in @yeolo/common.
 */
import {
  fetchCountriesApi,
  fetchCitiesApi,
  searchLocationsApi,
  setTokenGetter,
} from '@yeolo/common';

const API_URL = 'https://api.yeolo.com';

describe('Location API Unit Tests (API-LOC-1, API-LOC-2, API-LOC-3)', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    setTokenGetter(async () => ({
      accessToken: 'mock-user-access-token',
      refreshToken: 'mock-user-refresh-token',
    }));
  });

  afterEach(() => {
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });

  describe('fetchCountriesApi (API-LOC-1)', () => {
    it('should call GET /api/locations/countries with Bearer token and return countries', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;

          expect(url).toContain('api/locations/countries');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '국가 목록 조회 성공',
              data: {
                countries: [
                  { countryName: '대한민국' },
                  { countryName: '일본' },
                ],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const result = await fetchCountriesApi(API_URL);

      expect(result.status).toBe(200);
      expect(result.data.countries).toHaveLength(2);
      expect(result.data.countries[0].countryName).toBe('대한민국');
    });
  });

  describe('fetchCitiesApi (API-LOC-2)', () => {
    it('should call GET /api/locations/cities?countryName=... with Bearer token', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;

          expect(url).toContain('api/locations/cities');
          expect(url).toContain('countryName=%EC%9D%BC%EB%B3%B8');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '도시 목록 조회 성공',
              data: {
                cities: [{ cityName: '도쿄' }, { cityName: '오사카' }],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const result = await fetchCitiesApi(API_URL, '일본');

      expect(result.status).toBe(200);
      expect(result.data.cities).toHaveLength(2);
      expect(result.data.cities[0].cityName).toBe('도쿄');
    });
  });

  describe('searchLocationsApi (API-LOC-3)', () => {
    it('should call GET /api/locations/search?keyword=... with Bearer token', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;

          expect(url).toContain('api/locations/search');
          expect(url).toContain('keyword=%EB%8F%84%EC%BF%84');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '지역 검색 성공',
              data: {
                results: [
                  {
                    countryName: '일본',
                    cities: [{ cityName: '도쿄' }],
                  },
                ],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const result = await searchLocationsApi(API_URL, '도쿄');

      expect(result.status).toBe(200);
      expect(result.data.results[0].countryName).toBe('일본');
      expect(result.data.results[0].cities[0].cityName).toBe('도쿄');
    });
  });
});
