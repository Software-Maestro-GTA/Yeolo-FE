/**
 * @file useTasteProfileQuery.ts
 * @description Custom TanStack Query hook for fetching user AI taste profile results (FUN-4, API-FB-8).
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTasteProfileApi, DEFAULT_API_URL, type TasteProfile, ApiError } from '@yeolo/common';
import { UI_STRINGS, APP_CONFIG } from '../../constants';

export const getTasteProfileQueryKey = (tasteProfileId?: string) => ['tasteProfile', tasteProfileId || 'me'];

export interface UseTasteProfileQueryOptions {
  tasteProfileId?: string;
  options?: Omit<UseQueryOptions<TasteProfile, ApiError>, 'queryKey' | 'queryFn'>;
}

export function useTasteProfileQuery({
  tasteProfileId,
  options,
}: UseTasteProfileQueryOptions = {}) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

  return useQuery<TasteProfile, ApiError>({
    queryKey: getTasteProfileQueryKey(tasteProfileId),
    queryFn: async () => {
      const token = await AsyncStorage.getItem('accessToken');
      try {
        return await fetchTasteProfileApi(apiUrl, token || undefined, tasteProfileId);
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          throw err;
        }
        const errorObj = err as { message?: string };
        throw new ApiError(500, errorObj?.message || UI_STRINGS.TASTE_PROFILE.ERROR_LOAD_FAILED);
      }
    },
    retry: false,
    staleTime: APP_CONFIG.QUERY_STALE_TIME,
    ...options,
  });
}
