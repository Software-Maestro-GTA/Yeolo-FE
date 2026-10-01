/**
 * @file bookingService.ts
 * @description App MRT client configuration and course-aware booking form defaults.
 */
import Constants from 'expo-constants';
import {
  createMyRealTripClient,
  type CourseDetail,
  type BookingKind,
} from '@yeolo/common';

// Direct client access explicitly selected by the user; Expo extra is public in the app bundle.
export const myRealTrip = createMyRealTripClient(
  Constants.expoConfig?.extra?.myRealTripApiKey || '',
);

export interface BookingContext {
  keyword?: string;
  autoSearch?: boolean;
  country?: string;
  startDate?: string;
  endDate?: string;
}

export type OpenBooking = (kind: BookingKind, context: BookingContext) => void;

/** Prefills known dates without guessing departure airports or shifting historical trips. */
export function courseBookingContext(course?: CourseDetail): BookingContext {
  if (!course) return {};
  const date = new Date(`${course.startDate}T12:00:00Z`);
  const valid =
    Number.isFinite(date.getTime()) &&
    Number.isInteger(course.totalDays) &&
    course.totalDays > 0;
  if (valid) date.setUTCDate(date.getUTCDate() + course.totalDays - 1);
  return {
    keyword: course.destinationCity,
    country: course.destinationCountry,
    startDate: course.startDate,
    endDate: valid ? date.toISOString().slice(0, 10) : '',
  };
}

/** Validates calendar dates, including month overflow, against the user's local day. */
export function isBookingDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    return false;
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return value >= localToday;
}
