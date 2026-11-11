/**
 * @jest-environment node
 * @file courseStream.test.ts
 * @description Regression tests for terminal SSE success, server errors, and canceled course creation requests.
 */
import { http, HttpResponse } from 'msw';
import { createCourseStreamApi } from '../../common/src/api/course';
import { server } from './mocks/server';

// Expo's Jest preset installs stream polyfills. Keep the real parser and HTTP body in the same Node stream realm.
jest.mock('parse-sse', () => {
  Object.assign(globalThis, require('node:stream/web'));
  return jest.requireActual('parse-sse');
});

Object.assign(globalThis, {
  ...require('node:stream/web'),
  TextEncoder: require('node:util').TextEncoder,
  TextDecoder: require('node:util').TextDecoder,
});

const payload = {
  destinationCountry: '일본',
  destinationCity: '도쿄',
  startDate: '2026-10-06',
  totalDays: 2,
  budget: 1600000,
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('keeps a completed course successful when the server connection breaks afterwards', async () => {
  const complete = jest.fn();
  server.use(
    http.post('*/api/courses', () => {
      let sent = false;
      return new HttpResponse(
        new ReadableStream<Uint8Array>({
          async pull(controller) {
            if (!sent) {
              sent = true;
              controller.enqueue(
                new TextEncoder().encode(
                  'event: complete\ndata: {"status":200,"message":"완료","data":{"courseId":"completed-course"}}\n\n',
                ),
              );
            } else {
              await new Promise((resolve) => setTimeout(resolve, 20));
              controller.error(new Error('Software caused connection abort'));
            }
          },
        }),
        { headers: { 'Content-Type': 'text/event-stream' } },
      );
    }),
  );
  await expect(
    createCourseStreamApi('https://api.test', 'test-token', payload, {
      onComplete: complete,
    }),
  ).resolves.toBe('completed-course');
  expect(complete).toHaveBeenCalledTimes(1);
});

it('rejects an incomplete stream instead of treating a disconnect as success', async () => {
  server.use(
    http.post(
      '*/api/courses',
      () =>
        new HttpResponse(
          'event: progress\ndata: {"step":"GENERATING_COURSE","message":"생성 중"}\n\n',
          { headers: { 'Content-Type': 'text/event-stream' } },
        ),
    ),
  );
  await expect(
    createCourseStreamApi('https://api.test', 'test-token', payload),
  ).rejects.toMatchObject({
    reason: 'connection_lost',
    message: expect.stringContaining('Course ID'),
  });
});

it('classifies a network failure separately from explicit server errors', async () => {
  server.use(http.post('*/api/courses', () => HttpResponse.error()));
  await expect(
    createCourseStreamApi('https://api.test', 'test-token', payload),
  ).rejects.toMatchObject({ reason: 'connection_lost' });
});

it('classifies a connection breaking during generation without publishing completion', async () => {
  const progress = jest.fn();
  const complete = jest.fn();
  server.use(
    http.post('*/api/courses', () => {
      let sent = false;
      return new HttpResponse(
        new ReadableStream<Uint8Array>({
          async pull(controller) {
            if (!sent) {
              sent = true;
              controller.enqueue(
                new TextEncoder().encode(
                  'event: progress\ndata: {"step":"GENERATING_COURSE","message":"생성 중"}\n\n',
                ),
              );
            } else {
              await new Promise((resolve) => setTimeout(resolve, 20));
              controller.error(new Error('connection lost while generating'));
            }
          },
        }),
        { headers: { 'Content-Type': 'text/event-stream' } },
      );
    }),
  );
  await expect(
    createCourseStreamApi('https://api.test', 'test-token', payload, {
      onProgress: progress,
      onComplete: complete,
    }),
  ).rejects.toMatchObject({ reason: 'connection_lost' });
  expect(progress).toHaveBeenCalledTimes(1);
  expect(complete).not.toHaveBeenCalled();
});

it('rejects an unsuccessful terminal event without publishing a course ID', async () => {
  const complete = jest.fn();
  server.use(
    http.post(
      '*/api/courses',
      () =>
        new HttpResponse(
          'event: complete\ndata: {"status":500,"message":"생성 실패","data":{"courseId":"invalid-course"}}\n\n',
          { headers: { 'Content-Type': 'text/event-stream' } },
        ),
    ),
  );
  await expect(
    createCourseStreamApi('https://api.test', 'test-token', payload, {
      onComplete: complete,
    }),
  ).rejects.toThrow('생성 실패');
  expect(complete).not.toHaveBeenCalled();
});

it.each([
  [404, '사용자의 취향 정보를 찾을 수 없습니다.'],
  [500, 'AI 여행 코스 생성에 실패했습니다.'],
])(
  'preserves the status %i and message from a terminal server error',
  async (status, message) => {
    const progress = jest.fn();
    const complete = jest.fn();
    server.use(
      http.post(
        '*/api/courses',
        () =>
          new HttpResponse(
            [
              'event: progress\ndata: {"step":"GENERATING_COURSE","message":"생성 중"}\n\n',
              `event: error\ndata: ${JSON.stringify({ status, message, data: null })}\n\n`,
              'event: complete\ndata: {"status":200,"message":"완료","data":{"courseId":"after-error"}}\n\n',
            ].join(''),
            { headers: { 'Content-Type': 'text/event-stream' } },
          ),
      ),
    );

    await expect(
      createCourseStreamApi('https://api.test', 'test-token', payload, {
        onProgress: progress,
        onComplete: complete,
      }),
    ).rejects.toMatchObject({ name: 'ApiError', status, message });
    expect(progress).toHaveBeenCalledTimes(1);
    expect(complete).not.toHaveBeenCalled();
  },
);

it('rejects a request canceled by the execution owner without publishing completion', async () => {
  const complete = jest.fn();
  const controller = new AbortController();
  let requestStarted!: () => void;
  const started = new Promise<void>((resolve) => {
    requestStarted = resolve;
  });
  server.use(
    http.post('*/api/courses', async () => {
      requestStarted();
      await new Promise((resolve) => setTimeout(resolve, 50));
      return HttpResponse.json({ data: { courseId: 'canceled-course' } });
    }),
  );
  const pending = createCourseStreamApi(
    'https://api.test',
    'test-token',
    payload,
    { onComplete: complete },
    { signal: controller.signal },
  );
  const rejected = expect(pending).rejects.toThrow();
  await started;
  controller.abort();
  await rejected;
  expect(complete).not.toHaveBeenCalled();
});
