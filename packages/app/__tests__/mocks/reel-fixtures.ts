/**
 * @file reel-fixtures.ts
 * @description Course fixture with unsorted stops and separate dates for reel tests.
 */
import type { CourseDetail, ItineraryStop } from '@yeolo/common';
export function reelStop(id: string, sequence: number): ItineraryStop {
  return {
    sequence,
    arrivalTime: '10:00',
    stayMinutes: 60,
    memo: `${id}에서 잠시 쉬어가기`,
    reason: '',
    place: {
      placeId: id,
      placeName: id,
      category: '카페',
      latitude: 35 + sequence * 0.01,
      longitude: 129 + sequence * 0.01,
    },
    transportToNext: {
      type: 'walking',
      distance: 100,
      minutes: 5,
      cost: 0,
      memo: null,
    },
  };
}
export const reelCourse: CourseDetail = {
  courseId: 'reel-course',
  userId: 'user',
  title: '부산 여행',
  destinationCountry: '한국',
  destinationCity: '부산',
  coverImageUrl: '',
  startDate: '2026-10-03',
  totalDays: 2,
  tags: [],
  recommendationReason: '',
  itinerary: {
    days: [
      {
        day: 1,
        date: '2026-10-03',
        memo: '',
        stops: [reelStop('바다', 2), reelStop('카페', 1)],
      },
      { day: 2, date: '2026-10-04', memo: '', stops: [reelStop('야경', 1)] },
    ],
  },
};
