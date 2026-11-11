/**
 * @file location.test.ts
 * @description Unit tests for API-LOC-1 (countries), API-LOC-2 (cities), and API-LOC-3 (search).
 */
import {
  fetchCountriesApi,
  fetchCitiesApi,
  searchLocationsApi,
} from '../location';
import { setTokenGetter } from '../kyClient';
import { ApiError } from '../errors';

const API_URL = 'https://api.yeolo.com';

describe('Location API Unit Tests (API-LOC-1, API-LOC-2, API-LOC-3)', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    setTokenGetter(async () => ({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }));
  });

  afterEach(() => {
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });

  describe('1. fetchCountriesApi (API-LOC-1)', () => {
    it('GET /api/locations/countries 호출 시 Accept-Language 헤더를 포함하고 인증 헤더 없이 국가 전체 목록을 반환해야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          const method =
            typeof input === 'string' ? init?.method || 'GET' : input.method;
          const headers =
            input instanceof Request
              ? input.headers
              : new Headers(init?.headers);

          expect(url).toBe('https://api.yeolo.com/api/locations/countries');
          expect(method.toUpperCase()).toBe('GET');
          expect(headers.get('Authorization')).toBeNull();
          expect(headers.get('Accept-Language')).toBe('ko');

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
      expect(result.data.countries).toEqual([
        { countryName: '대한민국' },
        { countryName: '일본' },
      ]);
    });

    it('500 서버 오류 시 ApiError를 던져야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async () => {
          return new Response(
            JSON.stringify({
              status: 500,
              message: '국가 목록 조회에 실패했습니다.',
              data: null,
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          );
        });

      await expect(fetchCountriesApi(API_URL)).rejects.toThrow(ApiError);
    });
  });

  describe('2. fetchCitiesApi (API-LOC-2)', () => {
    it('GET /api/locations/cities?countryName=... 호출 시 해당 국가의 도시 목록을 반환해야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          const headers =
            input instanceof Request
              ? input.headers
              : new Headers(init?.headers);

          expect(url).toContain('api/locations/cities');
          expect(url).toContain('countryName=%EC%9D%BC%EB%B3%B8');
          expect(headers.get('Authorization')).toBeNull();
          expect(headers.get('Accept-Language')).toBe('ko');

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
      expect(result.data.cities).toEqual([
        { cityName: '도쿄' },
        { cityName: '오사카' },
      ]);
    });

    it('400 또는 404 에러 시 ApiError를 던져야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async () => {
          return new Response(
            JSON.stringify({
              status: 404,
              message: '해당 국가를 찾을 수 없습니다.',
              data: null,
            }),
            { status: 404, headers: { 'Content-Type': 'application/json' } },
          );
        });

      await expect(fetchCitiesApi(API_URL, '없는국가')).rejects.toThrow(
        ApiError,
      );
    });
  });

  describe('3. searchLocationsApi (API-LOC-3)', () => {
    it('GET /api/locations/search?keyword=... 호출 시 국가·도시 검색 결과를 반환해야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          const headers =
            input instanceof Request
              ? input.headers
              : new Headers(init?.headers);

          expect(url).toContain('api/locations/search');
          expect(url).toContain('keyword=%EC%9D%BC%EB%B3%B8');
          expect(headers.get('Authorization')).toBeNull();
          expect(headers.get('Accept-Language')).toBe('ko');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '국가·도시 검색 성공',
              data: {
                results: [
                  {
                    countryName: '일본',
                    cities: [{ cityName: '도쿄' }, { cityName: '오사카' }],
                  },
                ],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const result = await searchLocationsApi(API_URL, '일본');

      expect(result.status).toBe(200);
      expect(result.data.results).toEqual([
        {
          countryName: '일본',
          cities: [{ cityName: '도쿄' }, { cityName: '오사카' }],
        },
      ]);
    });

    it('400 에러(빈 키워드 등) 시 ApiError를 던져야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async () => {
          return new Response(
            JSON.stringify({
              status: 400,
              message: '검색 키워드를 입력해주세요.',
              data: null,
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          );
        });

      await expect(searchLocationsApi(API_URL, '')).rejects.toThrow(ApiError);
    });
  });
});
