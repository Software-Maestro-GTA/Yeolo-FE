/**
 * @file taste.test.ts
 * @description Unit tests for Taste API (API-PREF-3, API-PREF-4).
 */
import { analyzeTastePreferenceStream, fetchTasteProfileApi } from '../taste';
import { ApiError } from '../errors';

const API_URL = 'https://api.yeolo.com';

describe('Taste API Unit Tests (API-PREF-3, API-PREF-4)', () => {
  let fetchSpy: jest.SpyInstance;

  afterEach(() => {
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });

  describe('1. fetchTasteProfileApi (API-PREF-4)', () => {
    it('GET /api/users/me/taste-profile 호출 시 intro, hashtags, types, recommendCity가 포함된 데이터를 반환해야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          const headers =
            input instanceof Request
              ? input.headers
              : new Headers(init?.headers);

          expect(url).toBe('https://api.yeolo.com/api/users/me/taste-profile');
          expect(headers.get('Authorization')).toBe('Bearer mock-access-token');
          expect(headers.get('Accept-Language')).toBe('ko');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '성향 프로필 조회 성공',
              data: {
                intro: '여유로운 로컬 미식 탐험가',
                hashtags: ['#로컬맛집', '#여유로운일정', '#자연힐링'],
                types: [
                  {
                    typeCode: 'PACE',
                    typeName: '여행 템포',
                    lowName: '여유롭게',
                    highName: '알차게',
                    score: 35,
                  },
                ],
                recommendCity: {
                  countryName: '일본',
                  cityName: '교토',
                  imageUrl: 'https://example.com/kyoto.jpg',
                  reason: '고즈넉한 골목과 전통 미식이 어울리는 도시입니다.',
                },
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const result = await fetchTasteProfileApi(API_URL, 'mock-access-token');

      expect(result.intro).toBe('여유로운 로컬 미식 탐험가');
      expect(result.hashtags).toEqual([
        '#로컬맛집',
        '#여유로운일정',
        '#자연힐링',
      ]);
      expect(result.types[0]).toEqual({
        typeCode: 'PACE',
        typeName: '여행 템포',
        lowName: '여유롭게',
        highName: '알차게',
        score: 35,
      });
      expect(result.recommendCity).toEqual({
        countryName: '일본',
        cityName: '교토',
        imageUrl: 'https://example.com/kyoto.jpg',
        reason: '고즈넉한 골목과 전통 미식이 어울리는 도시입니다.',
      });
    });

    it('404 성향 프로필 없음 응답 시 ApiError(404)를 던져야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async () => {
          return new Response(
            JSON.stringify({
              status: 404,
              message: '저장된 성향 프로필이 없습니다.',
              data: null,
            }),
            { status: 404, headers: { 'Content-Type': 'application/json' } },
          );
        });

      await expect(
        fetchTasteProfileApi(API_URL, 'mock-access-token'),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('2. analyzeTastePreferenceStream (API-PREF-3)', () => {
    it('POST /api/users/me/taste-profile/analysis 호출 시 400 에러가 반환되면 서버 메시지와 함께 ApiError를 던져야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (_input: any, init: any) => {
          expect(init?.headers?.['Accept-Language']).toBe('ko');
          return new Response(
            JSON.stringify({
              status: 400,
              message: '분석 가능한 이미지 메타데이터가 부족합니다.',
              data: null,
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          );
        });

      await expect(
        analyzeTastePreferenceStream(
          API_URL,
          'mock-access-token',
          {
            images: [
              {
                sourceImageId: 'img-1',
                capturedAt: '2026-10-01T00:00:00Z',
                latitude: 37.5665,
                longitude: 126.978,
              },
            ],
          },
          {},
        ),
      ).rejects.toThrow('분석 가능한 이미지 메타데이터가 부족합니다.');
    });
  });
});
