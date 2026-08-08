/**
 * @file useCourseListQuery.ts
 * @description Custom TanStack Query hook for fetching generated travel course list (FUN-7, API-FB-10).
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCourseListApi,
  DEFAULT_API_URL,
  type CourseSummary,
  ApiError,
} from '@yeolo/common';
import { UI_STRINGS, APP_CONFIG } from '../../constants';

export const COURSE_LIST_QUERY_KEY = ['courses'];

export interface UseCourseListQueryOptions {
  options?: Omit<
    UseQueryOptions<CourseSummary[], Error>,
    'queryKey' | 'queryFn'
  >;
}

export function useCourseListQuery({
  options,
}: UseCourseListQueryOptions = {}) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

  return useQuery<CourseSummary[], Error>({
    queryKey: COURSE_LIST_QUERY_KEY,
    queryFn: async () => {
      try {
        const token = (await AsyncStorage.getItem('accessToken')) || '';
        return await getCourseListApi(apiUrl, token);
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          throw new Error(err.message || UI_STRINGS.COURSE_LIST.ERROR_DEFAULT);
        }
        const errorObj = err as { message?: string };
        throw new Error(
          errorObj?.message || UI_STRINGS.COURSE_LIST.ERROR_DEFAULT,
        );
      }
    },
    staleTime: APP_CONFIG.QUERY_STALE_TIME,
    ...options,
  });
}
