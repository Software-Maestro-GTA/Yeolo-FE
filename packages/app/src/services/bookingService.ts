/**
 * @file bookingService.ts
 * @description Yeolo booking API configuration and course-aware booking form defaults.
 */
import {
  AppVersionMismatchError,
  createMyRealTripClient,
  MyRealTripError,
  type BookingAirport,
  type CourseDetail,
  type BookingKind,
} from '@yeolo/common';

import { APP_CONFIG } from '../constants/config';

export const myRealTrip = createMyRealTripClient(
  process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL,
);

export interface BookingContext {
  keyword?: string;
  autoSearch?: boolean;
  country?: string;
  arrivalAirportName?: string;
  startDate?: string;
  endDate?: string;
}

export type OpenBooking = (kind: BookingKind, context: BookingContext) => void;

/** Prefills known dates without guessing departure airports or shifting historical trips. */
export function courseBookingContext(
  course?: CourseDetail,
  kind?: BookingKind,
): BookingContext {
  if (!course) return {};
  const date = new Date(`${course.startDate}T12:00:00Z`);
  const valid =
    Number.isFinite(date.getTime()) &&
    Number.isInteger(course.totalDays) &&
    course.totalDays > 0;
  if (valid) date.setUTCDate(date.getUTCDate() + course.totalDays - 1);
  const firstPlace = course.itinerary?.days
    .find((day) => day.day === 1)
    ?.stops.find((stop) => stop.sequence === 1)?.place;
  const arrivalAirportName =
    kind === 'flight' && firstPlace?.category === 'AIRPORT'
      ? firstPlace.placeName.trim()
      : '';
  return {
    keyword: course.destinationCity,
    country: course.destinationCountry,
    startDate: course.startDate,
    endDate: valid ? date.toISOString().slice(0, 10) : '',
    ...(arrivalAirportName && { arrivalAirportName }),
  };
}

/** Resolves the course airport first, then its destination, using provider airport codes only. */
export async function resolveCourseArrivalAirport(
  context: BookingContext,
  signal: AbortSignal,
): Promise<BookingAirport | undefined> {
  const airportName = context.arrivalAirportName?.trim();
  const city = context.keyword?.trim();
  const country = context.country?.trim();
  const queries = new Set(
    [
      airportName,
      airportName && country && city ? `${country} ${city}` : '',
      city,
    ].filter((query): query is string => !!query),
  );
  let lastError: unknown;
  for (const query of queries) {
    if (signal.aborted) return;
    try {
      const [airport] = await myRealTrip.searchAirports(query, signal);
      if (signal.aborted) return;
      if (airport) return airport;
    } catch (error) {
      if (signal.aborted) return;
      // Another keyword cannot fix an outdated app, authentication or rate limits.
      if (error instanceof AppVersionMismatchError) throw error;
      if (
        error instanceof MyRealTripError &&
        (error.code === 'configuration' ||
          [401, 403, 429].includes(error.status ?? 0))
      )
        throw error;
      lastError = error;
    }
  }
  if (lastError) throw lastError;
}

/**
 * Returns the Asia/Seoul service day used by the booking APIs.
 * @returns ISO calendar date; Korea uses UTC+09:00 without daylight saving.
 */
export function bookingToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Validates calendar dates, including month overflow, against the Seoul service day. */
export function isBookingDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    return false;
  return value >= bookingToday();
}
