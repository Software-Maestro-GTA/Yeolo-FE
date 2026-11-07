/**
 * @file TicketCouponPack.integration.test.tsx
 * @description Verifies coupons are visible only after the server returns active codes.
 * @jest-environment-options {"customExportConditions":["node","node-addons"]}
 */
import React from 'react';
import { act, fireEvent } from '@testing-library/react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { TicketCouponPack } from '../src/components/booking/TicketCouponPack';
import { UI_STRINGS } from '../src/constants/strings';
import { myRealTrip } from '../src/services/bookingService';
import { renderWithQueryClient as render } from './test-utils';

const server = setupServer();
const endpoint = '*/api/myrealtrip/coupons';
const coupon = { code: 'SERVER2026', minimumPrice: 70000, discount: 2000 };
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
afterAll(() => server.close());

test('응답 전에는 쿠폰팩을 숨기고 서버가 제공한 쿠폰만 표시하고 복사한다', async () => {
  let respond!: () => void;
  const pending = new Promise<void>((resolve) => {
    respond = resolve;
  });
  server.use(
    http.get(endpoint, async () => {
      await pending;
      return HttpResponse.json({
        status: 200,
        message: 'ok',
        data: { coupons: [coupon] },
      });
    }),
  );
  const ui = await render(<TicketCouponPack />);
  const packBeforeResponse = ui.queryByTestId('ticket-coupon-pack');
  respond();
  expect(await ui.findByText('2,000원')).toBeTruthy();
  expect(packBeforeResponse).toBeNull();
  expect(ui.getByText('70,000원 이상 구매 시')).toBeTruthy();
  expect(ui.queryByTestId('ticket-coupon-copy-PACKMKTP1000')).toBeNull();
  await fireEvent.press(ui.getByTestId('ticket-coupon-copy-SERVER2026'));
  expect(Clipboard.setString).toHaveBeenCalledWith(coupon.code);
  expect(ui.getByText(UI_STRINGS.BOOKING.COUPON_COPIED)).toBeTruthy();
});

test('서버가 빈 목록을 반환하면 쿠폰팩 전체를 숨긴다', async () => {
  const request = jest.spyOn(myRealTrip, 'getCoupons');
  server.use(
    http.get(endpoint, () =>
      HttpResponse.json({
        status: 200,
        message: 'ok',
        data: { coupons: [] },
      }),
    ),
  );
  const ui = await render(<TicketCouponPack />);
  expect(request).toHaveBeenCalledTimes(1);
  await act(async () => {
    await expect(request.mock.results[0].value).resolves.toEqual([]);
  });
  expect(ui.queryByTestId('ticket-coupon-pack')).toBeNull();
});

test('쿠폰 조회가 실패하면 쿠폰팩 전체를 숨긴다', async () => {
  const request = jest.spyOn(myRealTrip, 'getCoupons');
  server.use(
    http.get(endpoint, () =>
      HttpResponse.json(
        {
          status: 500,
          message: '쿠폰 정보를 불러오지 못했습니다.',
          data: null,
        },
        { status: 500 },
      ),
    ),
  );
  const ui = await render(<TicketCouponPack />);
  expect(request).toHaveBeenCalledTimes(1);
  await act(async () => {
    await expect(request.mock.results[0].value).rejects.toMatchObject({
      status: 500,
    });
  });
  expect(ui.queryByTestId('ticket-coupon-pack')).toBeNull();
});
