/**
 * @file course.ts
 * @description Types and interfaces for course recommendation & SSE course creation request.
 * @requirements REQ-7
 * @functional FUN-6
 * @api API-FB-4
 * @author Antigravity Agent
 */

export type BudgetType = 'cost_effective' | 'moderate' | 'luxury';


export interface CourseCreateRequest {
  destinationCountry: string;
  destinationCity: string;
  startDate: string;
  totalDays: number;
  budgetType: BudgetType;
}

export interface CourseProgressEvent {
  step: string;
  message: string;
}

export interface CourseCompleteEvent {
  status: number;
  message: string;
  data: {
    courseId: string;
  };
}

export interface CourseState {
  createdCourseId: string | null;
  isGenerating: boolean;
  progressStep: string | null;
  progressMessage: string | null;
  error: string | null;
  errorCode: number | null;
}
