/**
 * @file course.ts
 * @description Types and interfaces for course creation, course detail, course list, and course deletion (API-COURSE-1~4).
 */

export interface CourseSummary {
  courseId: string;
  title: string;
  destinationCountry: string;
  destinationCity: string;
  coverImageUrl: string;
  startDate: string;
  totalDays: number;
  tags: string[];
  createdAt: string;
  recommendationReason?: string;
}

export interface CourseListApiResponse {
  status: number;
  message: string;
  data: {
    courses: CourseSummary[];
  };
}

export type BudgetType = 'cost_effective' | 'moderate' | 'luxury';
export type TransportType =
  'walking' | 'transit' | 'driving' | 'taxi' | 'none' | 'unknown';
export type PaceType = 'relaxed' | 'balanced' | 'dense';

export interface CourseCreateRequest {
  destinationCountry: string;
  destinationCity: string;
  startDate: string;
  totalDays: number;
  budget: number;
}

export type CourseProgressStep =
  'LOADING_TASTE_PREFERENCE' | 'GENERATING_COURSE' | (string & {});

export interface CourseProgressEvent {
  step: CourseProgressStep;
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

export interface ItineraryPlace {
  placeId: string;
  placeName: string;
  category: string;
  latitude: number;
  longitude: number;
}

export interface TransportInfo {
  type: TransportType;
  distance: number | null;
  minutes: number | null;
  cost?: number | null;
  memo: string | null;
}

export interface ItineraryStop {
  sequence: number;
  arrivalTime?: string;
  stayMinutes: number;
  memo: string;
  reason: string;
  cost?: number;
  place: ItineraryPlace;
  transportToNext: TransportInfo;
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
  coverImageUrl?: string;
  startDate: string;
  totalDays: number;
  totalCost?: number;
  totalCostExRate?: number;
  exRateIcon?: string;
  tags: string[];
  recommendationReason?: string;
  itinerary: Itinerary;
}

export interface CourseDetailApiResponse {
  status: number;
  message: string;
  data: {
    course: CourseDetail;
  };
}

export interface CourseDeleteApiResponse {
  status: number;
  message: string;
  data: null;
}
