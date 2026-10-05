/**
 * @file courseBackgroundService.test.ts
 * @description Execution lease ordering, expiration, screen unmount and cleanup regression tests for course generation.
 */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { requireOptionalNativeModule } from 'expo';
import { createCourseStreamApi, useCourseStore } from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBackgroundCourseStreamApi } from '../src/services/courseBackgroundService';
import { useCourseCreateMutation } from '../src/hooks/queries/useCourseMutations';
import { UI_STRINGS } from '../src/constants/strings';
import { createTestQueryClient } from './test-utils';

jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn() }));
jest.mock('@yeolo/common', () => ({
  ...jest.requireActual('@yeolo/common'),
  createCourseStreamApi: jest.fn(),
}));

const payload = {
  destinationCountry: '일본',
  destinationCity: '도쿄',
  startDate: '2026-10-06',
  totalDays: 2,
  budgetType: 'moderate' as const,
};
const complete = {
  status: 200,
  message: '완료',
  data: { courseId: 'background-course' },
};
let expire: (event: { jobId: string }) => void;
const remove = jest.fn();
const native = {
  startAsync: jest.fn(),
  updateAsync: jest.fn(),
  finishAsync: jest.fn(),
  addListener: jest.fn((_name, listener) => {
    expire = listener;
    return { remove };
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  useCourseStore.getState().resetCourseState();
  native.startAsync.mockResolvedValue('foreground-service');
  native.updateAsync.mockResolvedValue(undefined);
  native.finishAsync.mockResolvedValue(undefined);
  (requireOptionalNativeModule as jest.Mock).mockReturnValue(native);
  (createCourseStreamApi as jest.Mock).mockImplementation(
    async (_url, _token, _payload, callbacks) => {
      callbacks?.onComplete?.(complete);
      return complete.data.courseId;
    },
  );
});

it('sends no request until native background execution is actually granted', async () => {
  let ready!: () => void;
  native.startAsync.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        ready = resolve;
      }),
  );
  const pending = createBackgroundCourseStreamApi(
    'https://api.test',
    'test-token',
    payload,
  );
  expect(createCourseStreamApi).not.toHaveBeenCalled();
  ready();
  await expect(pending).resolves.toBe('background-course');
  expect(createCourseStreamApi).toHaveBeenCalledWith(
    'https://api.test',
    'test-token',
    payload,
    expect.any(Object),
    { signal: expect.any(Object) },
  );
  expect(native.finishAsync).toHaveBeenCalledWith(
    native.startAsync.mock.calls[0][0],
    true,
  );
  expect(remove).toHaveBeenCalledTimes(1);
});

it('reports actual SSE stages and preserves the original callbacks', async () => {
  const progress = jest.fn();
  const completed = jest.fn();
  (createCourseStreamApi as jest.Mock).mockImplementation(
    async (_url, _token, _payload, callbacks) => {
      callbacks.onProgress({
        step: 'LOADING_TASTE_PREFERENCE',
        message: '취향 조회',
      });
      callbacks.onProgress({ step: 'GENERATING_COURSE', message: '코스 생성' });
      callbacks.onComplete(complete);
      return 'background-course';
    },
  );
  await createBackgroundCourseStreamApi(
    'https://api.test',
    'test-token',
    payload,
    { onProgress: progress, onComplete: completed },
  );
  const id = native.startAsync.mock.calls[0][0];
  expect(native.updateAsync.mock.calls).toEqual([
    [id, '취향 조회', 0, 2],
    [id, '코스 생성', 1, 2],
  ]);
  expect(progress).toHaveBeenCalledTimes(2);
  expect(completed).toHaveBeenCalledWith(complete);
});

it('aborts an expired request, ignores unrelated tasks, and releases the lease', async () => {
  (createCourseStreamApi as jest.Mock).mockImplementation(
    (_url, _token, _payload, _callbacks, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () =>
          reject(new Error('request canceled')),
        );
      }),
  );
  const pending = createBackgroundCourseStreamApi(
    'https://api.test',
    'test-token',
    payload,
  );
  await waitFor(() => expect(createCourseStreamApi).toHaveBeenCalled());
  const id = native.startAsync.mock.calls[0][0];
  const signal = (createCourseStreamApi as jest.Mock).mock.calls[0][4].signal;
  expire({ jobId: 'another-job' });
  expect(signal.aborted).toBe(false);
  const rejected = expect(pending).rejects.toThrow(
    UI_STRINGS.COURSE_GENERATING.BACKGROUND_EXPIRED,
  );
  expire({ jobId: id });
  await rejected;
  expect(signal.aborted).toBe(true);
  expect(native.finishAsync).toHaveBeenCalledWith(id, false);
  expect(remove).toHaveBeenCalledTimes(1);
});

