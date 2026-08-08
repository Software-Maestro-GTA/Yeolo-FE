/**
 * @file authInterceptor.test.ts
 * @description Unit tests for refreshTokenApi and 401 HTTP interceptor (API-AUTH-3).
 */
import ky from 'ky';
import {
  refreshTokenApi,
  createHttpClient,
  setTokenGetter,
  setTokenSetter,
  setUnauthorizedHandler,
} from '../kyClient';
import { ApiError } from '../errors';

// Mock server URL
const API_URL = 'https://api.yeolo.com';

describe('refreshTokenApi & 401 Interceptor Unit Tests', () => {
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
    it('should call POST /api/auth/refresh and return new tokens on 200 OK', async () => {
      const mockResponseData = {
        status: 200,
        message: '토큰 재발급 성공',
        data: {
          accessToken: 'new-access-token-123',
          refreshToken: 'new-refresh-token-456',
        },
      };

      jest.spyOn(ky, 'post').mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponseData),
        } as any);
      });

      const result = await refreshTokenApi(API_URL, 'valid-refresh-token');

      expect(result.data.accessToken).toBe('new-access-token-123');
      expect(result.data.refreshToken).toBe('new-refresh-token-456');
    });

    it('should throw ApiError(401) when refresh token is expired or invalid', async () => {
      const mockErrorData = {
        status: 401,
        message: 'Refresh Token이 유효하지 않거나 만료되었습니다.',
        data: null,
      };

      jest.spyOn(ky, 'post').mockImplementationOnce(() => {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve(mockErrorData),
        } as any);
      });

      await expect(
        refreshTokenApi(API_URL, 'mock-expired-refresh-token'),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('2. 401 Interceptor and Silent Refresh', () => {
    it('should automatically refresh token and retry failed request on 401 Unauthorized', async () => {
      const client = createHttpClient(API_URL);

      let callCount = 0;
      // First call returns 401, second call after refresh returns 200
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

      await expect(client.get('api/courses').json()).rejects.toThrow();

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
            // Small delay to simulate network latency
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

      // Fire 3 requests concurrently
      const results = await Promise.all([
        client.get('api/courses').json<{ status: number }>(),
        client.get('api/users/me').json<{ status: number }>(),
        client.get('api/taste-profile').json<{ status: number }>(),
      ]);

      expect(results.length).toBe(3);
      results.forEach((res) => expect(res.status).toBe(200));
      expect(refreshCallCount).toBe(1);

      fetchSpy.mockRestore();
    });
  });
});
