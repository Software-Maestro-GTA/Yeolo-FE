/**
 * @file useTasteAnalysisPipeline.ts
 * @description Custom hook for orchestrating device EXIF photo extraction and real-time backend SSE taste analysis 3-step progress pipeline execution.
 */
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTasteStore } from '@yeolo/common';
import { fetchPhotosWithExifData } from '../services/photoService';
import { APP_CONFIG } from '../constants';

export type StepStatus = 'IDLE' | 'IN_PROGRESS' | 'COMPLETED';

export interface ProgressState {
  step1Status: StepStatus; // 1단계: 앱 메타데이터 추출 (사진 데이터 수집)
  step2Status: StepStatus; // 2단계: 장소 정보 수집 (PREPROCESSING_IMAGE_METADATA)
  step3Status: StepStatus; // 3단계: 사용자 취향 분석 (ANALYZING_PREFERENCE)
  currentMessage: string;
}

export interface UseTasteAnalysisPipelineResult {
  runPipeline: () => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
  progress: ProgressState;
}

/**
 * Custom hook to execute device photo EXIF extraction and taste profile analysis API call with real-time 3-step progress.
 */
export function useTasteAnalysisPipeline(): UseTasteAnalysisPipelineResult {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [progress, setProgress] = useState<ProgressState>({
    step1Status: 'IDLE',
    step2Status: 'IDLE',
    step3Status: 'IDLE',
    currentMessage: '분석 준비 중입니다.',
  });

  const progressStep = useTasteStore((state) => state.progressStep);
  const progressMessage = useTasteStore((state) => state.progressMessage);

  // Sync real-time SSE progressStep & progressMessage from Zustand store
  useEffect(() => {
    if (progressStep === 'PREPROCESSING_IMAGE_METADATA') {
      // 2단계 진행중 (PREPROCESSING_IMAGE_METADATA SSE 수신)
      setProgress((prev) => ({
        ...prev,
        step1Status: 'COMPLETED',
        step2Status: 'IN_PROGRESS',
        step3Status: 'IDLE',
        currentMessage: progressMessage || '사진 장소 정보를 수집 중입니다.',
      }));
    } else if (progressStep === 'ANALYZING_PREFERENCE') {
      // 2단계 완료 & 3단계 진행중 (ANALYZING_PREFERENCE SSE 수신)
      setProgress((prev) => ({
        ...prev,
        step1Status: 'COMPLETED',
        step2Status: 'COMPLETED',
        step3Status: 'IN_PROGRESS',
        currentMessage: progressMessage || '여행 취향을 분석 중입니다.',
      }));
    }
  }, [progressStep, progressMessage]);

  const runPipeline = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    useTasteStore.getState().resetTasteState();

    // [1단계 진행중]: 앱에서 메타데이터 추출 진행 중
    setProgress({
      step1Status: 'IN_PROGRESS',
      step2Status: 'IDLE',
      step3Status: 'IDLE',
      currentMessage: '사진 데이터의 위치 및 시간 메타데이터를 추출 중입니다.',
    });

    try {
      // 1. 앱 메타데이터 추출
      const exifDataList = await fetchPhotosWithExifData();

      // [1단계 완료 / 2단계 진행 대기]: 메타데이터 추출 완료
      setProgress({
        step1Status: 'COMPLETED',
        step2Status: 'IN_PROGRESS',
        step3Status: 'IDLE',
        currentMessage: '메타데이터 추출 완료. 장소 정보 수집을 시작합니다.',
      });

      // 2. JWT 토큰 및 API URL 준비
      const token = (await AsyncStorage.getItem('accessToken')) || '';
      const apiUrl =
        process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

      // 3. 백엔드 SSE 취향 분석 실행
      const profileId = await useTasteStore
        .getState()
        .analyzeTaste(apiUrl, token, { images: exifDataList });

      if (!profileId) {
        const storeError = useTasteStore.getState().error;
        const failureMsg =
          storeError ||
          '사진 분석 결과를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.';
        setError(failureMsg);
        return null;
      }

      // [3단계 완료]: event: complete SSE 수신 확인
      setProgress({
        step1Status: 'COMPLETED',
        step2Status: 'COMPLETED',
        step3Status: 'COMPLETED',
        currentMessage: '사용자 취향 분석 완료!',
      });

      return profileId;
    } catch (err: any) {
      const errMsg = err.message || '사진 분석 중 오류가 발생했습니다.';
      setError(errMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    runPipeline,
    isLoading,
    error,
    progress,
  };
}
