/**
 * @file taste.ts
 * @description Zustand global store for managing taste preference SSE streaming analysis states.
 */
import { create } from 'zustand';
import type { AnalyzeTastePayload, TasteAnalysisState } from '../types/taste';
import { analyzeTastePreferenceStream } from '../api/taste';
import { logger } from '../utils/logger';


export interface TasteStoreState extends TasteAnalysisState {
  setProgress: (step: string, message: string) => void;
  setComplete: () => void;
  setError: (error: string, errorCode?: number) => void;
  resetTasteState: () => void;
  analyzeTaste: (
    apiUrl: string,
    accessToken: string,
    payload: AnalyzeTastePayload,
    fetcher?: typeof analyzeTastePreferenceStream
  ) => Promise<string | null>;
}

export const useTasteStore = create<TasteStoreState>((set) => ({
  isAnalyzing: false,
  progressStep: null,
  progressMessage: null,
  error: null,
  errorCode: null,

  setProgress: (step: string, message: string) => {
    set({
      isAnalyzing: true,
      progressStep: step,
      progressMessage: message,
      error: null,
      errorCode: null,
    });
  },

  setComplete: () => {
    set({
      isAnalyzing: false,
      error: null,
      errorCode: 200,
    });
  },

  setError: (error: string, errorCode: number = 400) => {
    set({
      isAnalyzing: false,
      error,
      errorCode,
    });
  },

  resetTasteState: () => {
    set({
      isAnalyzing: false,
      progressStep: null,
      progressMessage: null,
      error: null,
      errorCode: null,
    });
  },

  analyzeTaste: async (apiUrl, accessToken, payload, fetcher = analyzeTastePreferenceStream) => {
    logger.info('[TasteStore] Starting analyzeTaste with images payload:', {
      imageCount: payload.images?.length,
    });
    set({ isAnalyzing: true, error: null, errorCode: null });
    try {
      const profileId = await fetcher(apiUrl, accessToken, payload, {
        onProgress: (event) => {
          logger.info('[TasteStore] Taste analysis SSE progress:', event.step, event.message);
          set({
            isAnalyzing: true,
            progressStep: event.step,
            progressMessage: event.message,
          });
        },
        onComplete: () => {
          logger.info('[TasteStore] Taste analysis SSE complete callback fired');
          set({
            isAnalyzing: false,
            errorCode: 200,
          });
        },
        onError: (err) => {
          logger.error('[TasteStore] Taste analysis SSE error:', err);
          set({
            isAnalyzing: false,
            error: err?.message || '성향 분석 도중 오류가 발생했습니다.',
            errorCode: 400,
          });
        },
      });

      if (profileId) {
        logger.info('[TasteStore] Taste analysis finished successfully. Created Profile ID:', profileId);
        set({
          isAnalyzing: false,
          errorCode: 200,
        });
      }
      return profileId;
    } catch (err: any) {
      const message = err?.message || '성향 분석 도중 오류가 발생했습니다.';
      logger.error('[TasteStore] analyzeTaste exception caught:', message);
      set({
        isAnalyzing: false,
        error: message,
        errorCode: 400,
      });
      return null;
    }
  },
}));
