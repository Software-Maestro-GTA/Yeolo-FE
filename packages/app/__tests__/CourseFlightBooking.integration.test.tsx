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
import { createMyRealTripClient } from '@yeolo/common';
import { BookingScreen } from '../src/screens/BookingScreen';
import {
  myRealTrip,
  resolveCourseArrivalAirport,
} from '../src/services/bookingService';
import { UI_STRINGS } from '../src/constants/strings';
import { renderWithQueryClient as render } from './test-utils';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: { myRealTripApiKey: 'local-flight-fixture-key' },
    },
  },
}));

const server = setupServer();
const base = 'https://partner-ext-api.myrealtrip.com/v1';
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
    const landing = 'https://air-web.myrealtrip.com/results?fixture=course';
    const affiliate = 'https://myrealt.rip/course-flight';
    server.use(
      http.post(
        `${base}/products/flight/airport-autocomplete`,
        async ({ request }) => {
          expect(request.headers.get('Authorization')).toBe(
            'Bearer local-flight-fixture-key',
          );
          const body = (await request.json()) as {
            keyword: string;
            size: number;
          };
          expect(body.size).toBe(10);
          airportQueries.push(body.keyword);
          return HttpResponse.json({
            data: {
              airports:
                body.keyword === '인천'
                  ? [{ airport: { code: 'ICN', koName: '인천' } }]
                  : body.keyword === matchingQuery
                    ? [arrival]
                    : [],
            },
          });
        },
      ),
      http.post(
        `${base}/products/flight/fare-query-landing-url`,
        async ({ request }) => {
          linkRequests.push({ flight: await request.json() });
          return HttpResponse.json({ data: landing });
        },
      ),
      http.post(`${base}/mylink`, async ({ request }) => {
        linkRequests.push({ affiliate: await request.json() });
        return HttpResponse.json({ data: { mylink: affiliate } });
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
        flight: {
          depAirportCd: 'ICN',
          arrAirportCd: 'NRT',
          tripTypeCd: 'RT',
          depDate: '2099-12-30',
          arrDate: '2100-01-02',
          adult: 1,
        },
      },
      { affiliate: { targetUrl: landing } },
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
    http.post(
      `${base}/products/flight/airport-autocomplete`,
      async ({ request }) => {
        const { keyword } = (await request.json()) as { keyword: string };
        queries.push(keyword);
        return HttpResponse.json({ data: { airports: [arrival] } });
      },
    ),
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
      http.post(
        `${base}/products/flight/airport-autocomplete`,
        async ({ request }) => {
          const { keyword } = (await request.json()) as { keyword: string };
          queries.push(keyword);
          return new HttpResponse(null, { status });
        },
      ),
    );
    await expect(
      resolveCourseArrivalAirport(context, new AbortController().signal),
    ).rejects.toMatchObject({ code: 'request', status });
    expect(queries).toEqual([context.arrivalAirportName]);
  },
);

test('API 키가 없으면 공항 조회를 반복하거나 HTTP 요청을 보내지 않는다', async () => {
  let httpCalls = 0;
  server.use(
    http.post(`${base}/products/flight/airport-autocomplete`, () => {
      httpCalls += 1;
      return HttpResponse.json({ data: { airports: [arrival] } });
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
    http.post(
      `${base}/products/flight/airport-autocomplete`,
      async ({ request }) => {
        const { keyword } = (await request.json()) as { keyword: string };
        queries.push(keyword);
        return keyword === context.arrivalAirportName
          ? new HttpResponse(null, { status: 503 })
          : HttpResponse.json({ data: { airports: [arrival] } });
      },
    ),
  );
  await expect(
    resolveCourseArrivalAirport(context, new AbortController().signal),
  ).resolves.toMatchObject({ airport: { code: 'NRT' } });
  expect(queries).toEqual([context.arrivalAirportName, '일본 도쿄']);
});
