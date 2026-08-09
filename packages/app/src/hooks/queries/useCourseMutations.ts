/**
 * @file useCourseMutations.ts
 * @description Custom TanStack Query mutation hook for creating travel courses (FUN-6, API-FB-8).
 */
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type CourseCreateRequest,
  useCourseStore,
  logger,
} from '@yeolo/common';
import { APP_CONFIG } from '../../constants';

export interface UseCourseCreateMutationOptions {
  options?: UseMutationOptions<string | null, Error, CourseCreateRequest>;
}

export function useCourseCreateMutation({
  options,
}: UseCourseCreateMutationOptions = {}) {
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
    ...options,
  });
}
