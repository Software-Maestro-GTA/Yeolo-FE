/**
 * @jest-environment node
 * @file tasteStream.test.ts
 * @description Verifies terminal taste SSE completion, bounded response waits, and API-PREF-3 metadata requests through MSW.
 */
import { http, HttpResponse } from 'msw';
import { analyzeTastePreferenceStream } from '../../common/src/api/taste';
import { server } from './mocks/server';

// Match the parser and MSW response body to Node's stream implementation.
jest.mock('parse-sse', () => {
  Object.assign(globalThis, require('node:stream/web'));
  return jest.requireActual('parse-sse');
});

Object.assign(globalThis, {
  ...require('node:stream/web'),
  TextEncoder: require('node:util').TextEncoder,
  TextDecoder: require('node:util').TextDecoder,
});

const endpoint = '*/api/users/me/taste-profile/analysis';
const payload = {
  images: [
    {
      sourceImageId: 'test-image',
      capturedAt: '2026-10-01T00:00:00Z',
      latitude: 37.5665,
      longitude: 126.978,
      timezone: 'Asia/Seoul',
    },
  ],
};
const completeEvent =
  'event: complete\ndata: {"status":200,"message":"완료","data":{"tasteProfileId":"completed-profile"}}\n\n';
const progressEvent =
  'event: progress\ndata: {"step":"ANALYZING_PREFERENCE","message":"분석 중"}\n\n';
const timeoutMessage =
  '취향 분석 응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.';

function createOpenResponse(initialEvent = '') {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value;
      if (initialEvent) value.enqueue(new TextEncoder().encode(initialEvent));
    },
  });
  return {
    response: new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    }),
    send(event: string) {
      controller.enqueue(new TextEncoder().encode(event));
    },
    close() {
      try {
        controller.close();
      } catch {
        // Successful terminal events and timeouts may already cancel the body.
      }
    },
  };
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  server.resetHandlers();
  jest.useRealTimers();
});
afterAll(() => server.close());

it('returns a valid completion immediately without waiting for server EOF and keeps the metadata request unchanged', async () => {
  const open = createOpenResponse(completeEvent);
  const onComplete = jest.fn();
  let requestBody: unknown;
  let requestSignal: AbortSignal | undefined;
  let authorization: string | null = null;
  server.use(
    http.post(endpoint, async ({ request }) => {
      requestBody = await request.json();
      authorization = request.headers.get('Authorization');
      requestSignal = request.signal;
      return open.response;
    }),
  );

  let result: unknown;
  const pending = analyzeTastePreferenceStream(
    'https://api.test',
    'test-token',
    payload,
    { onComplete },
  ).then((value) => {
    result = value;
  });
  await jest.advanceTimersByTimeAsync(0);
  const resultBeforeServerClose = result;
  const abortedBeforeServerClose = requestSignal?.aborted;
  open.close();
  await pending;

  expect(resultBeforeServerClose).toBe('completed-profile');
  expect(abortedBeforeServerClose).toBe(true);
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(authorization).toBe('Bearer test-token');
  expect(requestBody).toEqual({
    images: [
      {
        sourceImageId: 'test-image',
        capturedAt: '2026-10-01T00:00:00Z',
        latitude: 37.5665,
        longitude: 126.978,
      },
    ],
  });
});

it('ends a stalled initial response with a retryable timeout and aborts the request', async () => {
  let releaseResponse!: () => void;
  const responseReady = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  let requestSignal: AbortSignal | undefined;
  server.use(
    http.post(endpoint, async ({ request }) => {
      requestSignal = request.signal;
      await responseReady;
      return new HttpResponse(completeEvent, {
        headers: { 'Content-Type': 'text/event-stream' },
      });
    }),
  );

  let failure: unknown;
  const pending = analyzeTastePreferenceStream(
    'https://api.test',
    'test-token',
    payload,
    {},
  ).catch((error) => {
    failure = error;
  });
  await jest.advanceTimersByTimeAsync(120_000);
  const failureBeforeServerResponse = failure;
  const abortedBeforeServerResponse = requestSignal?.aborted;
  releaseResponse();
  await pending;

  expect(failureBeforeServerResponse).toMatchObject({
    status: 504,
    message: timeoutMessage,
  });
  expect(abortedBeforeServerResponse).toBe(true);
});

it('restarts the idle wait after progress and stops when the next event never arrives', async () => {
  const open = createOpenResponse(progressEvent);
  const onProgress = jest.fn();
  const onComplete = jest.fn();
  server.use(http.post(endpoint, () => open.response));
  let failure: unknown;
  const pending = analyzeTastePreferenceStream(
    'https://api.test',
    'test-token',
    payload,
    { onProgress, onComplete },
  ).catch((error) => {
    failure = error;
  });
  await jest.advanceTimersByTimeAsync(60_000);
  open.send(progressEvent);
  await jest.advanceTimersByTimeAsync(60_000);
  expect(failure).toBeUndefined();
  expect(onProgress).toHaveBeenCalledTimes(2);

  await jest.advanceTimersByTimeAsync(60_000);
  const failureBeforeServerClose = failure;
  open.close();
  await pending;

  expect(failureBeforeServerClose).toMatchObject({
    status: 504,
    message: timeoutMessage,
  });
  expect(onComplete).not.toHaveBeenCalled();
});

it('rejects an unsuccessful terminal response even if it contains a profile ID', async () => {
  const onComplete = jest.fn();
  server.use(
    http.post(
      endpoint,
      () =>
        new HttpResponse(
          'event: complete\ndata: {"status":500,"message":"분석 실패","data":{"tasteProfileId":"invalid-profile"}}\n\n',
          { headers: { 'Content-Type': 'text/event-stream' } },
        ),
    ),
  );
  await expect(
    analyzeTastePreferenceStream('https://api.test', 'test-token', payload, {
      onComplete,
    }),
  ).rejects.toMatchObject({ status: 500, message: '분석 실패' });
  expect(onComplete).not.toHaveBeenCalled();
});

it('rejects a stream that ends without a profile ID', async () => {
  server.use(
    http.post(
      endpoint,
      () =>
        new HttpResponse(progressEvent, {
          headers: { 'Content-Type': 'text/event-stream' },
        }),
    ),
  );
  await expect(
    analyzeTastePreferenceStream('https://api.test', 'test-token', payload, {}),
  ).rejects.toThrow('Profile ID');
});

it('ignores malformed event JSON and still completes on a later valid event', async () => {
  server.use(
    http.post(
      endpoint,
      () =>
        new HttpResponse(`data: invalid-json\n\n${completeEvent}`, {
          headers: { 'Content-Type': 'text/event-stream' },
        }),
    ),
  );
  await expect(
    analyzeTastePreferenceStream('https://api.test', 'test-token', payload, {}),
  ).resolves.toBe('completed-profile');
});

it('preserves the server metadata error used by the insufficient-photo recovery screen', async () => {
  server.use(
    http.post(endpoint, () =>
      HttpResponse.json(
        {
          status: 400,
          message: '분석 가능한 이미지 메타데이터가 부족합니다.',
          data: null,
        },
        { status: 400 },
      ),
    ),
  );
  await expect(
    analyzeTastePreferenceStream('https://api.test', 'test-token', payload, {}),
  ).rejects.toMatchObject({
    status: 400,
    message: '분석 가능한 이미지 메타데이터가 부족합니다.',
  });
});
