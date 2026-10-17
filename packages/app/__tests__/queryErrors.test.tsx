/**
 * @file queryErrors.test.tsx
 * @description Verifies course-query authorization errors and cancellation of location searches.
 * @jest-environment-options {"customExportConditions":["node","node-addons"]}
 */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse, delay } from 'msw';
import {
  ApiError,
  searchLocationsApi,
  setUnauthorizedHandler,
  setTokenGetter,
} from '@yeolo/common';
import { server } from './mocks/server';
import { createTestQueryClient } from './test-utils';
import { useCourseListQuery } from '../src/hooks/queries/useCourseListQuery';
import { useCourseDetailQuery } from '../src/hooks/queries/useCourseDetailQuery';

describe('query authorization errors', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  beforeEach(() => {
    setTokenGetter(async () => ({ accessToken: null, refreshToken: null }));
    setUnauthorizedHandler(() => {});
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('cancels a location search HTTP request while the server is still responding', async () => {
    let markStarted: () => void;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    server.use(
      http.get('*/api/locations/search', async () => {
        markStarted();
        await delay(100);
        return HttpResponse.json({
          status: 200,
          message: '지역 검색 성공',
          data: { results: [] },
        });
      }),
    );
    const controller = new AbortController();
    const request = searchLocationsApi(
      'https://api.yeolo.app',
      '일',
      controller.signal,
    );
    const rejection = expect(request).rejects.toMatchObject({
      name: 'AbortError',
    });
    await started;
    controller.abort();
    await rejection;
  });

  it.each([true, () => true])(
    'does not fetch a missing course ID even with enabled=%s or manual refresh',
    async (enabled) => {
      const request = jest.fn(() =>
        HttpResponse.json({ status: 404, data: null }),
      );
      server.use(http.get('*/api/courses/:courseId', request));
      const client = createTestQueryClient();
      const wrapper = ({ children }: React.PropsWithChildren) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
      const { result, unmount } = await renderHook(
        () => useCourseDetailQuery({ courseId: '', options: { enabled } }),
        { wrapper },
      );
      expect(result.current.fetchStatus).toBe('idle');
      await result.current.refetch();
      expect(request).not.toHaveBeenCalled();
      await unmount();
      client.clear();
    },
  );

  it('fetches the real course when an initially missing ID becomes available', async () => {
    const request = jest.fn(() =>
      HttpResponse.json({ status: 200, data: { courseId: 'course-1' } }),
    );
    server.use(http.get('*/api/courses/course-1', request));
    const client = createTestQueryClient();
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, rerender, unmount } = await renderHook(
      ({ courseId }: { courseId: string }) =>
        useCourseDetailQuery({ courseId }),
      { wrapper, initialProps: { courseId: '' } },
    );
    expect(result.current.fetchStatus).toBe('idle');
    await rerender({ courseId: 'course-1' });
    await waitFor(() => expect(result.current.data?.courseId).toBe('course-1'));
    expect(request).toHaveBeenCalledTimes(1);
    await unmount();
    client.clear();
  });

  it.each([
    ['course list', '*/api/courses', () => useCourseListQuery()],
    [
      'course detail',
      '*/api/courses/course-1',
      () => useCourseDetailQuery({ courseId: 'course-1' }),
    ],
  ] as const)('preserves a 403 from %s', async (_, path, useRequest) => {
    server.use(
      http.get(path, () =>
        HttpResponse.json(
          { status: 403, message: '접근 권한이 없습니다.', data: null },
          { status: 403 },
        ),
      ),
    );
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = await renderHook(() => useRequest(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(403);
    expect(result.current.error?.message).toBe('접근 권한이 없습니다.');
  });
});
