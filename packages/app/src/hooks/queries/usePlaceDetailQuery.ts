/**
 * @file usePlaceDetailQuery.ts
 * @description Custom TanStack Query hook for fetching place detail information by placeId (API-PLACE-1).
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPlaceDetailApi, type PlaceDetail } from '@yeolo/common';
import { APP_CONFIG } from '../../constants';

export const getPlaceDetailQueryKey = (placeId: string) => [
  'placeDetail',
  placeId,
];

export interface UsePlaceDetailQueryOptions {
  placeId?: string;
  options?: Omit<UseQueryOptions<PlaceDetail, Error>, 'queryKey' | 'queryFn'>;
}

export function usePlaceDetailQuery({
  placeId,
  options,
}: UsePlaceDetailQueryOptions) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;
  const targetPlaceId = placeId || '';

  return useQuery<PlaceDetail, Error>({
    queryKey: getPlaceDetailQueryKey(targetPlaceId),
    queryFn: async () => {
      try {
        const token = (await AsyncStorage.getItem('accessToken')) || '';
        return await getPlaceDetailApi(apiUrl, token, targetPlaceId);
      } catch (err: unknown) {
        const errorObj = err as { message?: string };
        throw new Error(
          errorObj?.message || '장소 정보를 불러오지 못했습니다.',
        );
      }
    },
    enabled: Boolean(targetPlaceId),
    staleTime: APP_CONFIG.QUERY_STALE_TIME,
    ...options,
  });
}
