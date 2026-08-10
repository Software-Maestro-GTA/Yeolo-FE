/**
 * @file useShareMutations.ts
 * @description Custom TanStack Query hooks for travel course share link features (API-SHARE-1, API-SHARE-2, API-SHARE-3).
 */
import {
  useMutation,
  useQuery,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createShareLinkApi,
  getShareLinkApi,
  acceptShareLinkApi,
  type ShareLinkCreateResponseData,
  type ShareLinkDetailResponseData,
  type ShareLinkAcceptResponseData,
  logger,
} from '@yeolo/common';
import { APP_CONFIG } from '../../constants';

export interface UseCreateShareLinkMutationOptions {
  options?: UseMutationOptions<ShareLinkCreateResponseData, Error, string>;
}

export function useCreateShareLinkMutation({
  options,
}: UseCreateShareLinkMutationOptions = {}) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

  return useMutation<ShareLinkCreateResponseData, Error, string>({
    mutationFn: async (courseId: string) => {
      try {
        const accessToken = (await AsyncStorage.getItem('accessToken')) || '';
        return await createShareLinkApi(apiUrl, accessToken, courseId);
      } catch (err: unknown) {
        logger.error('Failed to create share link:', err);
        throw err;
      }
    },
    ...options,
  });
}

export interface UseShareLinkDetailQueryOptions {
  shareToken?: string;
  options?: Omit<
    UseQueryOptions<ShareLinkDetailResponseData, Error>,
    'queryKey' | 'queryFn'
  >;
}

export const getShareLinkDetailQueryKey = (shareToken?: string) => [
  'shareLinkDetail',
  shareToken,
];

export function useShareLinkDetailQuery({
  shareToken,
  options,
}: UseShareLinkDetailQueryOptions) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

  return useQuery<ShareLinkDetailResponseData, Error>({
    queryKey: getShareLinkDetailQueryKey(shareToken),
    queryFn: async () => {
      if (!shareToken) {
        throw new Error('Share token is missing');
      }
      return await getShareLinkApi(apiUrl, shareToken);
    },
    enabled: Boolean(shareToken),
    staleTime: APP_CONFIG.QUERY_STALE_TIME,
    ...options,
  });
}

export interface UseAcceptShareLinkMutationOptions {
  options?: UseMutationOptions<ShareLinkAcceptResponseData, Error, string>;
}

export function useAcceptShareLinkMutation({
  options,
}: UseAcceptShareLinkMutationOptions = {}) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

  return useMutation<ShareLinkAcceptResponseData, Error, string>({
    mutationFn: async (shareToken: string) => {
      try {
        const accessToken = (await AsyncStorage.getItem('accessToken')) || '';
        return await acceptShareLinkApi(apiUrl, accessToken, shareToken);
      } catch (err: unknown) {
        logger.error('Failed to accept share link:', err);
        throw err;
      }
    },
    ...options,
  });
}
