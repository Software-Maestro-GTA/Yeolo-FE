/**
 * @file useCourseDetailQuery.ts
 * @description Custom TanStack Query hook for fetching travel course detail recommendations (FUN-3, API-FB-7).
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCourseDetailApi, type CourseDetail } from '@yeolo/common';
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
      try {
        const token = (await AsyncStorage.getItem('accessToken')) || '';
        return await getCourseDetailApi(apiUrl, token, courseId);
      } catch (err: unknown) {
        const errorObj = err as { message?: string };
        throw new Error(
          errorObj?.message || UI_STRINGS.COURSE_DETAIL.ERROR_TITLE,
        );
      }
    },
    enabled: Boolean(courseId),
    staleTime: APP_CONFIG.QUERY_STALE_TIME,
    ...options,
  });
}
