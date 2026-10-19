/**
 * @file bookingService.ts
 * @description App MRT client configuration and course-aware booking form defaults.
 */
import Constants from 'expo-constants';
import {
  createMyRealTripClient,
  MyRealTripError,
  type BookingAirport,
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
      // Retrying a different keyword cannot fix missing credentials or rate limits.
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
