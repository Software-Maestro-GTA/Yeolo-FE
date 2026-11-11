/**
 * @file useDestinationFavorites.ts
 * @description 기기에 저장한 여행 도시 즐겨찾기의 읽기, 토글 및 저장 상태를 관리합니다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

export type FavoriteDestination = { country: string; city: string };

export const DESTINATION_FAVORITES_STORAGE_KEY =
  'yeolo:destination-favorites:v1';

function normalizeDestination(value: unknown): FavoriteDestination | null {
  if (typeof value !== 'object' || value === null) return null;
  const destination = value as Partial<FavoriteDestination>;
  if (
    typeof destination.country !== 'string' ||
    typeof destination.city !== 'string'
  )
    return null;
  const country = destination.country.trim();
  const city = destination.city.trim();
  return country && city ? { country, city } : null;
}

function readFavorites(serialized: string | null): FavoriteDestination[] {
  if (serialized === null) return [];
  const values: unknown = JSON.parse(serialized);
  if (!Array.isArray(values)) throw new Error('Invalid destination favorites');
  const seen = new Set<string>();
  return values.flatMap((value) => {
    const destination = normalizeDestination(value);
    if (!destination) return [];
    const key = JSON.stringify([destination.country, destination.city]);
    if (seen.has(key)) return [];
    seen.add(key);
    return [destination];
  });
}

/**
 * @param visible 선택창 표시 여부. 다시 열면 다른 화면에서 저장한 값을 읽습니다.
 * @returns 기기 공통 즐겨찾기, 읽기·쓰기 상태 및 작업 함수. 저장 오류는 error로 반환합니다.
 */
export function useDestinationFavorites(visible: boolean) {
  const [favorites, setFavorites] = useState<FavoriteDestination[]>([]);
  const [isLoading, setIsLoading] = useState(visible);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<'load' | 'save' | null>(null);
  const favoritesRef = useRef<FavoriteDestination[]>([]);
  const mountedRef = useRef(false);
  const visibleRef = useRef(visible);
  const readyRef = useRef(false);
  const savingRef = useRef(false);
  const loadIdRef = useRef(0);
  const pendingWriteRef = useRef<Promise<void> | null>(null);

  const load = useCallback(async () => {
    if (!visibleRef.current || !mountedRef.current) return;
    const loadId = ++loadIdRef.current;
    const isCurrent = () =>
      mountedRef.current && visibleRef.current && loadId === loadIdRef.current;
    readyRef.current = false;
    setIsLoading(true);
    setError(null);
    // 닫는 동안 진행된 저장이 끝난 다음 읽어 이전 값이 다시 표시되는 것을 막습니다.
    await pendingWriteRef.current;
    if (!isCurrent()) return;
    try {
      const serialized = await AsyncStorage.getItem(
        DESTINATION_FAVORITES_STORAGE_KEY,
      );
      if (!isCurrent()) return;
      const next = readFavorites(serialized);
      favoritesRef.current = next;
      readyRef.current = true;
      setFavorites(next);
      setError(null);
    } catch {
      if (isCurrent()) setError('load');
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      readyRef.current = false;
      loadIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    visibleRef.current = visible;
    if (visible) void load();
    else setIsLoading(false);
    return () => {
      visibleRef.current = false;
      readyRef.current = false;
      loadIdRef.current += 1;
    };
  }, [load, visible]);

  const reload = useCallback(() => {
    void load();
  }, [load]);

  const toggle = useCallback(async (value: FavoriteDestination) => {
    if (
      !mountedRef.current ||
      !visibleRef.current ||
      !readyRef.current ||
      savingRef.current
    )
      return;
    const destination = normalizeDestination(value);
    if (!destination) return;
    const matches = (saved: FavoriteDestination) =>
      saved.country === destination.country && saved.city === destination.city;
    const previous = favoritesRef.current;
    const next = previous.some(matches)
      ? previous.filter((saved) => !matches(saved))
      : [...previous, destination];
    // React가 다음 렌더를 반영하기 전의 빠른 연타도 같은 저장 작업에 겹치지 않게 합니다.
    savingRef.current = true;
    setIsSaving(true);
    setError(null);
    const writing = (async () => {
      try {
        await AsyncStorage.setItem(
          DESTINATION_FAVORITES_STORAGE_KEY,
          JSON.stringify(next),
        );
        favoritesRef.current = next;
        if (mountedRef.current) setFavorites(next);
      } catch {
        if (mountedRef.current) setError('save');
      } finally {
        savingRef.current = false;
        pendingWriteRef.current = null;
        if (mountedRef.current) setIsSaving(false);
      }
    })();
    pendingWriteRef.current = writing;
    await writing;
  }, []);

  return {
    favorites,
    isLoading,
    isSaving,
    error,
    reload,
    toggle,
  };
}
