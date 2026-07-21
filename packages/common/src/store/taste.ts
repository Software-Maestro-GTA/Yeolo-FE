/**
 * @file taste.ts
 * @description Zustand global store for managing taste preference analysis states.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-2
 * @author Antigravity Agent
 */
import { create } from 'zustand';

interface TasteState {
  /**
   * The UUID of the successfully completed taste profile analysis.
   */
  tasteProfileId: string | null;
  /**
   * Action to update the taste profile ID.
   */
  setTasteProfileId: (id: string | null) => void;
  /**
   * Action to clear the taste profile ID.
   */
  clearTasteProfileId: () => void;
}

export const useTasteStore = create<TasteState>((set) => ({
  tasteProfileId: null,
  setTasteProfileId: (id) => set({ tasteProfileId: id }),
  clearTasteProfileId: () => set({ tasteProfileId: null }),
}));

import type { TasteProfile } from '../types/taste';
import { fetchTasteProfileApi, ApiError } from '../api/taste';

export interface TasteProfileState {
  tasteProfile: TasteProfile | null;
  isLoading: boolean;
  error: string | null;
  errorCode: number | null;
  fetchTasteProfile: (
    apiUrl: string,
    accessToken?: string,
    fetcher?: typeof fetchTasteProfileApi
  ) => Promise<TasteProfile | null>;
  clearTasteProfile: () => void;
}

export const useTasteProfileStore = create<TasteProfileState>((set) => ({
  tasteProfile: null,
  isLoading: false,
  error: null,
  errorCode: null,

  fetchTasteProfile: async (
    apiUrl: string,
    accessToken?: string,
    fetcher = fetchTasteProfileApi
  ) => {
    set({ isLoading: true, error: null, errorCode: null });
    try {
      const profile = await fetcher(apiUrl, accessToken);
      set({
        tasteProfile: profile,
        isLoading: false,
        error: null,
        errorCode: 200,
      });
      return profile;
    } catch (err: any) {
      const status = err instanceof ApiError ? err.status : 500;
      const message = err?.message || '성향 프로필을 불러오지 못했습니다.';
      set({
        tasteProfile: null,
        isLoading: false,
        error: message,
        errorCode: status,
      });
      return null;
    }
  },

  clearTasteProfile: () => {
    set({
      tasteProfile: null,
      isLoading: false,
      error: null,
      errorCode: null,
    });
  },
}));


