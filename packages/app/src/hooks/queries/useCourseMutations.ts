/**
 * @file useCourseMutations.ts
 * @description Custom TanStack Query mutation hook for creating travel courses (FUN-6, API-FB-8).
 */
import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type CourseCreateRequest,
  useCourseStore,
  deleteCourseApi,
  logger,
} from '@yeolo/common';
import { APP_CONFIG } from '../../constants';
import { COURSE_LIST_QUERY_KEY } from './useCourseListQuery';

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
          .createCourse(apiUrl, data, token);
      } catch (err: unknown) {
        logger.error('Failed to trigger createCourse store action:', err);
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