it('releases the native task on a server error without replacing its message', async () => {
  (createCourseStreamApi as jest.Mock).mockRejectedValue(
    new Error('server generation failed'),
  );
  await expect(
    createBackgroundCourseStreamApi('https://api.test', 'test-token', payload),
  ).rejects.toThrow('server generation failed');
  expect(native.finishAsync).toHaveBeenCalledWith(
    native.startAsync.mock.calls[0][0],
    false,
  );
  expect(remove).toHaveBeenCalledTimes(1);
});

it('does not silently send an unprotected request from an old app binary', async () => {
  (requireOptionalNativeModule as jest.Mock).mockReturnValue(null);
  await expect(
    createBackgroundCourseStreamApi('https://api.test', 'test-token', payload),
  ).rejects.toThrow(UI_STRINGS.COURSE_GENERATING.BACKGROUND_UNAVAILABLE);
  expect(createCourseStreamApi).not.toHaveBeenCalled();
});

it('cleans up a denied execution request without calling the server', async () => {
  native.startAsync.mockRejectedValue(new Error('OS denied execution'));
  await expect(
    createBackgroundCourseStreamApi('https://api.test', 'test-token', payload),
  ).rejects.toThrow(UI_STRINGS.COURSE_GENERATING.BACKGROUND_START_ERROR);
  expect(createCourseStreamApi).not.toHaveBeenCalled();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(native.finishAsync).toHaveBeenCalledWith(
    native.startAsync.mock.calls[0][0],
    false,
  );
});

it('keeps a completed result when releasing execution fails', async () => {
  native.finishAsync.mockRejectedValue(new Error('already stopped'));
  await expect(
    createBackgroundCourseStreamApi('https://api.test', 'test-token', payload),
  ).resolves.toBe('background-course');
  expect(remove).toHaveBeenCalledTimes(1);
});

it('continues generation after the initiating screen unmounts', async () => {
  await AsyncStorage.setItem('accessToken', 'test-token');
  let finish!: () => void;
  (createCourseStreamApi as jest.Mock).mockImplementation(
    (_url, _token, _payload, callbacks) =>
      new Promise<string>((resolve) => {
        finish = () => {
          callbacks.onComplete(complete);
          resolve('background-course');
        };
      }),
  );
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  const { result, unmount } = await renderHook(
    () => useCourseCreateMutation(),
    { wrapper },
  );
  await act(async () => {
    result.current.mutate(payload);
  });
  await waitFor(() => expect(createCourseStreamApi).toHaveBeenCalled());
  await unmount();
  expect(native.finishAsync).not.toHaveBeenCalled();
  await act(async () => {
    finish();
  });
  await waitFor(() =>
    expect(useCourseStore.getState().createdCourseId).toBe('background-course'),
  );
  expect(useCourseStore.getState().error).toBeNull();
  expect(native.finishAsync).toHaveBeenCalledWith(
    native.startAsync.mock.calls[0][0],
    true,
  );
});

it('does not replace the running request when another screen submits again', async () => {
  let finish!: () => void;
  (createCourseStreamApi as jest.Mock).mockImplementation(
    (_url, _token, _payload, callbacks) =>
      new Promise<string>((resolve) => {
        finish = () => {
          callbacks.onComplete(complete);
          resolve('background-course');
        };
      }),
  );
  const first = useCourseStore
    .getState()
    .createCourse(
      'https://api.test',
      payload,
      'test-token',
      createBackgroundCourseStreamApi,
    );
  await waitFor(() => expect(createCourseStreamApi).toHaveBeenCalled());
  await expect(
    useCourseStore
      .getState()
      .createCourse(
        'https://api.test',
        payload,
        'test-token',
        createBackgroundCourseStreamApi,
      ),
  ).resolves.toBeNull();
  expect(useCourseStore.getState().isGenerating).toBe(true);
  expect(native.startAsync).toHaveBeenCalledTimes(1);
  finish();
  await expect(first).resolves.toBe('background-course');
  expect(useCourseStore.getState().error).toBeNull();
});
