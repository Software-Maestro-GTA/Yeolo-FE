/**
 * @file authInterceptor.test.ts
 * @description Unit tests for Auth APIs (API-AUTH-1~4) and 401 HTTP interceptor.
 */
import ky from 'ky';
import {
  refreshTokenApi,
  createHttpClient,
  setTokenGetter,
  setTokenSetter,
  setUnauthorizedHandler,
} from '../kyClient';
import { loginWithGoogleApi, loginWithAppleApi, logoutApi } from '../auth';
import { ApiError } from '../errors';

// Mock server URL
const API_URL = 'https://api.yeolo.com';

describe('Auth API & 401 Interceptor Unit Tests (API-AUTH-1~4)', () => {
  let mockAccessToken = 'expired-access-token';
  let mockRefreshToken = 'valid-refresh-token';
  let isUnauthorizedCalled = false;
  let updatedTokens: { accessToken?: string; refreshToken?: string } = {};

  beforeEach(() => {
    mockAccessToken = 'expired-access-token';
    mockRefreshToken = 'valid-refresh-token';
    isUnauthorizedCalled = false;
    updatedTokens = {};

    setTokenGetter(async () => ({
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    }));

    setTokenSetter(async (accessToken, refreshToken) => {
      mockAccessToken = accessToken;
      mockRefreshToken = refreshToken;
      updatedTokens = { accessToken, refreshToken };
    });

    setUnauthorizedHandler(() => {
      isUnauthorizedCalled = true;
    });
  });

  describe('1. refreshTokenApi (API-AUTH-3)', () => {
    it('should call POST /api/auth/refresh with Accept-Language and return new tokens on 200 OK', async () => {
      const mockResponseData = {
        status: 200,
        message: '토큰 재발급 성공',
        data: {
          accessToken: 'new-access-token-123',
          refreshToken: 'new-refresh-token-456',
        },
      };

      const postSpy = jest
        .spyOn(ky, 'post')
        .mockImplementationOnce((_url, options: any) => {
          expect(options?.headers?.['Accept-Language']).toBe('ko');
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockResponseData),
          } as any);
        });

      const result = await refreshTokenApi(API_URL, 'valid-refresh-token');

      expect(result.data.accessToken).toBe('new-access-token-123');
      expect(result.data.refreshToken).toBe('new-refresh-token-456');
      postSpy.mockRestore();
    });

    it('should throw ApiError(401) when refresh token is expired or invalid', async () => {
      const mockErrorData = {
        status: 401,
        message: 'Refresh Token이 유효하지 않거나 만료되었습니다.',
        data: null,
      };

      const postSpy = jest.spyOn(ky, 'post').mockImplementationOnce(() => {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve(mockErrorData),
        } as any);
      });

      await expect(
        refreshTokenApi(API_URL, 'mock-expired-refresh-token'),
      ).rejects.toThrow(ApiError);
      postSpy.mockRestore();
    });
  });

  describe('2. loginWithGoogleApi, loginWithAppleApi, logoutApi (API-AUTH-1, 2, 4)', () => {
    it('loginWithGoogleApi should call POST /api/auth/google without Authorization and with Accept-Language: ko', async () => {
      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementationOnce(async (input: any, init: any) => {
          const headers =
            input instanceof Request
              ? input.headers
              : new Headers(init?.headers);
          expect(headers.get('Authorization')).toBeNull();
          expect(headers.get('Accept-Language')).toBe('ko');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '로그인 성공',
              data: {
                user: {
                  userId: 'u-1',
                  provider: 'google',
                  email: 'user@gmail.com',
                  displayName: '여로',
                  profileImageUrl: null,
                  status: 'active',
                  lastLoginAt: '2026-10-14T00:00:00Z',
                },
                doOnboarding: true,
                recentCourseId: null,
                accessToken: 'acc-1',
                refreshToken: 'ref-1',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const res = await loginWithGoogleApi(API_URL, {
        code: 'google-code',
        redirectUri: 'yeolo://oauth',
      });
      expect(res.data.user.provider).toBe('google');
      expect(res.data.doOnboarding).toBe(true);
      fetchSpy.mockRestore();
    });

    it('loginWithAppleApi should call POST /api/auth/apple without Authorization and with Accept-Language: ko', async () => {
      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementationOnce(async (input: any, init: any) => {
          const headers =
            input instanceof Request
              ? input.headers
              : new Headers(init?.headers);
          expect(headers.get('Authorization')).toBeNull();
          expect(headers.get('Accept-Language')).toBe('ko');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '로그인 성공',
              data: {
                user: {
                  userId: 'u-2',
                  provider: 'apple',
                  email: null,
                  displayName: null,
                  profileImageUrl: null,
                  status: 'active',
                  lastLoginAt: '2026-10-14T00:00:00Z',
                },
                doOnboarding: false,
                recentCourseId: 'course-1',
                accessToken: 'acc-2',
                refreshToken: 'ref-2',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const res = await loginWithAppleApi(API_URL, {
        code: 'apple-code',
        redirectUri: 'yeolo://oauth',
        idToken: null,
      });
      expect(res.data.user.provider).toBe('apple');
      expect(res.data.recentCourseId).toBe('course-1');
      fetchSpy.mockRestore();
    });

    it('logoutApi should call POST /api/auth/logout with Authorization and Accept-Language: ko', async () => {
      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementationOnce(async (input: any, init: any) => {
          const headers =
            input instanceof Request
              ? input.headers
              : new Headers(init?.headers);
          expect(headers.get('Authorization')).toBe('Bearer valid-token');
          expect(headers.get('Accept-Language')).toBe('ko');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '로그아웃 성공',
              data: null,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const res = await logoutApi(API_URL, 'valid-token', {
        refreshToken: 'ref-1',
      });
      expect(res.status).toBe(200);
      fetchSpy.mockRestore();
    });
  });

  describe('3. 401 Interceptor and Silent Refresh', () => {
    it('should automatically refresh token and retry failed request on 401 Unauthorized', async () => {
      const client = createHttpClient(API_URL);

      let callCount = 0;
      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(async (input: any) => {
          const url = typeof input === 'string' ? input : input.url;

          if (url.includes('/api/auth/refresh')) {
            return new Response(
              JSON.stringify({
                status: 200,
                message: '토큰 재발급 성공',
                data: {
                  accessToken: 'refreshed-access-token',
                  refreshToken: 'refreshed-refresh-token',
                },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            );
          }

          callCount++;
          if (callCount === 1) {
            return new Response(
              JSON.stringify({ status: 401, message: 'AccessToken expired' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } },
            );
          }

          return new Response(
            JSON.stringify({
              status: 200,
              message: 'Success',
              data: { courses: [] },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const res = await client.get('api/courses').json<{ status: number }>();

      expect(res.status).toBe(200);
      expect(updatedTokens.accessToken).toBe('refreshed-access-token');
      expect(updatedTokens.refreshToken).toBe('refreshed-refresh-token');
      expect(isUnauthorizedCalled).toBe(false);

      fetchSpy.mockRestore();
    });

    it('should trigger onUnauthorized handler when refresh token is also invalid (401)', async () => {
      mockRefreshToken = 'mock-expired-refresh-token';
      const client = createHttpClient(API_URL);

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(async (input: any) => {
          const url = typeof input === 'string' ? input : input.url;

          if (url.includes('/api/auth/refresh')) {
            return new Response(
              JSON.stringify({
                status: 401,
                message: 'Refresh Token이 유효하지 않거나 만료되었습니다.',
                data: null,
              }),
              { status: 401, headers: { 'Content-Type': 'application/json' } },
            );
          }

          return new Response(
            JSON.stringify({ status: 401, message: 'AccessToken expired' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const res = await client.get('api/courses').json<{ status: number }>();

      expect(res.status).toBe(401);
      expect(isUnauthorizedCalled).toBe(true);

      fetchSpy.mockRestore();
    });

    it('should handle concurrent 401 requests with a single refresh request', async () => {
      const client = createHttpClient(API_URL);

      let refreshCallCount = 0;
      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(async (input: any) => {
          const url = typeof input === 'string' ? input : input.url;

          if (url.includes('/api/auth/refresh')) {
            refreshCallCount++;
            await new Promise((r) => setTimeout(r, 50));
            return new Response(
              JSON.stringify({
                status: 200,
                message: '토큰 재발급 성공',
                data: {
                  accessToken: 'concurrent-access-token',
                  refreshToken: 'concurrent-refresh-token',
                },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            );
          }

          const headers = input.headers
            ? new Headers(input.headers)
            : new Headers();
          const auth = headers.get('Authorization');

          if (auth !== 'Bearer concurrent-access-token') {
            return new Response(
              JSON.stringify({ status: 401, message: 'Unauthorized' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } },
            );
          }

          return new Response(JSON.stringify({ status: 200, data: 'OK' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        });

      const results = await Promise.all([
        client.get('api/courses').json<{ status: number }>(),
        client.get('api/users/me/language').json<{ status: number }>(),
        client.get('api/users/me/taste-profile').json<{ status: number }>(),
      ]);

      expect(results.length).toBe(3);
      results.forEach((res) => expect(res.status).toBe(200));
      expect(refreshCallCount).toBe(1);

      fetchSpy.mockRestore();
    });
  });
});
