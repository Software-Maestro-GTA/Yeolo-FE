/**
 * @file useCourseMutations.ts
 * @description Course mutations and GA4 outcomes for accepted generation requests, independent of screen lifecycle.
 */
import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiError,
  CourseStreamError,
  type CourseCreateRequest,
  useCourseStore,
  deleteCourseApi,
  logger,
} from '@yeolo/common';
import { APP_CONFIG, UI_STRINGS } from '../../constants';
import { COURSE_LIST_QUERY_KEY } from './useCourseListQuery';
import { createBackgroundCourseStreamApi } from '../../services/courseBackgroundService';
import { appAnalyticsTracker } from '../../analytics/firebaseTracker';

function generationFailureReason(error: unknown): string {
  if (error instanceof CourseStreamError) return error.reason;
  if (!(error instanceof ApiError)) return 'client_error';

  switch (error.status) {
    case 400:
      return 'invalid_input';
    case 401:
    case 403:
      return 'auth_required';
    case 404:
      return 'taste_required';
    case 426:
      return 'unsupported_version';
    default:
      return error.status >= 500 ? 'server_error' : 'request_error';
  }
}

/** Runs after the store accepts the attempt and follows its terminal SSE outcome. */
const createTrackedCourseStream: typeof createBackgroundCourseStreamApi =
  async (apiUrl, accessToken, payload, callbacks) => {
    const track = appAnalyticsTracker.captureEventLogger();
    track('course_generation_start');

    let completed = false;
    const reportCompletion = () => {
      if (completed) return;
      completed = true;
      track('course_generation_complete');
    };

    try {
      const courseId = await createBackgroundCourseStreamApi(
        apiUrl,
        accessToken,
        payload,
        {
          onProgress: callbacks?.onProgress,
          onComplete: (event) => {
            reportCompletion();
            callbacks?.onComplete?.(event);
          },
        },
      );
      reportCompletion();
      return courseId;
    } catch (error) {
      if (!completed) {
        track('course_generation_failed', {
          failure_reason: generationFailureReason(error),
        });
      }
      throw error;
    }
  };

export interface UseCourseCreateMutationOptions {
  options?: UseMutationOptions<string | null, Error, CourseCreateRequest>;
}

export function useCourseCreateMutation({
  options,
}: UseCourseCreateMutationOptions = {}) {
  const queryClient = useQueryClient();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

  return useMutation<string | null, Error, CourseCreateRequest>({
    mutationFn: async (data: CourseCreateRequest) => {
      try {
        const token = (await AsyncStorage.getItem('accessToken')) || '';
        return await useCourseStore
          .getState()
          .createCourse(apiUrl, data, token, createTrackedCourseStream);
      } catch (err: unknown) {
        logger.error('Failed to trigger createCourse store action:', err);
        useCourseStore
          .getState()
          .setError(UI_STRINGS.COURSE_GENERATING.BACKGROUND_START_ERROR);
        throw err;
      }
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COURSE_LIST_QUERY_KEY });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export interface UseCourseDeleteMutationOptions {
  options?: UseMutationOptions<void, Error, string>;
}

export function useCourseDeleteMutation({
  options,
}: UseCourseDeleteMutationOptions = {}) {
  const queryClient = useQueryClient();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

  return useMutation<void, Error, string>({
    mutationFn: async (courseId: string) => {
      try {
        const token = (await AsyncStorage.getItem('accessToken')) || '';
        await deleteCourseApi(apiUrl, token, courseId);
      } catch (err: unknown) {
        logger.error('Failed to delete course:', err);
        throw err;
      }
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COURSE_LIST_QUERY_KEY });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
