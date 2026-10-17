/**
 * @file useTasteAnalysisPipeline.ts
 * @description Shares one in-flight photo analysis across screen re-entry and detaches closed screens from progress and completion.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTasteStore } from '@yeolo/common';
import { fetchPhotosWithExifData } from '../services/photoService';
import { APP_CONFIG, UI_STRINGS } from '../constants';

export type StepStatus = 'IDLE' | 'IN_PROGRESS' | 'COMPLETED';

export interface ProgressState {
  step1Status: StepStatus;
  step2Status: StepStatus;
  step3Status: StepStatus;
  currentMessage: string;
}

export interface UseTasteAnalysisPipelineResult {
  runPipeline: () => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
  needsMorePhotos: boolean;
  progress: ProgressState;
}

type AnalysisSnapshot = Omit<UseTasteAnalysisPipelineResult, 'runPipeline'>;
interface AnalysisRun {
  token: string;
  snapshot: AnalysisSnapshot;
  listeners: Set<(snapshot: AnalysisSnapshot) => void>;
  promise: Promise<string | null>;
}

const initialSnapshot: AnalysisSnapshot = {
  isLoading: false,
  error: null,
  needsMorePhotos: false,
  progress: {
    step1Status: 'IDLE',
    step2Status: 'IDLE',
    step3Status: 'IDLE',
    currentMessage: '분석 준비 중입니다.',
  },
};

// The native photo query and current SSE API cannot abort in flight. Reuse that
// work on re-entry instead of resetting the store and posting a second analysis.
let activeRun: AnalysisRun | undefined;

function updateRun(run: AnalysisRun, update: Partial<AnalysisSnapshot>) {
  run.snapshot = { ...run.snapshot, ...update };
  run.listeners.forEach((listener) => listener(run.snapshot));
}

function startRun(token: string): AnalysisRun {
  const run: AnalysisRun = {
    token,
    snapshot: {
      isLoading: true,
      error: null,
      needsMorePhotos: false,
      progress: {
        step1Status: 'IN_PROGRESS',
        step2Status: 'IDLE',
        step3Status: 'IDLE',
        currentMessage:
          '사진 데이터의 위치 및 시간 메타데이터를 추출 중입니다.',
      },
    },
    listeners: new Set(),
    promise: Promise.resolve(null),
  };
  activeRun = run;
  useTasteStore.getState().resetTasteState();
  const unsubscribe = useTasteStore.subscribe((state) => {
    const analyzing = state.progressStep === 'ANALYZING_PREFERENCE';
    if (analyzing || state.progressStep === 'PREPROCESSING_IMAGE_METADATA') {
      updateRun(run, {
        progress: {
          step1Status: 'COMPLETED',
          step2Status: analyzing ? 'COMPLETED' : 'IN_PROGRESS',
          step3Status: analyzing ? 'IN_PROGRESS' : 'IDLE',
          currentMessage:
            state.progressMessage ||
            (analyzing
              ? '여행 취향을 분석 중입니다.'
              : '사진 장소 정보를 수집 중입니다.'),
        },
      });
    }
  });
  run.promise = (async () => {
    try {
      const images = await fetchPhotosWithExifData();
      // A closed screen must not start an upload after native collection ends.
      // A screen that re-entered meanwhile is subscribed to the same run.
      if (run.listeners.size === 0) return null;
      updateRun(run, {
        progress: {
          step1Status: 'COMPLETED',
          step2Status: 'IN_PROGRESS',
          step3Status: 'IDLE',
          currentMessage: '메타데이터 추출 완료. 장소 정보 수집을 시작합니다.',
        },
      });
      const apiUrl =
        process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;
      const profileId = await useTasteStore
        .getState()
        .analyzeTaste(apiUrl, token, { images });
      if (!profileId) {
        const { error, errorCode } = useTasteStore.getState();
        updateRun(run, {
          needsMorePhotos:
            errorCode === 400 &&
            error === '분석 가능한 이미지 메타데이터가 부족합니다.',
          error:
            useTasteStore.getState().error ||
            '사진 분석 결과를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        });
        return null;
      }
      updateRun(run, {
        progress: {
          step1Status: 'COMPLETED',
          step2Status: 'COMPLETED',
          step3Status: 'COMPLETED',
          currentMessage: '사용자 취향 분석 완료!',
        },
      });
      return profileId;
    } catch (error: unknown) {
      updateRun(run, {
        needsMorePhotos:
          error instanceof Error &&
          [
            UI_STRINGS.TASTE_ANALYSIS.NO_PHOTOS_ERROR,
            UI_STRINGS.TASTE_ANALYSIS.NO_EXIF_ERROR,
            UI_STRINGS.TASTE_ANALYSIS.INSUFFICIENT_PHOTOS_ERROR,
            UI_STRINGS.TASTE_ANALYSIS.LIMITED_PHOTOS_ERROR,
          ].some((message) => message === error.message),
        error:
          error instanceof Error
            ? error.message
            : '사진 분석 중 오류가 발생했습니다.',
      });
      return null;
    } finally {
      unsubscribe();
      updateRun(run, { isLoading: false });
      if (activeRun === run) activeRun = undefined;
    }
  })();
  return run;
}

/**
 * Returns progress and a shared analysis result; unmount detaches the consumer.
 * If every consumer leaves during collection, the subsequent server request is skipped.
 * An already-started server request completes once and can be resumed on re-entry.
 */
export function useTasteAnalysisPipeline(): UseTasteAnalysisPipelineResult {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const mounted = useRef(true);
  const requestId = useRef(0);
  const detach = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestId.current++;
      detach.current?.();
    };
  }, []);

  const runPipeline = useCallback(async (): Promise<string | null> => {
    const id = ++requestId.current;
    const isCurrent = () => mounted.current && requestId.current === id;
    detach.current?.();
    setSnapshot({ ...initialSnapshot, isLoading: true });
    try {
      const token = (await AsyncStorage.getItem('accessToken')) || '';
      if (!isCurrent()) return null;
      // Never attach another signed-in user's screen to an older request.
      while (activeRun && activeRun.token !== token) {
        await activeRun.promise;
        if (!isCurrent()) return null;
      }
      const run = activeRun ?? startRun(token);
      const listener = (next: AnalysisSnapshot) => {
        if (isCurrent()) setSnapshot(next);
      };
      run.listeners.add(listener);
      detach.current = () => run.listeners.delete(listener);
      listener(run.snapshot);
      const result = await run.promise;
      run.listeners.delete(listener);
      return isCurrent() ? result : null;
    } catch (error: unknown) {
      if (isCurrent())
        setSnapshot({
          ...initialSnapshot,
          error:
            error instanceof Error
              ? error.message
              : '사진 분석 중 오류가 발생했습니다.',
        });
      return null;
    }
  }, []);

  return { ...snapshot, runPipeline };
}
