/**
 * @file course.ts
 * @description Types and interfaces for course recommendation, course list & course detail (DOM-2, API-FB-7, API-FB-10).
 * @requirements REQ-9
 * @functional FUN-3, FUN-7
 * @api API-FB-7, API-FB-10
 * @author Antigravity Agent
 */

export interface CourseSummary {
  courseId: string;
  title: string;
  destinationCountry: string;
  destinationCity: string;
  startDate: string;
  totalDays: number;
  tags: string[];
  recommendationReason: string;
  createdAt: string;
}

export interface CourseListApiResponse {
  status: number;
  message: string;
  data: {
    courses: CourseSummary[];
  };
}

export type BudgetType = 'cost_effective' | 'standard' | 'luxury';
export type TransportType = 'walking' | 'transit' | 'driving' | 'taxi' | 'none';
export type PaceType = 'relaxed' | 'balanced' | 'dense';

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

export interface ItineraryStop {
  sequence: number;
  placeId: string;
  placeName: string;
  category: string;
  arrivalTime: string;
  stayMinutes: number;
  memo?: string;
  transportToNext: TransportType;
  travelMinutesToNext?: number;
  cost: number;
  reason?: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  memo?: string;
  stops: ItineraryStop[];
}

export interface Itinerary {
  days: ItineraryDay[];
}

export interface CourseDetail {
  courseId: string;
  userId: string;
  title: string;
  destinationCountry: string;
  destinationCity: string;
  startDate: string;
  totalDays: number;
  totalCost: number;
  tags: string[];
  recommendationReason: string;
  itinerary: Itinerary;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseDetailApiResponse {
  status: number;
  message: string;
  data: {
    course: CourseDetail;
  };
}
