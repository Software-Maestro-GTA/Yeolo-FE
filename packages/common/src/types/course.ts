/**
 * @file course.ts
 * @description Types and interfaces for course recommendation, course list & course detail (DOM-3, API-COURSE-2, API-COURSE-3, API-AI-2).
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

export type BudgetType = 'cost_effective' | 'moderate' | 'luxury';
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
  cost: number | null;
  memo: string | null;
}

export interface ItineraryStop {
  sequence: number;
  arrivalTime: string;
  stayMinutes: number;
  memo: string;
  reason: string;
  cost?: number | null;
  place: ItineraryPlace;
  transportToNext: TransportInfo;
}

export interface ItineraryDay {
  day: number;
  date: string;
  memo: string;
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
  coverImageUrl: string;
  startDate: string;
  totalDays: number;
  tags: string[];
  recommendationReason: string;
  itinerary: Itinerary;
  totalCost?: number;
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
