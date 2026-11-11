/**
 * @file useCourseDetailQuery.ts
 * @description Custom TanStack Query hook for fetching travel course details only when a real course ID is available (API-COURSE-2).
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCourseDetailApi,
  logger,
  ApiError,
  type CourseDetail,
} from '@yeolo/common';
import { UI_STRINGS, APP_CONFIG } from '../../constants';

export const getCourseDetailQueryKey = (courseId: string) => [
  'courseDetail',
  courseId,
];

export interface UseCourseDetailQueryOptions {
  courseId: string;
  options?: Omit<UseQueryOptions<CourseDetail, Error>, 'queryKey' | 'queryFn'>;
}

export function useCourseDetailQuery({
  courseId,
  options,
}: UseCourseDetailQueryOptions) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

  return useQuery<CourseDetail, Error>({
    queryKey: getCourseDetailQueryKey(courseId),
    queryFn: async () => {
      if (!courseId) throw new Error(UI_STRINGS.COURSE_DETAIL.ERROR_TITLE);
      try {
        const token = (await AsyncStorage.getItem('accessToken')) || '';
        const data = await getCourseDetailApi(apiUrl, token, courseId);
        return data;
      } catch (err: unknown) {
        logger.error(
          `[useCourseDetailQuery] Query failed for "${courseId}":`,
          err,
        );
        if (err instanceof ApiError) throw err;
        const errorObj = err as { message?: string };
        throw new Error(
          errorObj?.message || UI_STRINGS.COURSE_DETAIL.ERROR_TITLE,
        );
      }
    },
    staleTime: APP_CONFIG.QUERY_STALE_TIME,
    ...options,
    enabled: (query) => {
      if (!courseId) return false;
      return typeof options?.enabled === 'function'
        ? options.enabled(query)
        : (options?.enabled ?? true);
    },
  });
}
