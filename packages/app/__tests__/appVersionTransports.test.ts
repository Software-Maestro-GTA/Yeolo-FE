/**
 * @jest-environment node
 * @file appVersionTransports.test.ts
 * @description Verifies version enforcement for profile multipart uploads and taste SSE transports that bypass ky.
 */
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { updateUserProfileApi } from '../../common/src/api/user';
import { analyzeTastePreferenceStream } from '../../common/src/api/taste';
import {
  setAcceptLanguage,
  setAppVersion,
  setVersionMismatchHandler,
} from '../../common/src/api/kyClient';
import { AppVersionMismatchError } from '../../common/src/api/errors';

jest.mock('parse-sse', () => {
  Object.assign(globalThis, require('node:stream/web'));
  return jest.requireActual('parse-sse');
});

const server = setupServer();
const apiUrl = 'https://api.test';
const originalXhr = Object.getOwnPropertyDescriptor(
  globalThis,
  'XMLHttpRequest',
);
const mismatch = jest.fn();
const profileResult = {
  status: 200,
  message: '프로필 정보 수정 성공',
  data: { user: { displayName: '업데이트 사용자' } },
};
const payload = {
  images: [
    {
      sourceImageId: 'test-image',
      capturedAt: '2026-11-07T00:00:00Z',
      latitude: 37.5,
      longitude: 127,
    },
  ],
};
const update = () =>
  updateUserProfileApi(apiUrl, 'user-token', {
    displayName: '업데이트 사용자',
  });
const analyze = () =>
  analyzeTastePreferenceStream(apiUrl, 'user-token', payload, {});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  Object.defineProperty(globalThis, 'XMLHttpRequest', {
    configurable: true,
    writable: true,
    value: undefined,
  });
  setAppVersion('9.8.7');
  setAcceptLanguage('ko');
  setVersionMismatchHandler(mismatch);
});
afterEach(() => {
  if (originalXhr)
    Object.defineProperty(globalThis, 'XMLHttpRequest', originalXhr);
  else Reflect.deleteProperty(globalThis, 'XMLHttpRequest');
  server.resetHandlers();
  setVersionMismatchHandler(null);
  setAppVersion('');
  jest.clearAllMocks();
});
afterAll(() => server.close());

it('fetch 프로필 업로드에 버전을 보내고 브라우저가 생성한 multipart 경계와 필드를 보존한다', async () => {
  let version: string | null = null;
  let contentType: string | null = null;
  let displayName: FormDataEntryValue | null = null;
  server.use(
    http.patch('*/api/users/me/profile', async ({ request }) => {
      version = request.headers.get('X-App-Version');
      contentType = request.headers.get('Content-Type');
      expect(request.headers.get('Authorization')).toBe('Bearer user-token');
      // This node-environment response uses native FormData, while RN's declaration omits get.
      const fields = (await request.formData()) as unknown as {
        get(name: string): FormDataEntryValue | null;
      };
      displayName = fields.get('displayName');
      return HttpResponse.json(profileResult);
    }),
  );
  await expect(update()).resolves.toEqual(profileResult);
  expect(version).toBe('9.8.7');
  expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
  expect(displayName).toBe('업데이트 사용자');
  expect(mismatch).not.toHaveBeenCalled();
});

it('취향 분석 SSE 요청에 버전을 보내고 정상 완료 이벤트를 처리한다', async () => {
  let version: string | null = null;
  server.use(
    http.post('*/api/users/me/taste-profile/analysis', async ({ request }) => {
      version = request.headers.get('X-App-Version');
      expect(request.headers.get('Authorization')).toBe('Bearer user-token');
      expect(await request.json()).toEqual(payload);
      return new HttpResponse(
        'event: complete\ndata: {"status":200,"data":{"tasteProfileId":"taste-id"}}\n\n',
        {
          headers: { 'Content-Type': 'text/event-stream' },
        },
      );
    }),
  );
  await expect(analyze()).resolves.toBe('taste-id');
  expect(version).toBe('9.8.7');
  expect(mismatch).not.toHaveBeenCalled();
});

describe.each([
  ['프로필 fetch', 'profile', update],
  ['취향 분석 SSE', 'analysis', analyze],
] as const)('%s HTTP426', (_description, transport, call) => {
  it.each(['json', 'malformed'] as const)(
    '%s 오류 응답도 전역 업데이트 안내를 발생시킨다',
    async (format) => {
      const handler = transport === 'profile' ? http.patch : http.post;
      const path =
        transport === 'profile'
          ? '*/api/users/me/profile'
          : '*/api/users/me/taste-profile/analysis';
      server.use(
        handler(path, () =>
          format === 'json'
            ? HttpResponse.json(
                { status: 426, message: '새 앱 버전이 필요합니다.' },
                { status: 426 },
              )
            : new HttpResponse('invalid-json', { status: 426 }),
        ),
      );
      await expect(call()).rejects.toBeInstanceOf(AppVersionMismatchError);
      expect(mismatch).toHaveBeenCalledTimes(1);
      expect(mismatch.mock.calls[0][0]).toMatchObject({ status: 426 });
      if (format === 'json') {
        expect(mismatch.mock.calls[0][0].message).toBe(
          '새 앱 버전이 필요합니다.',
        );
      }
    },
  );
});

function mockXhr(status: number, responseText: string) {
  const headers: Record<string, string> = {};
  let sentBody: FormData | undefined;
  class UploadXhr {
    status = status;
    responseText = responseText;
    onload: (() => unknown) | null = null;
    open = jest.fn();
    setRequestHeader(name: string, value: string) {
      headers[name] = value;
    }
    send(body: FormData) {
      sentBody = body;
      queueMicrotask(() => {
        this.onload?.();
      });
    }
  }
  Object.defineProperty(globalThis, 'XMLHttpRequest', {
    configurable: true,
    writable: true,
    value: UploadXhr,
  });
  return { headers, body: () => sentBody };
}

it('네이티브 XHR 업로드에 버전을 보내고 FormData 경계를 직접 지정하지 않는다', async () => {
  const xhr = mockXhr(200, JSON.stringify(profileResult));
  await expect(update()).resolves.toEqual(profileResult);
  expect(xhr.headers).toEqual({
    'Accept-Language': 'ko',
    'X-App-Version': '9.8.7',
    Authorization: 'Bearer user-token',
  });
  expect(xhr.body()?.get('displayName')).toBe('업데이트 사용자');
  expect(mismatch).not.toHaveBeenCalled();
});

it.each(['json', 'malformed'] as const)(
  '네이티브 XHR %s HTTP426을 파싱 오류로 바꾸지 않는다',
  async (format) => {
    mockXhr(
      426,
      format === 'json'
        ? JSON.stringify({ status: 426, message: '앱을 업데이트해 주세요.' })
        : 'invalid-json',
    );
    await expect(update()).rejects.toBeInstanceOf(AppVersionMismatchError);
    expect(mismatch).toHaveBeenCalledTimes(1);
    expect(mismatch.mock.calls[0][0]).toMatchObject({ status: 426 });
  },
);
