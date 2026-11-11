/**
 * @file appVersionApi.test.ts
 * @description Verifies deployed-version headers, HTTP 426 update handling, and authenticated request replay over MSW.
 * @jest-environment-options {"customExportConditions":["node","node-addons"]}
 */
import { delay, http, HttpResponse } from 'msw';
import {
  ApiError,
  AppVersionMismatchError,
  createHttpClient,
  createPublicHttpClient,
  getShareLinkApi,
  refreshTokenApi,
  setAcceptLanguage,
  setAppVersion,
  setTokenGetter,
  setTokenSetter,
  setUnauthorizedHandler,
  setVersionMismatchHandler,
} from '@yeolo/common';
import { server } from './mocks/server';

const API_URL = 'https://api.yeolo.app';
const VERSION_MESSAGE =
  '앱 버전이 맞지 않습니다. 최신 버전으로 업데이트해주세요.';
const refreshedTokens = {
  accessToken: 'renewed-access-token',
  refreshToken: 'renewed-refresh-token',
};

describe('app version HTTP contract', () => {
  const unauthorized = jest.fn();
  const versionMismatch = jest.fn();
  const saveTokens = jest.fn(async () => {});

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  beforeEach(() => {
    jest.clearAllMocks();
    setAppVersion('1.2.1');
    setAcceptLanguage('en');
    setTokenGetter(async () => ({
      accessToken: 'old-access-token',
      refreshToken: 'old-refresh-token',
    }));
    setTokenSetter(saveTokens);
    setUnauthorizedHandler(unauthorized);
    setVersionMismatchHandler(versionMismatch);
  });
  afterEach(() => {
    server.resetHandlers();
    setVersionMismatchHandler(null);
    setAppVersion('');
    setAcceptLanguage('ko');
    setTokenGetter(async () => ({}));
    setUnauthorizedHandler(() => {});
  });
  afterAll(() => server.close());

  it.each([
    ['authenticated', createHttpClient],
    ['public', createPublicHttpClient],
  ] as const)(
    'adds the configured version to %s requests',
    async (_, makeClient) => {
      const received: Record<string, string | null>[] = [];
      server.use(
        http.get('*/api/locations/search', ({ request }) => {
          received.push({
            version: request.headers.get('X-App-Version'),
            language: request.headers.get('Accept-Language'),
            authorization: request.headers.get('Authorization'),
          });
          return HttpResponse.json({ status: 200, data: { results: [] } });
        }),
      );
      const client = makeClient(API_URL);
      await client.get('api/locations/search');
      setAppVersion('1.2.2');
      await client.get('api/locations/search');
      expect(received.map((entry) => entry.version)).toEqual([
        '1.2.1',
        '1.2.2',
      ]);
      expect(received[0].language).toBe('en');
      expect(received[0].authorization).toBe(
        makeClient === createHttpClient ? 'Bearer old-access-token' : null,
      );
    },
  );

  it.each([createHttpClient, createPublicHttpClient])(
    'preserves a version explicitly supplied by the caller',
    async (makeClient) => {
      let receivedVersion: string | null = null;
      server.use(
        http.get('*/api/locations/search', ({ request }) => {
          receivedVersion = request.headers.get('X-App-Version');
          return HttpResponse.json({ status: 200, data: { results: [] } });
        }),
      );
      await makeClient(API_URL).get('api/locations/search', {
        headers: { 'X-App-Version': '2.0.0' },
      });
      expect(receivedVersion).toBe('2.0.0');
    },
  );

  it('sends the version with token refresh without replacing its authentication', async () => {
    let observed:
      | { version: string | null; authorization: string | null; body: unknown }
      | undefined;
    server.use(
      http.post('*/api/auth/refresh', async ({ request }) => {
        observed = {
          version: request.headers.get('X-App-Version'),
          authorization: request.headers.get('Authorization'),
          body: await request.json(),
        };
        return HttpResponse.json({ status: 200, data: refreshedTokens });
      }),
    );
    const result = await refreshTokenApi(API_URL, 'old-refresh-token');
    expect(observed).toEqual({
      version: '1.2.1',
      authorization: 'Bearer old-refresh-token',
      body: { refreshToken: 'old-refresh-token' },
    });
    expect(result.data).toEqual(refreshedTokens);
  });

  it.each([404, 426])(
    'looks up a shared course without a version header or update notice on HTTP %i',
    async (status) => {
      let observed: Record<string, string | null> | undefined;
      server.use(
        http.get('*/api/share-links/test-share', ({ request }) => {
          observed = {
            version: request.headers.get('X-App-Version'),
            authorization: request.headers.get('Authorization'),
            language: request.headers.get('Accept-Language'),
          };
          return HttpResponse.json(
            { status, message: '공유 링크 조회 실패', data: null },
            { status },
          );
        }),
      );

      await expect(
        getShareLinkApi(API_URL, 'test-share'),
      ).rejects.toMatchObject({
        name: 'ApiError',
        status,
      });
      expect(observed).toEqual({
        version: null,
        authorization: null,
        language: 'en',
      });
      expect(versionMismatch).not.toHaveBeenCalled();
      expect(unauthorized).not.toHaveBeenCalled();
    },
  );

  it.each(['authenticated', 'public', 'refresh'] as const)(
    'reports and throws the typed update error for a %s HTTP 426 response',
    async (kind) => {
      server.use(
        http.get('*/api/locations/search', () =>
          HttpResponse.json(
            { status: 426, message: VERSION_MESSAGE, data: null },
            { status: 426 },
          ),
        ),
        http.post('*/api/auth/refresh', () =>
          HttpResponse.json(
            { status: 426, message: VERSION_MESSAGE, data: null },
            { status: 426 },
          ),
        ),
      );
      const request =
        kind === 'refresh'
          ? refreshTokenApi(API_URL, 'old-refresh-token')
          : (kind === 'public' ? createPublicHttpClient : createHttpClient)(
              API_URL,
            ).get('api/locations/search');
      const error = await request.then(
        () => undefined,
        (failure: unknown) => failure,
      );
      expect(error).toBeInstanceOf(AppVersionMismatchError);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ status: 426, message: VERSION_MESSAGE });
      expect(versionMismatch).toHaveBeenCalledTimes(1);
      expect(versionMismatch).toHaveBeenCalledWith(error);
      expect(unauthorized).not.toHaveBeenCalled();
    },
  );

  it('uses an update message when the 426 body is not valid JSON', async () => {
    server.use(
      http.get('*/api/locations/search', () =>
        HttpResponse.text('<html>Upgrade Required</html>', { status: 426 }),
      ),
    );
    const error = await createPublicHttpClient(API_URL)
      .get('api/locations/search')
      .catch((failure: unknown) => failure);
    expect(error).toBeInstanceOf(AppVersionMismatchError);
    expect(error).toMatchObject({ status: 426, message: expect.any(String) });
    expect((error as Error).message.length).toBeGreaterThan(0);
    expect(versionMismatch).toHaveBeenCalledWith(error);
  });

  it('keeps ordinary 403 responses separate from version mismatch', async () => {
    server.use(
      http.get('*/api/locations/search', () =>
        HttpResponse.json(
          { status: 403, message: VERSION_MESSAGE, data: null },
          { status: 403 },
        ),
      ),
    );
    const response = await createPublicHttpClient(API_URL).get(
      'api/locations/search',
    );
    expect(response.status).toBe(403);
    expect(versionMismatch).not.toHaveBeenCalled();
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it('preserves a POST payload, app version, and refreshed token during silent refresh replay', async () => {
    const bodies: unknown[] = [];
    const versions: (string | null)[] = [];
    const languages: (string | null)[] = [];
    const authorizations: (string | null)[] = [];
    server.use(
      http.post('*/api/myrealtrip/links', async ({ request }) => {
        const text = await request.text();
        bodies.push(text ? JSON.parse(text) : null);
        versions.push(request.headers.get('X-App-Version'));
        languages.push(request.headers.get('Accept-Language'));
        authorizations.push(request.headers.get('Authorization'));
        return bodies.length === 1
          ? HttpResponse.json({ status: 401, data: null }, { status: 401 })
          : HttpResponse.json({
              status: 200,
              data: { url: 'https://myrealt.rip/test' },
            });
      }),
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json({ status: 200, data: refreshedTokens }),
      ),
    );
    const payload = { targetUrl: 'https://www.myrealtrip.com/' };
    const response = await createHttpClient(API_URL).post(
      'api/myrealtrip/links',
      {
        json: payload,
      },
    );
    expect(response.status).toBe(200);
    expect(bodies).toEqual([payload, payload]);
    expect(versions).toEqual(['1.2.1', '1.2.1']);
    expect(languages).toEqual(['en', 'en']);
    expect(authorizations).toEqual([
      'Bearer old-access-token',
      'Bearer renewed-access-token',
    ]);
    expect(saveTokens).toHaveBeenCalledWith(
      'renewed-access-token',
      'renewed-refresh-token',
    );
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it('does not log out when refresh itself reports a version mismatch', async () => {
    const originalRequest = jest.fn(() =>
      HttpResponse.json({ status: 401, data: null }, { status: 401 }),
    );
    server.use(
      http.get('*/api/users/me/language', originalRequest),
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json(
          { status: 426, message: VERSION_MESSAGE, data: null },
          { status: 426 },
        ),
      ),
    );
    await expect(
      createHttpClient(API_URL).get('api/users/me/language'),
    ).rejects.toBeInstanceOf(AppVersionMismatchError);
    expect(originalRequest).toHaveBeenCalledTimes(1);
    expect(versionMismatch).toHaveBeenCalledTimes(1);
    expect(unauthorized).not.toHaveBeenCalled();
    expect(saveTokens).not.toHaveBeenCalled();
  });

  it('handles HTTP 426 from the retried request through the same update callback', async () => {
    let requestCount = 0;
    server.use(
      http.get('*/api/users/me/language', () => {
        requestCount += 1;
        return requestCount === 1
          ? HttpResponse.json({ status: 401, data: null }, { status: 401 })
          : HttpResponse.json(
              { status: 426, message: VERSION_MESSAGE, data: null },
              { status: 426 },
            );
      }),
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json({ status: 200, data: refreshedTokens }),
      ),
    );
    await expect(
      createHttpClient(API_URL).get('api/users/me/language'),
    ).rejects.toBeInstanceOf(AppVersionMismatchError);
    expect(requestCount).toBe(2);
    expect(versionMismatch).toHaveBeenCalledTimes(1);
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it('preserves cancellation when the retried request is still responding', async () => {
    let markReplayStarted!: () => void;
    const replayStarted = new Promise<void>((resolve) => {
      markReplayStarted = resolve;
    });
    let requests = 0;
    server.use(
      http.get('*/api/users/me/language', async () => {
        requests += 1;
        if (requests === 1) {
          return HttpResponse.json(
            { status: 401, data: null },
            { status: 401 },
          );
        }
        markReplayStarted();
        await delay(100);
        return HttpResponse.json({ status: 200, data: { language: 'en' } });
      }),
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json({ status: 200, data: refreshedTokens }),
      ),
    );
    const controller = new AbortController();
    const request = createHttpClient(API_URL).get('api/users/me/language', {
      signal: controller.signal,
    });
    const rejection = expect(request).rejects.toMatchObject({
      name: 'AbortError',
    });
    await replayStarted;
    controller.abort();
    await rejection;
    expect(unauthorized).not.toHaveBeenCalled();
    expect(versionMismatch).not.toHaveBeenCalled();
  });
});
