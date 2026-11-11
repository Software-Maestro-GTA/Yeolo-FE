/**
 * @file useShareMutations.ts
 * @description Course sharing queries, mutations and GA4 outcomes for link creation and acceptance.
 */
import {
  useMutation,
  useQuery,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiError,
  createShareLinkApi,
  getShareLinkApi,
  acceptShareLinkApi,
  type ShareLinkCreateResponseData,
  type ShareLinkDetailResponseData,
  type ShareLinkAcceptResponseData,
  logger,
} from '@yeolo/common';
import { APP_CONFIG } from '../../constants';
import { appAnalyticsTracker } from '../../analytics/firebaseTracker';

export interface UseCreateShareLinkMutationOptions {
  options?: UseMutationOptions<ShareLinkCreateResponseData, Error, string>;
}

export function useCreateShareLinkMutation({
  options,
}: UseCreateShareLinkMutationOptions = {}) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

  return useMutation<ShareLinkCreateResponseData, Error, string>({
    mutationFn: async (courseId: string) => {
      const track = appAnalyticsTracker.captureEventLogger();
      track('course_share_started');
      try {
        const accessToken = (await AsyncStorage.getItem('accessToken')) || '';
        const link = await createShareLinkApi(apiUrl, accessToken, courseId);
        track('course_share_link_created');
        return link;
      } catch (err: unknown) {
        track('course_share_failed');
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
      const track = appAnalyticsTracker.captureEventLogger();
      track('course_invite_accept_started');
      try {
        const accessToken = (await AsyncStorage.getItem('accessToken')) || '';
        const accepted = await acceptShareLinkApi(
          apiUrl,
          accessToken,
          shareToken,
        );
        track('course_invite_accept_result', { outcome: 'success' });
        return accepted;
      } catch (err: unknown) {
        track('course_invite_accept_result', {
          outcome:
            err instanceof ApiError && err.status === 400
              ? 'already_owned'
              : 'failed',
        });
        logger.error('Failed to accept share link:', err);
        throw err;
      }
    },
    ...options,
  });
}
