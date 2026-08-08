/**
 * @file useAuthMutations.ts
 * @description Custom TanStack Query mutations for user logout and account withdrawal actions (FUN-4, API-FB-11, API-USER-2).
 */
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loginWithGoogleApi,
  loginWithAppleApi,
  logoutApi,
  withdrawApi,
  updatePreferencesApi,
  savePhotoConsentApi,
  type User,
  type LogoutResponse,
  type WithdrawResponse,
  type UpdatePreferencesPayload,
  type UpdatePreferencesResponse,
  type SavePhotoConsentPayload,
  type SavePhotoConsentResponse,
} from '@yeolo/common';
import { APP_CONFIG, UI_STRINGS } from '../../constants';

export interface UseGoogleLoginMutationOptions {
  options?: UseMutationOptions<
    { user: User; isNewUser: boolean; doOnboarding: boolean },
    Error,
    string
  >;
}

export function useGoogleLoginMutation({
  options,
}: UseGoogleLoginMutationOptions = {}) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;
  const redirectUri = process.env.EXPO_PUBLIC_REDIRECT_URI || '';

  return useMutation<
    { user: User; isNewUser: boolean; doOnboarding: boolean },
    Error,
    string
  >({
    mutationFn: async (code: string) => {
      const response = await loginWithGoogleApi(apiUrl, { code, redirectUri });
      const fetchedUser = response.data.user;
      const isNewUser = !fetchedUser.lastLoginAt;
      const doOnboarding = response.data.doOnboarding;

      await AsyncStorage.setItem('accessToken', response.data.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(fetchedUser));

      return { user: fetchedUser, isNewUser, doOnboarding };
    },
    ...options,
  });
}

export interface AppleAuthPayloadInput {
  code: string;
  idToken?: string | null;
}

export interface UseAppleLoginMutationOptions {
  options?: UseMutationOptions<
    { user: User; isNewUser: boolean; doOnboarding: boolean },
    Error,
    AppleAuthPayloadInput
  >;
}

export function useAppleLoginMutation({
  options,
}: UseAppleLoginMutationOptions = {}) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;
  const redirectUri = process.env.EXPO_PUBLIC_REDIRECT_URI || '';

  return useMutation<
    { user: User; isNewUser: boolean; doOnboarding: boolean },
    Error,
    AppleAuthPayloadInput
  >({
    mutationFn: async ({ code, idToken }: AppleAuthPayloadInput) => {
      const response = await loginWithAppleApi(apiUrl, {
        code,
        redirectUri,
        idToken,
      });
      const fetchedUser = response.data.user;
      const isNewUser = !fetchedUser.lastLoginAt;
      const doOnboarding = response.data.doOnboarding;

      await AsyncStorage.setItem('accessToken', response.data.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(fetchedUser));

      return { user: fetchedUser, isNewUser, doOnboarding };
    },
    ...options,
  });
}

export interface UseLogoutMutationOptions {
  options?: UseMutationOptions<LogoutResponse, Error, void>;
}

export function useLogoutMutation({ options }: UseLogoutMutationOptions = {}) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

  return useMutation<LogoutResponse, Error, void>({
    mutationFn: async () => {
      const token = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      return await logoutApi(apiUrl, token || undefined, {
        refreshToken: refreshToken || undefined,
      });
    },
    ...options,
  });
}

export interface UseWithdrawMutationOptions {
  options?: UseMutationOptions<WithdrawResponse, Error, string | void>;
}

export function useWithdrawMutation({
  options,
}: UseWithdrawMutationOptions = {}) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

  return useMutation<WithdrawResponse, Error, string | void>({
    mutationFn: async (reason) => {
      const token = await AsyncStorage.getItem('accessToken');
      return await withdrawApi(apiUrl, token || undefined, {
        reason:
          (typeof reason === 'string' && reason) ||
          UI_STRINGS.PROFILE.WITHDRAW_REASON_DEFAULT,
      });
    },
    ...options,
  });
}

export interface UseUpdatePreferencesMutationOptions {
  options?: UseMutationOptions<
    UpdatePreferencesResponse,
    Error,
    UpdatePreferencesPayload
  >;
}

export function useUpdatePreferencesMutation({
  options,
}: UseUpdatePreferencesMutationOptions = {}) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

  return useMutation<
    UpdatePreferencesResponse,
    Error,
    UpdatePreferencesPayload
  >({
    mutationFn: async (payload: UpdatePreferencesPayload) => {
      const token = await AsyncStorage.getItem('accessToken');
      return await updatePreferencesApi(apiUrl, token || undefined, payload);
    },
    ...options,
  });
}

export interface UseSavePhotoConsentMutationOptions {
  options?: UseMutationOptions<
    SavePhotoConsentResponse,
    Error,
    SavePhotoConsentPayload
  >;
}

export function useSavePhotoConsentMutation({
  options,
}: UseSavePhotoConsentMutationOptions = {}) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

  return useMutation<SavePhotoConsentResponse, Error, SavePhotoConsentPayload>({
    mutationFn: async (payload: SavePhotoConsentPayload) => {
      const token = await AsyncStorage.getItem('accessToken');
      return await savePhotoConsentApi(apiUrl, token || undefined, payload);
    },
    ...options,
  });
}
