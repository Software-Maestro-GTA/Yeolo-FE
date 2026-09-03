/**
 * @file useUserProfileMutation.ts
 * @description Custom TanStack Query mutation for updating user profile details like displayName and profileImageUrl (API-USER-1).
 */
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  updateUserProfileApi,
  type UpdateUserProfilePayload,
  type UpdateUserProfileResponse,
} from '@yeolo/common';
import { APP_CONFIG } from '../../constants';

export interface UseUpdateUserProfileMutationOptions {
  options?: UseMutationOptions<
    UpdateUserProfileResponse,
    Error,
    UpdateUserProfilePayload
  >;
}

export function useUpdateUserProfileMutation({
  options,
}: UseUpdateUserProfileMutationOptions = {}) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

  return useMutation<
    UpdateUserProfileResponse,
    Error,
    UpdateUserProfilePayload
  >({
    mutationFn: async (payload: UpdateUserProfilePayload) => {
      const token = (await AsyncStorage.getItem('accessToken')) || undefined;
      return updateUserProfileApi(apiUrl, token, payload);
    },
    ...options,
  });
}
