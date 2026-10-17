/**
 * @file courseServiceMap.test.ts
 * @description Course map preparation retains verified coordinates even when multiple venues share a location.
 */
import type { ItineraryStop } from '@yeolo/common';
import { processCourseStopsMapData } from '../src/services/courseService';

it('겹치거나 가까운 장소의 원래 좌표와 순서를 보존하고 누락 좌표만 제외한다', () => {
  const coordinates = [
    { latitude: 35.01, longitude: 135.67 },
    { latitude: 35.01, longitude: 135.67 },
    { latitude: 35.0101, longitude: 135.6701 },
    { latitude: 0, longitude: 0 },
  ];
  const stops: ItineraryStop[] = coordinates.map((coordinate, index) => ({
    sequence: index + 1,
    arrivalTime: '10:00',
    stayMinutes: 30,
    memo: '',
    reason: '',
    cost: 0,
    transportToNext: {
      type: 'walking',
      distance: 0,
      minutes: 0,
      cost: 0,
      memo: null,
    },
    place: {
      placeId: `place-${index}`,
      placeName: `장소 ${index + 1}`,
      category: 'SPOT',
      ...coordinate,
    },
  }));
  const result = processCourseStopsMapData(stops, '교토');
  expect(result.coordinates).toEqual(
    coordinates.slice(0, 3).map((coordinate, index) => ({
      ...coordinate,
      placeName: `장소 ${index + 1}`,
      sequence: index + 1,
    })),
  );
  expect(
    stops.map((stop) => ({
      latitude: stop.place.latitude,
      longitude: stop.place.longitude,
    })),
  ).toEqual(coordinates);
});
