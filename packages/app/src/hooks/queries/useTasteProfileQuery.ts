/**
 * @file useTasteProfileQuery.ts
 * @description Account-scoped TanStack Query cache for AI taste profile results (FUN-4, API-FB-8).
 */
import { useContext } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchTasteProfileApi,
  type TasteProfile,
  ApiError,
} from '@yeolo/common';
import { UI_STRINGS, APP_CONFIG } from '../../constants';
import { AuthContext } from '../../context/AuthContext';

/** Keeps a profile result private to its account, including the latest `me` result. */
export const getTasteProfileQueryKey = (
  tasteProfileId?: string,
  userId?: string,
) => ['tasteProfile', userId || 'anonymous', tasteProfileId || 'me'];

export interface UseTasteProfileQueryOptions {
  tasteProfileId?: string;
  options?: Omit<
    UseQueryOptions<TasteProfile, ApiError>,
    'queryKey' | 'queryFn'
  >;
}

export function useTasteProfileQuery({
  tasteProfileId,
  options,
}: UseTasteProfileQueryOptions = {}) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;
  const auth = useContext(AuthContext);
  const userId = auth?.user?.userId;

  return useQuery<TasteProfile, ApiError>({
    queryKey: getTasteProfileQueryKey(tasteProfileId, userId),
    queryFn: async () => {
      const token = await AsyncStorage.getItem('accessToken');
      try {
        return await fetchTasteProfileApi(
          apiUrl,
          token || undefined,
          tasteProfileId,
        );
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          throw err;
        }
        const errorObj = err as { message?: string };
        throw new ApiError(
          500,
          errorObj?.message || UI_STRINGS.TASTE_PROFILE.ERROR_LOAD_FAILED,
        );
      }
    },
    retry: false,
    staleTime: APP_CONFIG.QUERY_STALE_TIME,
    ...options,
    enabled: (query) => {
      if (auth && (!auth.isAuthenticated || auth.isLoading || !userId))
        return false;
      return typeof options?.enabled === 'function'
        ? options.enabled(query)
        : (options?.enabled ?? true);
    },
  });
}
