/**
 * @file BookingAutoSearch.integration.test.tsx
 * @description Exercises course booking entry through the real MRT HTTP client with local MSW responses.
 * @jest-environment-options {"customExportConditions":["node","node-addons"]}
 */
import React from 'react';
import { fireEvent, within } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { BookingScreen } from '../src/screens/BookingScreen';
import { UI_STRINGS } from '../src/constants/strings';
import { renderWithQueryClient as render } from './test-utils';

jest.mock('../src/services/bookingService', () => {
  const service = jest.requireActual('../src/services/bookingService');
  const { createMyRealTripClient } = jest.requireActual('@yeolo/common');
  return {
    ...service,
    myRealTrip: createMyRealTripClient('local-booking-fixture-key'),
  };
});

const server = setupServer();
const base = 'https://partner-ext-api.myrealtrip.com/v1/products/accommodation';
const context = {
  keyword: '도쿄',
  country: '일본',
  startDate: '2099-12-30',
  endDate: '2100-01-02',
  autoSearch: true,
};
const hotel = {
  itemName: '도쿄 여행 호텔',
  salePrice: 150000,
  productUrl: 'https://accommodation.myrealtrip.com/union/products/tokyo',
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('코스에서 숙소 예약을 열면 해외 지역 응답의 ID로 검색하고 결과를 표시한다', async () => {
  const requests: unknown[] = [];
  server.use(
    http.post(`${base}/region-autocomplete`, async ({ request }) => {
      requests.push({ lookup: await request.json() });
      return HttpResponse.json({
        data: { regions: [{ regionId: 987, name: '도쿄도' }] },
      });
    }),
    http.post(`${base}/search`, async ({ request }) => {
      requests.push({ search: await request.json() });
      return HttpResponse.json({ data: { items: [hotel], totalCount: 1 } });
    }),
  );
  const ui = await render(
    <BookingScreen kind='hotel' context={context} onBack={jest.fn()} />,
  );
  expect(await ui.findByText(hotel.itemName)).toBeTruthy();
  expect(ui.getByTestId('hotel-search-summary')).toBeTruthy();
  expect(ui.queryByLabelText(UI_STRINGS.BOOKING.HOTEL_LOCATION)).toBeNull();
  expect(requests).toEqual([
    { lookup: { keyword: '도쿄', isDomestic: false } },
    {
      search: {
        regionId: 987,
        checkIn: '2099-12-30',
        checkOut: '2100-01-02',
        adultCount: 1,
        page: 0,
        size: 20,
      },
    },
  ]);
});

test('자동 숙소 검색이 제한되면 안내 후 같은 조건으로 사용자가 재시도할 수 있다', async () => {
  let searches = 0;
  let regions = 0;
  server.use(
    http.post(`${base}/region-autocomplete`, () => {
      regions += 1;
      return HttpResponse.json({
        data: { regions: [{ regionId: 987, name: '도쿄도' }] },
      });
    }),
    http.post(`${base}/search`, () => {
      searches += 1;
      return searches === 1
        ? new HttpResponse(null, { status: 429 })
        : HttpResponse.json({ data: { items: [hotel], totalCount: 1 } });
    }),
  );
  const ui = await render(
    <BookingScreen kind='hotel' context={context} onBack={jest.fn()} />,
  );
  expect(await ui.findByText(UI_STRINGS.BOOKING.RATE_LIMIT)).toBeTruthy();
  expect(searches).toBe(1);
  expect(ui.queryByTestId('hotel-search-summary')).toBeNull();
  await fireEvent.press(ui.getByTestId('booking-search'));
  expect(await ui.findByText(hotel.itemName)).toBeTruthy();
  expect(regions).toBe(1);
  expect(searches).toBe(2);
});

test('코스 목적지로 투어 티켓을 즉시 검색하고 국가·도시와 태그 없는 상품을 보여준다', async () => {
  const requests: unknown[] = [];
  const ticket = {
    itemName: '도쿄 미술관 입장권',
    salePrice: 27000,
    productUrl: 'https://experiences.myrealtrip.com/products/tokyo-museum',
    tags: ['무료취소', '최저가 보장제'],
  };
  server.use(
    http.post(
      'https://partner-ext-api.myrealtrip.com/v1/products/tna/search',
      async ({ request }) => {
        requests.push(await request.json());
        return HttpResponse.json({ data: { items: [ticket], totalCount: 1 } });
      },
    ),
  );
  const ui = await render(
    <BookingScreen
      kind='ticket'
      context={{ ...context, startDate: '2020-01-01', endDate: '2020-01-02' }}
      onBack={jest.fn()}
    />,
  );
  const card = within(await ui.findByTestId('ticket-result-0'));
  expect(card.getByText(ticket.itemName)).toBeTruthy();
  for (const tag of ticket.tags) expect(card.queryByText(tag)).toBeNull();
  const summary = within(ui.getByTestId('ticket-search-summary'));
  expect(summary.getByText('일본')).toBeTruthy();
  expect(summary.getByText('도쿄')).toBeTruthy();
  expect(ui.queryByTestId('booking-search')).toBeNull();
  expect(requests).toEqual([{ keyword: '도쿄', page: 1, size: 20 }]);
});
