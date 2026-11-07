/**
 * @file CourseFlightBooking.integration.test.tsx
 * @description Verifies course arrival-airport fallback and automatic affiliate flight search through the real MRT client and local MSW responses.
 * @jest-environment-options {"customExportConditions":["node","node-addons"]}
 */
import React from 'react';
import { waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  AppVersionMismatchError,
  createMyRealTripClient,
  setTokenGetter,
} from '@yeolo/common';
import { BookingScreen } from '../src/screens/BookingScreen';
import {
  myRealTrip,
  resolveCourseArrivalAirport,
} from '../src/services/bookingService';
import { UI_STRINGS } from '../src/constants/strings';
import { renderWithQueryClient as render } from './test-utils';

const server = setupServer();
const base = '*/api/myrealtrip';
const context = {
  keyword: '도쿄',
  country: '일본',
  arrivalAirportName: '나리타 국제공항 제1터미널',
  startDate: '2099-12-30',
  endDate: '2100-01-02',
  autoSearch: true,
};
const arrival = {
  airport: { code: 'NRT', koName: '나리타' },
  city: { code: 'TYO' },
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  jest.clearAllMocks();
  setTokenGetter(async () => ({ accessToken: 'yeolo-flight-token' }));
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
});
afterEach(() => {
  server.resetHandlers();
  jest.restoreAllMocks();
});
afterAll(() => server.close());

test.each([
  ['국가와 도시', '일본 도쿄', [context.arrivalAirportName, '일본 도쿄']],
  ['도시', '도쿄', [context.arrivalAirportName, '일본 도쿄', '도쿄']],
])(
  '코스 공항을 찾지 못하면 %s까지 조회하고 실제 공항 코드로 왕복 항공 링크를 자동으로 연다',
  async (_description, matchingQuery, expectedArrivalQueries) => {
    const airportQueries: string[] = [];
    const linkRequests: unknown[] = [];
    const affiliate = 'https://myrealt.rip/course-flight';
    server.use(
      http.get(`${base}/airports`, async ({ request }) => {
        expect(request.headers.get('Authorization')).toBe(
          'Bearer yeolo-flight-token',
        );
        const keyword = new URL(request.url).searchParams.get('keyword')!;
        expect(new URL(request.url).searchParams.has('size')).toBe(false);
        airportQueries.push(keyword);
        return HttpResponse.json({
          status: 200,
          message: 'ok',
          data: {
            airports:
              keyword === '인천'
                ? [{ airport: { code: 'ICN', koName: '인천' } }]
                : keyword === matchingQuery
                  ? [arrival]
                  : [],
          },
        });
      }),
      http.post(`${base}/flights/link`, async ({ request }) => {
        linkRequests.push(await request.json());
        return HttpResponse.json({
          status: 200,
          message: 'ok',
          data: { url: affiliate },
        });
      }),
    );

    const ui = await render(
      <BookingScreen kind='flight' context={context} onBack={jest.fn()} />,
    );
    await waitFor(() =>
      expect(Linking.openURL).toHaveBeenCalledWith(affiliate),
    );
    expect(Linking.openURL).toHaveBeenCalledTimes(1);
    expect(airportQueries.filter((query) => query !== '인천')).toEqual(
      expectedArrivalQueries,
    );
    expect(ui.getByLabelText(UI_STRINGS.BOOKING.ARRIVAL).props.value).toBe(
      '나리타 (NRT)',
    );
    expect(linkRequests).toEqual([
      {
        depAirportCd: 'ICN',
        arrAirportCd: 'NRT',
        depDate: '2099-12-30',
        arrDate: '2100-01-02',
        adult: 1,
      },
    ]);
  },
);

test.each([
  [
    '코스 공항이 일치하면 도시를 재조회하지 않는다',
    context,
    context.arrivalAirportName,
  ],
  [
    '코스 공항이 없으면 기존 도시 조회만 사용한다',
    { ...context, arrivalAirportName: undefined },
    '도쿄',
  ],
])('%s', async (_description, bookingContext, expectedQuery) => {
  const queries: string[] = [];
  server.use(
    http.get(`${base}/airports`, async ({ request }) => {
      const keyword = new URL(request.url).searchParams.get('keyword')!;
      queries.push(keyword);
      return HttpResponse.json({
        status: 200,
        message: 'ok',
        data: { airports: [arrival] },
      });
    }),
  );
  await expect(
    resolveCourseArrivalAirport(bookingContext, new AbortController().signal),
  ).resolves.toMatchObject({ airport: { code: 'NRT' } });
  expect(queries).toEqual([expectedQuery]);
});

test.each([401, 403, 429])(
  '공항 조회 HTTP %s 오류는 국가·도시 재조회로 확산하지 않는다',
  async (status) => {
    const queries: string[] = [];
    server.use(
      http.get(`${base}/airports`, async ({ request }) => {
        const keyword = new URL(request.url).searchParams.get('keyword')!;
        queries.push(keyword);
        return new HttpResponse(null, { status });
      }),
    );
    await expect(
      resolveCourseArrivalAirport(context, new AbortController().signal),
    ).rejects.toMatchObject({ code: 'request', status });
    expect(queries).toEqual([context.arrivalAirportName]);
  },
);

test('백엔드 주소가 없으면 공항 조회를 반복하거나 HTTP 요청을 보내지 않는다', async () => {
  let httpCalls = 0;
  server.use(
    http.get(`${base}/airports`, () => {
      httpCalls += 1;
      return HttpResponse.json({
        status: 200,
        message: 'ok',
        data: { airports: [arrival] },
      });
    }),
  );
  const unconfigured = createMyRealTripClient('');
  const lookup = jest
    .spyOn(myRealTrip, 'searchAirports')
    .mockImplementation(unconfigured.searchAirports);
  await expect(
    resolveCourseArrivalAirport(context, new AbortController().signal),
  ).rejects.toMatchObject({ code: 'configuration' });
  expect(lookup).toHaveBeenCalledTimes(1);
  expect(httpCalls).toBe(0);
});

test('일시적인 공항 조회 실패는 국가·도시 조회로 대체할 수 있다', async () => {
  const queries: string[] = [];
  server.use(
    http.get(`${base}/airports`, async ({ request }) => {
      const keyword = new URL(request.url).searchParams.get('keyword')!;
      queries.push(keyword);
      return keyword === context.arrivalAirportName
        ? new HttpResponse(null, { status: 503 })
        : HttpResponse.json({
            status: 200,
            message: 'ok',
            data: { airports: [arrival] },
          });
    }),
  );
  await expect(
    resolveCourseArrivalAirport(context, new AbortController().signal),
  ).resolves.toMatchObject({ airport: { code: 'NRT' } });
  expect(queries).toEqual([context.arrivalAirportName, '일본 도쿄']);
});

test('버전 불일치는 국가·도시 대체 조회 없이 업데이트 처리로 전달한다', async () => {
  let calls = 0;
  server.use(
    http.get(`${base}/airports`, () => {
      calls += 1;
      return HttpResponse.json(
        { status: 426, error: '앱 버전이 맞지 않습니다.' },
        { status: 426 },
      );
    }),
  );
  await expect(
    resolveCourseArrivalAirport(context, new AbortController().signal),
  ).rejects.toBeInstanceOf(AppVersionMismatchError);
  expect(calls).toBe(1);
});
