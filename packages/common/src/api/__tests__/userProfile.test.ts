/**
 * @file userProfile.test.ts
 * @description Unit tests for updateUserProfileApi (API-USER-1), withdrawApi (API-USER-2), getUserLanguageApi (API-USER-3), and updateUserLanguageApi (API-USER-4).
 */
import {
  updateUserProfileApi,
  withdrawApi,
  getUserLanguageApi,
  updateUserLanguageApi,
} from '../user';
import { ApiError } from '../errors';
import { setAcceptLanguage } from '../kyClient';

const API_URL = 'https://api.yeolo.com';

describe('User API Unit Tests (API-USER-1~4)', () => {
  let fetchSpy: jest.SpyInstance;
  const originalXhr = (globalThis as any).XMLHttpRequest;

  beforeEach(() => {
    delete (globalThis as any).XMLHttpRequest;
    setAcceptLanguage('ko');
  });

  afterEach(() => {
    (globalThis as any).XMLHttpRequest = originalXhr;
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });

  describe('1. updateUserProfileApi (API-USER-1)', () => {
    it('displayName과 profileImage가 전송되었을 때 FormData에 email 없이 정상 포함하여 PATCH /api/users/me/profile 성공 응답을 반환해야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          expect(url).toContain('api/users/me/profile');
          expect(init?.method).toBe('PATCH');
          expect(init?.headers?.['Accept-Language']).toBe('ko');

          const formData = init?.body as FormData;
          expect(formData).toBeDefined();
          expect(formData.get('email')).toBeNull();
          expect(formData.get('displayName')).toBe('새닉네임');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '사용자 프로필 수정 성공',
              data: {
                user: {
                  userId: '550e8400-e29b-41d4-a716-446655440000',
                  provider: 'google',
                  email: 'user@gmail.com',
                  displayName: '새닉네임',
                  profileImageUrl: 'https://images.unsplash.com/avatar.jpg',
                  status: 'active',
                  lastLoginAt: '2026-08-15T00:00:00Z',
                },
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const result = await updateUserProfileApi(API_URL, 'mock-access-token', {
        displayName: '새닉네임',
        profileImage: null,
      });

      expect(result.status).toBe(200);
      expect(result.message).toBe('사용자 프로필 수정 성공');
      expect(result.data.user.displayName).toBe('새닉네임');
    });

    it('서버에서 400 에러를 반환하는 경우 ApiError를 발생시켜야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async () => {
          return new Response(
            JSON.stringify({
              status: 400,
              message: '사용자 프로필 입력값을 확인해주세요.',
              data: null,
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          );
        });

      await expect(
        updateUserProfileApi(API_URL, 'mock-access-token', {
          displayName: '   ',
          profileImage: null,
        }),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('2. withdrawApi (API-USER-2)', () => {
    it('DELETE /api/users/me 호출 시 회원탈퇴 성공 응답을 반환해야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          const method =
            typeof input === 'string' ? init?.method : input.method;
          const headers =
            input instanceof Request
              ? input.headers
              : new Headers(init?.headers);

          expect(url).toContain('api/users/me');
          expect(method.toUpperCase()).toBe('DELETE');
          expect(headers.get('Authorization')).toBe('Bearer mock-access-token');
          expect(headers.get('Accept-Language')).toBe('ko');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '회원탈퇴 성공',
              data: null,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const result = await withdrawApi(API_URL, 'mock-access-token', {
        reason: '개인 사유',
      });
      expect(result.status).toBe(200);
      expect(result.message).toBe('회원탈퇴 성공');
    });
  });

  describe('3. getUserLanguageApi (API-USER-3)', () => {
    it('GET /api/users/me/language 호출 시 내 언어 설정을 조회해야 한다', async () => {
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

          expect(url).toBe('https://api.yeolo.com/api/users/me/language');
          expect(method.toUpperCase()).toBe('GET');
          expect(headers.get('Authorization')).toBe('Bearer mock-access-token');
          expect(headers.get('Accept-Language')).toBe('ko');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '언어 설정 조회 성공',
              data: {
                language: 'ko',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const result = await getUserLanguageApi(API_URL, 'mock-access-token');
      expect(result.status).toBe(200);
      expect(result.data.language).toBe('ko');
    });
  });

  describe('4. updateUserLanguageApi (API-USER-4)', () => {
    it('POST /api/users/me/language 호출 시 언어 설정을 변경하고 반환해야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          const method =
            typeof input === 'string' ? init?.method : input.method;
          const headers =
            input instanceof Request
              ? input.headers
              : new Headers(init?.headers);
          const rawBody =
            input instanceof Request ? await input.text() : init?.body;
          const body = JSON.parse(rawBody || '{}');

          expect(url).toBe('https://api.yeolo.com/api/users/me/language');
          expect(method.toUpperCase()).toBe('POST');
          expect(headers.get('Authorization')).toBe('Bearer mock-access-token');
          expect(headers.get('Accept-Language')).toBe('ko');
          expect(body).toEqual({ language: 'ko' });

          return new Response(
            JSON.stringify({
              status: 200,
              message: '언어 설정 변경 성공',
              data: {
                language: 'ko',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const result = await updateUserLanguageApi(API_URL, 'mock-access-token', {
        language: 'ko',
      });
      expect(result.status).toBe(200);
      expect(result.data.language).toBe('ko');
    });

    it('지원하지 않는 언어 코드 전달 시 400 ApiError를 던져야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async () => {
          return new Response(
            JSON.stringify({
              status: 400,
              message: '지원하는 언어 코드를 입력해주세요.',
              data: null,
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          );
        });

      await expect(
        updateUserLanguageApi(API_URL, 'mock-access-token', {
          language: 'invalid',
        }),
      ).rejects.toThrow(ApiError);
    });
  });
});
