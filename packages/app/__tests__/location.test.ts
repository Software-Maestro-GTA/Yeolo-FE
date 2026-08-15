/**
 * @file location.test.ts
 * @description Unit tests for fetchCountryAutocomplete (API-LOC-1) and fetchCityAutocomplete (API-LOC-2) in @yeolo/common with country filter and public authentication behavior.
 */
import {
  fetchCountryAutocomplete,
  fetchCityAutocomplete,
  setTokenGetter,
} from '@yeolo/common';

const API_URL = 'https://api.yeolo.com';

describe('Location Autocomplete API Unit Tests (API-LOC-1, API-LOC-2)', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    // Set token getter to simulate logged-in user with valid tokens
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

  describe('fetchCountryAutocomplete (API-LOC-1)', () => {
    it('should call GET /api/locations/countries/autocomplete without Authorization header', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          const headers =
            input instanceof Request
              ? input.headers
              : new Headers(init?.headers);

          expect(url).toContain('api/locations/countries/autocomplete');
          expect(url).toContain('keyword=%EB%8C%80%ED%95%9C%EB%AF%BC%EA%B5%AD'); // '대한민국'
          expect(headers.get('Authorization')).toBeNull();

          return new Response(
            JSON.stringify({
              status: 200,
              message: '국가 자동완성 조회 성공',
              data: {
                countries: [
                  {
                    countryId: 'c-1',
                    countryNameKo: '대한민국',
                  },
                ],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const result = await fetchCountryAutocomplete(API_URL, '대한민국');

      expect(result.status).toBe(200);
      expect(result.data.countries).toHaveLength(1);
      expect(result.data.countries[0].countryNameKo).toBe('대한민국');
    });

    it('should pass limit query parameter when provided', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any) => {
          const url = typeof input === 'string' ? input : input.url;
          expect(url).toContain('limit=5');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '국가 자동완성 조회 성공',
              data: { countries: [] },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      await fetchCountryAutocomplete(API_URL, '한', 5);
    });
  });

  describe('fetchCityAutocomplete (API-LOC-2)', () => {
    it('should call GET /api/locations/cities/autocomplete without country param and without Authorization header', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          const headers =
            input instanceof Request
              ? input.headers
              : new Headers(init?.headers);

          expect(url).toContain('api/locations/cities/autocomplete');
          expect(url).toContain('keyword=%EB%8F%84%EC%BF%84'); // '도쿄'
          expect(url).not.toContain('country=');
          expect(headers.get('Authorization')).toBeNull();

          return new Response(
            JSON.stringify({
              status: 200,
              message: '도시 자동완성 조회 성공',
              data: {
                cities: [
                  {
                    cityId: 'city-1',
                    cityNameKo: '도쿄',
                    countryId: 'c-2',
                    countryNameKo: '일본',
                  },
                ],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const result = await fetchCityAutocomplete(API_URL, '도쿄');

      expect(result.status).toBe(200);
      expect(result.data.cities).toHaveLength(1);
      expect(result.data.cities[0].cityNameKo).toBe('도쿄');
    });

    it('should include country query parameter when country argument is provided', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          const headers =
            input instanceof Request
              ? input.headers
              : new Headers(init?.headers);

          expect(url).toContain('api/locations/cities/autocomplete');
          expect(url).toContain('keyword=%EB%8F%84'); // '도'
          expect(url).toContain('country=%EC%9D%BC%EB%B3%B8'); // '일본'
          expect(headers.get('Authorization')).toBeNull();

          return new Response(
            JSON.stringify({
              status: 200,
              message: '도시 자동완성 조회 성공',
              data: {
                cities: [
                  {
                    cityId: 'city-1',
                    cityNameKo: '도쿄',
                    countryId: 'c-2',
                    countryNameKo: '일본',
                  },
                ],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const result = await fetchCityAutocomplete(API_URL, '도', '일본');

      expect(result.status).toBe(200);
      expect(result.data.cities[0].countryNameKo).toBe('일본');
      expect(result.data.cities[0].cityNameKo).toBe('도쿄');
    });

    it('should include limit query parameter when limit argument is provided', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any) => {
          const url = typeof input === 'string' ? input : input.url;
          expect(url).toContain('limit=10');
          expect(url).toContain('country=%EC%9D%BC%EB%B3%B8');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '도시 자동완성 조회 성공',
              data: { cities: [] },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      await fetchCityAutocomplete(API_URL, '도', '일본', 10);
    });
  });
});
