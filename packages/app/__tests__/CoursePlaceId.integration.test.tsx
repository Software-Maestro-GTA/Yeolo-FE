/**
 * @file CoursePlaceId.integration.test.tsx
 * @description API-COURSE-2의 googlePlaceId 응답이 실제 HTTP 클라이언트를 거쳐 지도 검색·길찾기에 전달되는지 검증합니다.
 * @jest-environment-options {"customExportConditions":["node","node-addons"]}
 */
import React from 'react';
import { Linking } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { getCourseDetailApi } from '../../common/src/api/course';
import { ItineraryTimelineItem } from '../src/components/course/ItineraryTimelineItem';
import { reelCourse, reelStop } from './mocks/reel-fixtures';
import { renderWithQueryClient as render } from './test-utils';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  jest.restoreAllMocks();
});
afterAll(() => server.close());

it('새 코스 응답의 Google ID를 이름이 같은 장소 검색과 다음 장소 길찾기에 사용한다', async () => {
  const first = {
    ...reelStop('ChIJ_jean_georges_new_york_fixture', 1),
    transportToNext: {
      type: 'unknown' as const,
      distance: null,
      minutes: null,
      memo: null,
    },
  };
  first.place.placeName = '장 조르주';
  const second = reelStop('ChIJ_next_new_york_fixture', 2);
  const course = {
    ...reelCourse,
    itinerary: {
      days: [{ day: 1, date: '2026-10-25', stops: [first, second] }],
    },
  };
  server.use(
    http.get(
      'https://api.test/api/courses/google-place-course',
      ({ request }) => {
        expect(request.headers.get('Authorization')).toBe(
          'Bearer fixture-token',
        );
        expect(request.headers.get('Accept-Language')).toBe('ko');
        return HttpResponse.json({
          status: 200,
          message: '여행 코스 조회 성공',
          data: { course },
        });
      },
    ),
  );
  const detail = await getCourseDetailApi(
    'https://api.test',
    'fixture-token',
    'google-place-course',
  );
  const [stop, next] = detail.itinerary.days[0].stops;
  expect(stop.place).toHaveProperty(
    'googlePlaceId',
    'ChIJ_jean_georges_new_york_fixture',
  );
  expect(stop.place).not.toHaveProperty('placeId');

  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  const ui = await render(
    <ItineraryTimelineItem stop={stop} nextPlace={next.place} isLast={false} />,
  );
  await fireEvent.press(ui.getByTestId('map-link-1'));
  const search = new URL(open.mock.calls[0][0]);
  expect(search.searchParams.get('query')).toBe('장 조르주');
  expect(search.searchParams.get('query_place_id')).toBe(
    'ChIJ_jean_georges_new_york_fixture',
  );
  await fireEvent.press(
    ui.getByRole('link', { name: 'Google 지도에서 길찾기' }),
  );
  const directions = new URL(open.mock.calls[1][0]);
  expect(directions.searchParams.get('origin_place_id')).toBe(
    'ChIJ_jean_georges_new_york_fixture',
  );
  expect(directions.searchParams.get('destination_place_id')).toBe(
    'ChIJ_next_new_york_fixture',
  );
});
