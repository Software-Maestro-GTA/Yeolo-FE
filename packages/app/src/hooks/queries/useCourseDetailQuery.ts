/**
 * @file useCourseDetailQuery.ts
 * @description Custom TanStack Query hook for fetching travel course detail recommendations (FUN-3, API-FB-7).
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCourseDetailApi, logger, type CourseDetail } from '@yeolo/common';
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
  const targetCourseId = courseId || 'mock-course-id-1';

  return useQuery<CourseDetail, Error>({
    queryKey: getCourseDetailQueryKey(targetCourseId),
    queryFn: async () => {
      try {
        const token = (await AsyncStorage.getItem('accessToken')) || '';
        const data = await getCourseDetailApi(apiUrl, token, targetCourseId);
        return data;
      } catch (err: unknown) {
        logger.error(
          `[useCourseDetailQuery] Query failed for "${targetCourseId}":`,
          err,
        );
        const errorObj = err as { message?: string };
        throw new Error(
          errorObj?.message || UI_STRINGS.COURSE_DETAIL.ERROR_TITLE,
        );
      }
    },
    enabled: true,
    staleTime: APP_CONFIG.QUERY_STALE_TIME,
    ...options,
  });
}
