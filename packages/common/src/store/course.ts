/**
 * @file course.ts
 * @description Screen-independent course creation state with duplicate submission protection and terminal completion.
 */
import { create } from 'zustand';
import type { CourseCreateRequest, CourseState } from '../types/course';
import { createCourseStreamApi } from '../api/course';
import { ApiError } from '../api/errors';

export interface CourseStoreState extends CourseState {
  setProgress: (step: string, message: string) => void;
  setComplete: (courseId: string) => void;
  setError: (error: string, errorCode?: number) => void;
  resetCourseState: () => void;
  createCourse: (
    apiUrl: string,
    payload: CourseCreateRequest,
    accessToken?: string,
    fetcher?: typeof createCourseStreamApi,
  ) => Promise<string | null>;
}

export const useCourseStore = create<CourseStoreState>((set, get) => ({
  createdCourseId: null,
  isGenerating: false,
  progressStep: null,
  progressMessage: null,
  error: null,
  errorCode: null,

  setProgress: (step: string, message: string) => {
    set({
      isGenerating: true,
      progressStep: step,
      progressMessage: message,
      error: null,
      errorCode: null,
    });
  },

  setComplete: (courseId: string) => {
    set({
      createdCourseId: courseId,
      isGenerating: false,
      error: null,
      errorCode: 200,
    });
  },

  setError: (error: string, errorCode: number = 400) => {
    set({
      isGenerating: false,
      error,
      errorCode,
    });
  },

  resetCourseState: () => {
    set({
      createdCourseId: null,
      isGenerating: false,
      progressStep: null,
      progressMessage: null,
      error: null,
      errorCode: null,
    });
  },

  createCourse: async (
    apiUrl: string,
    payload: CourseCreateRequest,
    accessToken?: string,
    fetcher = createCourseStreamApi,
  ) => {
    if (get().isGenerating) return null;
    set({
      isGenerating: true,
      error: null,
      errorCode: null,
      createdCourseId: null,
      progressStep: 'INIT',
      progressMessage: '코스 생성 준비 중...',
    });

    try {
      const courseId = await fetcher(apiUrl, accessToken || '', payload, {
        onProgress: (event) => {
          set({
            isGenerating: true,
            progressStep: event.step,
            progressMessage: event.message,
          });
        },
        onComplete: (event) => {
          set({
            createdCourseId: event.data.courseId,
            isGenerating: false,
            error: null,
            errorCode: 200,
          });
        },
      });

      set({
        createdCourseId: courseId,
        isGenerating: false,
      });

      return courseId;
    } catch (err: any) {
      // The complete callback is authoritative even if transport cleanup fails.
      if (get().createdCourseId) return get().createdCourseId;
      const status = err instanceof ApiError ? err.status : 400;
      const message = err?.message || '여행 조건 입력값이 올바르지 않습니다.';
      set({
        isGenerating: false,
        error: message,
        errorCode: status,
      });
      return null;
    }
  },
}));
