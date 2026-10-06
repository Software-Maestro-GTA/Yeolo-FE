/**
 * @file queryErrors.test.tsx
 * @description Verifies API status survives course/place query hooks for global authorization handling.
 * @jest-environment-options {"customExportConditions":["node","node-addons"]}
 */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse, delay } from 'msw';
import {
  ApiError,
  fetchCountryAutocomplete,
  setUnauthorizedHandler,
  setTokenGetter,
} from '@yeolo/common';
import { server } from './mocks/server';
import { createTestQueryClient } from './test-utils';
import { useCourseListQuery } from '../src/hooks/queries/useCourseListQuery';
import { useCourseDetailQuery } from '../src/hooks/queries/useCourseDetailQuery';
import { usePlaceDetailQuery } from '../src/hooks/queries/usePlaceDetailQuery';

describe('query authorization errors', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  beforeEach(() => {
    setTokenGetter(async () => ({ accessToken: null, refreshToken: null }));
    setUnauthorizedHandler(() => {});
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('cancels an autocomplete HTTP request while the server is still responding', async () => {
    let markStarted: () => void;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    server.use(
      http.get('*/api/locations/countries/autocomplete', async () => {
        markStarted();
        await delay(100);
        return HttpResponse.json({
          status: 200,
          message: '국가 자동완성 조회 성공',
          data: { countries: [] },
        });
      }),
    );
    const controller = new AbortController();
    const request = fetchCountryAutocomplete(
      'https://api.yeolo.app',
      '일',
      undefined,
      controller.signal,
    );
    const rejection = expect(request).rejects.toMatchObject({
      name: 'AbortError',
    });
    await started;
    controller.abort();
    await rejection;
  });

  it.each([
    ['course list', '*/api/courses', () => useCourseListQuery()],
    [
      'course detail',
      '*/api/courses/course-1',
      () => useCourseDetailQuery({ courseId: 'course-1' }),
    ],
    [
      'place detail',
      '*/api/places/place-1',
      () => usePlaceDetailQuery({ placeId: 'place-1' }),
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
