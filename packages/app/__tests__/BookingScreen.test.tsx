/**
 * @file BookingScreen.test.tsx
 * @description Booking entry, automatic course hotel search, overlays, validation, retry and cancellation flows.
 */
import React from 'react';
import { act, fireEvent, waitFor, within } from '@testing-library/react-native';
import { Linking, StyleSheet } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { MyRealTripError } from '@yeolo/common';
import * as commonApi from '@yeolo/common';
import { BookingScreen } from '../src/screens/BookingScreen';
import {
  layoutDestinationCountries,
  revealDestinationCountry,
} from './mocks/destinationPickerLayout';
import {
  myRealTrip,
  courseBookingContext,
  isBookingDate,
} from '../src/services/bookingService';
import { UI_STRINGS } from '../src/constants/strings';
import { renderWithQueryClient as render } from './test-utils';

jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: { setString: jest.fn() },
}));

const S = UI_STRINGS.BOOKING;
const product = {
  itemName: '성산일출봉 투어',
  productUrl: 'https://experiences.myrealtrip.com/products/123',
  salePrice: 15000,
  description: '제주 · 일출 투어',
  reviewScore: 4.9,
  reviewCount: 125,
  tags: ['즉시 확정', '무료취소', '최저가 보장제'],
  imageUrl: 'https://example.com/ticket.jpg',
};
const ticketPage = (
  items: (typeof product)[],
  page = 1,
  hasMore = false,
  totalCount = items.length,
) => ({ items, page, hasMore, totalCount });
const hotelProduct = {
  itemName: '제주 바다 호텔',
  productUrl: 'https://experiences.myrealtrip.com/products/hotel-1',
  salePrice: 0,
  starRating: 5,
  reviewScore: '4.7',
  reviewCount: 1783,
  imageUrl: 'https://example.com/hotel.jpg',
};
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
});
afterEach(() => jest.restoreAllMocks());

test('투어·티켓 쿠폰팩에서 해외 전용 할인 조건을 확인하고 코드를 복사한다', async () => {
  const ui = await render(<BookingScreen kind='ticket' onBack={jest.fn()} />);
  expect(ui.getByTestId('ticket-coupon-pack')).toBeTruthy();
  expect(ui.getByText('PACKMKTP1000')).toBeTruthy();
  for (const [code, minimum, discount] of [
    ['PACKMKTP1000', '50,000원', '1,000원'],
    ['PACKMKTP3000', '100,000원', '3,000원'],
    ['PACKMKTP5000', '150,000원', '5,000원'],
  ]) {
    expect(ui.getByText(code)).toBeTruthy();
    expect(ui.getByText(`${minimum} 이상 구매 시`)).toBeTruthy();
    expect(ui.getByText(discount)).toBeTruthy();
  }

  await fireEvent.press(ui.getByTestId('ticket-coupon-copy-PACKMKTP3000'));
  expect(Clipboard.setString).toHaveBeenCalledWith('PACKMKTP3000');
  expect(ui.getByText(S.COUPON_COPIED)).toBeTruthy();
});

test.each(['flight', 'hotel'] as const)(
  '%s 예약에는 투어·티켓 쿠폰팩을 표시하지 않는다',
  async (kind) => {
    const ui = await render(<BookingScreen kind={kind} onBack={jest.fn()} />);
    expect(ui.queryByTestId('ticket-coupon-pack')).toBeNull();
  },
);

test('장소 검색 → 상품 선택 → 생성한 제휴 링크만 연다', async () => {
  const search = jest
    .spyOn(myRealTrip, 'searchTicketPage')
    .mockResolvedValue(ticketPage([product]));
  const link = jest
    .spyOn(myRealTrip, 'createLink')
    .mockResolvedValue('https://myrealt.rip/ticket');
  const ui = await render(
    <BookingScreen
      kind='ticket'
      context={{ keyword: '성산일출봉' }}
      onBack={jest.fn()}
    />,
  );
  expect(search).not.toHaveBeenCalled();
  await fireEvent.press(ui.getByTestId('booking-search'));
  expect(await ui.findByTestId('ticket-search-summary')).toBeTruthy();
  expect(ui.queryByLabelText(S.KEYWORD)).toBeNull();
  const card = ui.getByTestId('ticket-result-0');
  expect(within(card).getByText(product.description)).toBeTruthy();
  expect(within(card).getByLabelText('★ 4.9')).toBeTruthy();
  expect(within(card).getByText('리뷰 125')).toBeTruthy();
  for (const tag of product.tags) {
    expect(within(card).queryByText(tag)).toBeNull();
  }
  expect(within(card).getByText('시작가 ₩15,000')).toBeTruthy();
  await fireEvent.press(ui.getByTestId('ticket-toggle-form'));
  expect(ui.getByLabelText(S.KEYWORD)).toBeTruthy();
  await fireEvent.press(await ui.findByText(product.itemName));
  await waitFor(() =>
    expect(Linking.openURL).toHaveBeenCalledWith('https://myrealt.rip/ticket'),
  );
  expect(search).toHaveBeenCalledWith('성산일출봉', 1, expect.anything());
  expect(link).toHaveBeenCalledWith(product.productUrl, expect.anything());
});

test('장소에서 진입한 투어·티켓은 장소명으로 즉시 검색 결과를 보여준다', async () => {
  const search = jest
    .spyOn(myRealTrip, 'searchTicketPage')
    .mockResolvedValue(ticketPage([product]));
  const ui = await render(
    <BookingScreen
      kind='ticket'
      context={{ keyword: '도쿄 국립 박물관', autoSearch: true }}
      onBack={jest.fn()}
    />,
  );
  expect(await ui.findByTestId('ticket-search-summary')).toBeTruthy();
  expect(ui.getByTestId('ticket-result-0')).toBeTruthy();
  expect(ui.queryByLabelText(S.KEYWORD)).toBeNull();
  expect(search).toHaveBeenCalledTimes(1);
  expect(search).toHaveBeenCalledWith('도쿄 국립 박물관', 1, expect.anything());
});

test('투어 결과 끝에서 다음 페이지를 중복 없이 이어 붙인다', async () => {
  const next = {
    ...product,
    itemName: '제주 바다 투어',
    productUrl: 'https://experiences.myrealtrip.com/products/456',
  };
  const search = jest
    .spyOn(myRealTrip, 'searchTicketPage')
    .mockImplementation(async (_keyword, page) =>
      page === 2
        ? ticketPage([product, next], 2, false, 21)
        : ticketPage([product], 1, true, 21),
    );
  const ui = await render(
    <BookingScreen
      kind='ticket'
      context={{ keyword: '제주' }}
      onBack={jest.fn()}
    />,
  );
  await fireEvent.press(ui.getByTestId('booking-search'));
  await ui.findByText(product.itemName);
  const list = ui.getByTestId('booking-results-list');
  await fireEvent.scroll(list, { nativeEvent: { contentOffset: { y: 100 } } });
  await act(async () => {
    fireEvent(list, 'onEndReached');
    await Promise.resolve();
  });
  await waitFor(() =>
    expect(ui.getByTestId('booking-results-list').props.data).toHaveLength(2),
  );
  expect(ui.getByText(next.itemName)).toBeTruthy();
  expect(search).toHaveBeenLastCalledWith('제주', 2, expect.anything());
  await act(async () => {
    fireEvent(ui.getByTestId('booking-results-list'), 'onEndReached');
  });
  expect(search).toHaveBeenCalledTimes(2);
});

test('숙소는 장소의 첫 지역을 자동 선택하고 숫자 입력을 숙소 검색에 전달한다', async () => {
  const regions = jest
    .spyOn(myRealTrip, 'searchRegions')
    .mockResolvedValue([{ regionId: 123, name: '제주시' }]);
  const search = jest.spyOn(myRealTrip, 'searchHotels').mockResolvedValue({
    items: [hotelProduct, product],
    page: 0,
    totalCount: 2,
    hasMore: false,
  });
  const link = jest
    .spyOn(myRealTrip, 'createLink')
    .mockResolvedValue('https://myrealt.rip/hotel');
  const ui = await render(
    <BookingScreen
      kind='hotel'
      context={{
        keyword: '제주',
        country: '대한민국',
        startDate: '2099-12-30',
        endDate: '2100-01-02',
      }}
      onBack={jest.fn()}
    />,
  );
  await waitFor(() =>
    expect(ui.getByLabelText(S.HOTEL_LOCATION).props.value).toBe('제주시'),
  );
  expect(regions).toHaveBeenCalledWith('제주', true, expect.anything());
  expect(ui.queryByText(S.SEARCH_LOCATION)).toBeNull();
  expect(
    ui.getByTestId('booking-hotel-date-row').props.style.flexDirection,
  ).toBe('row');
  expect(ui.queryByText(/YYYY-MM-DD/)).toBeNull();
  await fireEvent.changeText(ui.getByLabelText(S.HOTEL_CHECK_IN), '20991230');
  await fireEvent.changeText(ui.getByLabelText(S.HOTEL_CHECK_OUT), '21000102');
  expect(ui.getByLabelText(S.HOTEL_CHECK_IN).props.value).toBe('2099-12-30');
  expect(ui.getByLabelText(S.HOTEL_CHECK_OUT).props.value).toBe('2100-01-02');
  await fireEvent.changeText(ui.getByLabelText(S.ADULTS), '2명');
  expect(ui.getByLabelText(S.ADULTS).props.value).toBe('2');
  expect(ui.getByLabelText(S.ADULTS).props.keyboardType).toBe('number-pad');
  await fireEvent.press(ui.getByTestId('booking-search'));
  const hotelResults = await ui.findByTestId('hotel-results-section');
  expect(within(hotelResults).getByText(S.HOTEL_RESULTS)).toBeTruthy();
  expect(ui.getByText(hotelProduct.itemName)).toBeTruthy();
  expect(ui.getByText(S.HOTEL_PRICE_CHECK)).toBeTruthy();
  expect(ui.getByText('5성급')).toBeTruthy();
  expect(ui.getByLabelText('★ 4.7')).toBeTruthy();
  expect(ui.getByText('리뷰 1,783')).toBeTruthy();
  expect(ui.getByTestId('hotel-search-summary')).toBeTruthy();
  expect(ui.queryByLabelText(S.HOTEL_LOCATION)).toBeNull();
  await fireEvent.press(ui.getByTestId('hotel-toggle-form'));
  expect(ui.getByLabelText(S.HOTEL_LOCATION)).toBeTruthy();
  expect(
    within(ui.getByTestId('booking-form')).queryByText(hotelProduct.itemName),
  ).toBeNull();
  expect(
    ui.getByTestId('hotel-result-0').props.accessibilityState.selected,
  ).toBe(true);
  expect(search).toHaveBeenCalledWith(
    {
      regionId: 123,
      checkIn: '2099-12-30',
      checkOut: '2100-01-02',
      adultCount: 2,
    },
    expect.anything(),
  );
  expect(Linking.openURL).not.toHaveBeenCalled();
  await fireEvent.press(ui.getByTestId('hotel-result-0'));
  await waitFor(() =>
    expect(Linking.openURL).toHaveBeenCalledWith('https://myrealt.rip/hotel'),
  );
  expect(link).toHaveBeenCalledWith(hotelProduct.productUrl, expect.anything());
});

const courseHotelContext = {
  keyword: '제주',
  country: '대한민국',
  startDate: '2099-12-30',
  endDate: '2100-01-02',
  autoSearch: true,
};
const hotelPage = {
  items: [hotelProduct],
  page: 0,
  totalCount: 1,
  hasMore: false,
};

test('코스의 숙소 예약은 지역 조회를 기다린 뒤 한 번 자동 검색하고 결과를 바로 보여준다', async () => {
  let resolveRegion!: (regions: { regionId: number; name: string }[]) => void;
  const regions = jest.spyOn(myRealTrip, 'searchRegions').mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveRegion = resolve;
      }),
  );
  const search = jest
    .spyOn(myRealTrip, 'searchHotels')
    .mockResolvedValue(hotelPage);
  const ui = await render(
    <BookingScreen
      kind='hotel'
      context={courseHotelContext}
      onBack={jest.fn()}
    />,
  );
  expect(search).not.toHaveBeenCalled();
  await act(async () => resolveRegion([{ regionId: 123, name: '제주시' }]));
  await ui.findByTestId('hotel-search-summary');
  expect(ui.getByText(hotelProduct.itemName)).toBeTruthy();
  expect(ui.queryByLabelText(S.HOTEL_LOCATION)).toBeNull();
  expect(search).toHaveBeenCalledWith(
    {
      regionId: 123,
      checkIn: '2099-12-30',
      checkOut: '2100-01-02',
      adultCount: 1,
    },
    expect.anything(),
  );
  await ui.rerender(
    <BookingScreen
      kind='hotel'
      context={{ ...courseHotelContext }}
      onBack={jest.fn()}
    />,
  );
  expect(regions).toHaveBeenCalledTimes(1);
  expect(search).toHaveBeenCalledTimes(1);
});

test.each(['hotel', 'ticket'] as const)(
  '%s 검색은 실패 시 입력을 복원하고 성공 후 요약과 수정 폼을 오간다',
  async (kind) => {
    jest
      .spyOn(myRealTrip, 'searchRegions')
      .mockResolvedValue([{ regionId: 123, name: '제주시' }]);
    const hotels = jest
      .spyOn(myRealTrip, 'searchHotels')
      .mockResolvedValue(hotelPage);
    const tickets = jest
      .spyOn(myRealTrip, 'searchTicketPage')
      .mockResolvedValue(ticketPage([product]));
    const search = kind === 'hotel' ? hotels : tickets;
    let rejectFirst!: (error: Error) => void;
    search.mockImplementationOnce(
      () =>
        new Promise<never>((_resolve, reject) => {
          rejectFirst = reject;
        }),
    );
    const ui = await render(
      <BookingScreen
        kind={kind}
        context={{ ...courseHotelContext, autoSearch: false }}
        onBack={jest.fn()}
      />,
    );
    if (kind === 'hotel') {
      await waitFor(() =>
        expect(ui.getByLabelText(S.HOTEL_LOCATION).props.value).toBe('제주시'),
      );
      await fireEvent.changeText(ui.getByLabelText(S.ADULTS), '2');
    } else {
      await fireEvent.changeText(ui.getByLabelText(S.KEYWORD), '제주 야경');
    }
    const expectInputs = () => {
      expect(ui.queryByTestId(`${kind}-search-summary`)).toBeNull();
      if (kind === 'hotel') {
        expect(ui.getByLabelText(S.HOTEL_LOCATION).props.value).toBe('제주시');
        expect(ui.getByLabelText(S.HOTEL_CHECK_IN).props.value).toBe(
          courseHotelContext.startDate,
        );
        expect(ui.getByLabelText(S.HOTEL_CHECK_OUT).props.value).toBe(
          courseHotelContext.endDate,
        );
        expect(ui.getByLabelText(S.ADULTS).props.value).toBe('2');
      } else {
        expect(ui.getByLabelText(S.KEYWORD).props.value).toBe('제주 야경');
      }
    };

    await fireEvent.press(ui.getByTestId('booking-search'));
    if (kind === 'ticket') {
      expect(ui.getByTestId('ticket-search-summary')).toBeTruthy();
      expect(ui.queryByLabelText(S.KEYWORD)).toBeNull();
      expect(ui.queryByTestId('ticket-coupon-pack')).toBeNull();
      expect(ui.getByText(S.LOADING)).toBeTruthy();
    } else {
      expectInputs();
    }
    expect(search).toHaveBeenCalledTimes(1);
    await act(async () => rejectFirst(new Error('offline')));
    expect(await ui.findByText(S.ERROR)).toBeTruthy();
    expectInputs();
    await fireEvent.press(ui.getByTestId('booking-search'));
    expect(await ui.findByTestId(`${kind}-search-summary`)).toBeTruthy();
    const itemName =
      kind === 'hotel' ? hotelProduct.itemName : product.itemName;
    expect(ui.getByText(itemName)).toBeTruthy();
    expect(
      ui.queryByLabelText(kind === 'hotel' ? S.HOTEL_LOCATION : S.KEYWORD),
    ).toBeNull();
    await fireEvent.press(ui.getByTestId(`${kind}-toggle-form`));
    expectInputs();
    expect(ui.getByText(itemName)).toBeTruthy();
    await fireEvent.press(ui.getByTestId(`${kind}-toggle-form`));
    expect(ui.getByTestId(`${kind}-search-summary`)).toBeTruthy();
    expect(ui.getByText(itemName)).toBeTruthy();
    expect(search).toHaveBeenCalledTimes(2);
  },
);

test.each(['hotel', 'ticket'] as const)(
  '%s 가격 안내는 결과 헤더를 밀지 않는 모달로 열고 닫는다',
  async (kind) => {
    jest
      .spyOn(myRealTrip, 'searchRegions')
      .mockResolvedValue([{ regionId: 123, name: '제주시' }]);
    jest.spyOn(myRealTrip, 'searchHotels').mockResolvedValue(hotelPage);
    jest
      .spyOn(myRealTrip, 'searchTicketPage')
      .mockResolvedValue(ticketPage([product]));
    const ui = await render(
      <BookingScreen
        kind={kind}
        context={{ ...courseHotelContext, autoSearch: false }}
        onBack={jest.fn()}
      />,
    );
    if (kind === 'hotel')
      await waitFor(() =>
        expect(ui.getByLabelText(S.HOTEL_LOCATION).props.value).toBe('제주시'),
      );
    await fireEvent.press(ui.getByTestId('booking-search'));
    await ui.findByTestId(`${kind}-results-section`);
    const results = ui.getByTestId('booking-results-list').props.data;
    for (const closeWith of ['button', 'backdrop', 'request'] as const) {
      await fireEvent.press(ui.getByLabelText(S.PRICE_NOTE));
      const modal = ui.getByTestId('booking-price-info-modal');
      expect(within(modal).getByText('가격 안내')).toBeTruthy();
      expect(within(modal).getByText(S.PRICE_NOTE)).toBeTruthy();
      expect(
        within(ui.getByTestId(`${kind}-results-section`)).queryByText(
          S.PRICE_NOTE,
        ),
      ).toBeNull();
      expect(ui.getByTestId('booking-results-list').props.data).toEqual(
        results,
      );
      if (closeWith === 'button')
        await fireEvent.press(
          within(modal).getByRole('button', { name: '닫기' }),
        );
      else if (closeWith === 'backdrop')
        await fireEvent.press(
          ui.getByTestId('booking-price-info-backdrop', {
            includeHiddenElements: true,
          }),
        );
      else await fireEvent(modal, 'requestClose');
      expect(ui.queryByText('가격 안내')).toBeNull();
    }
  },
);

test('홈 숙소 예약은 유효한 기본 조건이 있어도 자동 검색하지 않고 입력창을 유지한다', async () => {
  jest
    .spyOn(myRealTrip, 'searchRegions')
    .mockResolvedValue([{ regionId: 123, name: '제주시' }]);
  const search = jest
    .spyOn(myRealTrip, 'searchHotels')
    .mockResolvedValue(hotelPage);
  const { autoSearch: _, ...context } = courseHotelContext;
  const ui = await render(
    <BookingScreen kind='hotel' context={context} onBack={jest.fn()} />,
  );
  await waitFor(() =>
    expect(ui.getByLabelText(S.HOTEL_LOCATION).props.value).toBe('제주시'),
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  expect(search).not.toHaveBeenCalled();
  expect(ui.getByTestId('booking-search')).toBeTruthy();
  expect(ui.queryByTestId('hotel-search-summary')).toBeNull();
});

test.each([
  ['지난 일정', '2000-01-01', '2000-01-03', S.INVALID_DATE],
  ['누락된 일정', '', '', S.INVALID_DATE],
  ['같은 날', '2099-12-30', '2099-12-30', S.HOTEL_DATE_ORDER],
  ['역순 일정', '2099-12-30', '2099-12-29', S.HOTEL_DATE_ORDER],
])(
  '코스 숙소 예약의 %s은 자동 조회하지 않고 입력 보완을 안내한다',
  async (_label, startDate, endDate, expected) => {
    jest
      .spyOn(myRealTrip, 'searchRegions')
      .mockResolvedValue([{ regionId: 123, name: '제주시' }]);
    const search = jest
      .spyOn(myRealTrip, 'searchHotels')
      .mockResolvedValue(hotelPage);
    const ui = await render(
      <BookingScreen
        kind='hotel'
        context={{ ...courseHotelContext, startDate, endDate }}
        onBack={jest.fn()}
      />,
    );
    await ui.findByText(expected);
    expect(search).not.toHaveBeenCalled();
    expect(ui.getByLabelText(S.HOTEL_CHECK_IN).props.value).toBe(startDate);
    expect(ui.getByLabelText(S.HOTEL_CHECK_OUT).props.value).toBe(endDate);
    expect(ui.queryByTestId('hotel-search-summary')).toBeNull();
  },
);

test.each(['empty', 'error'] as const)(
  '코스 숙소 지역 조회가 %s이면 수동 지역 선택과 검색으로 복구한다',
  async (result) => {
    const regions = jest.spyOn(myRealTrip, 'searchRegions');
    if (result === 'empty') regions.mockResolvedValueOnce([]);
    else regions.mockRejectedValueOnce(new Error('offline'));
    regions.mockResolvedValue([{ regionId: 456, name: '서울시' }]);
    const search = jest
      .spyOn(myRealTrip, 'searchHotels')
      .mockResolvedValue(hotelPage);
    const ui = await render(
      <BookingScreen
        kind='hotel'
        context={courseHotelContext}
        onBack={jest.fn()}
      />,
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(search).not.toHaveBeenCalled();
    expect(ui.getByLabelText(S.HOTEL_LOCATION)).toBeTruthy();
    await fireEvent.changeText(ui.getByLabelText(S.HOTEL_LOCATION), '서울');
    await fireEvent.press(await ui.findByTestId('hotel-region-choice-456'));
    expect(search).not.toHaveBeenCalled();
    await fireEvent.press(ui.getByTestId('booking-search'));
    await ui.findByTestId('hotel-search-summary');
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ regionId: 456 }),
      expect.anything(),
    );
  },
);

test.each(['date', 'adults', 'stepper', 'location'] as const)(
  '초기 지역 응답 전에 %s 조건을 바꾸면 자동 숙소 검색을 취소한다',
  async (field) => {
    let resolveRegion!: (regions: { regionId: number; name: string }[]) => void;
    jest.spyOn(myRealTrip, 'searchRegions').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRegion = resolve;
        }),
    );
    const search = jest
      .spyOn(myRealTrip, 'searchHotels')
      .mockResolvedValue(hotelPage);
    const ui = await render(
      <BookingScreen
        kind='hotel'
        context={courseHotelContext}
        onBack={jest.fn()}
      />,
    );
    if (field === 'date')
      await fireEvent.changeText(
        ui.getByLabelText(S.HOTEL_CHECK_IN),
        '20991231',
      );
    else if (field === 'adults')
      await fireEvent.changeText(ui.getByLabelText(S.ADULTS), '2');
    else if (field === 'stepper')
      await fireEvent.press(ui.getByTestId('booking-adults-plus'));
    else
      await fireEvent.changeText(ui.getByLabelText(S.HOTEL_LOCATION), '서울');
    await act(async () => {
      resolveRegion([{ regionId: 123, name: '제주시' }]);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(search).not.toHaveBeenCalled();
    expect(ui.queryByTestId('hotel-search-summary')).toBeNull();
    if (field === 'location')
      expect(ui.getByLabelText(S.HOTEL_LOCATION).props.value).toBe('서울');
    if (field === 'date')
      expect(ui.getByLabelText(S.HOTEL_CHECK_IN).props.value).toBe(
        '2099-12-31',
      );
  },
);

test('자동 숙소 검색 전 화면을 떠나면 지역 요청을 취소하고 늦은 응답으로 검색하지 않는다', async () => {
  let resolveRegion!: (regions: { regionId: number; name: string }[]) => void;
  let regionSignal!: AbortSignal;
  jest
    .spyOn(myRealTrip, 'searchRegions')
    .mockImplementation((_keyword, _domestic, signal) => {
      regionSignal = signal!;
      return new Promise((resolve) => {
        resolveRegion = resolve;
      });
    });
  const search = jest
    .spyOn(myRealTrip, 'searchHotels')
    .mockResolvedValue(hotelPage);
  const ui = await render(
    <BookingScreen
      kind='hotel'
      context={courseHotelContext}
      onBack={jest.fn()}
    />,
  );
  await ui.unmount();
  expect(regionSignal.aborted).toBe(true);
  await act(async () => {
    resolveRegion([{ regionId: 123, name: '제주시' }]);
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  expect(search).not.toHaveBeenCalled();
});

test('자동 숙소 검색 중 화면을 떠나면 상품 요청을 취소한다', async () => {
  jest
    .spyOn(myRealTrip, 'searchRegions')
    .mockResolvedValue([{ regionId: 123, name: '제주시' }]);
  let productSignal!: AbortSignal;
  let resolveProducts!: (page: typeof hotelPage) => void;
  const search = jest
    .spyOn(myRealTrip, 'searchHotels')
    .mockImplementation((_query, signal) => {
      productSignal = signal!;
      return new Promise((resolve) => {
        resolveProducts = resolve;
      });
    });
  const ui = await render(
    <BookingScreen
      kind='hotel'
      context={courseHotelContext}
      onBack={jest.fn()}
    />,
  );
  await waitFor(() => expect(search).toHaveBeenCalledTimes(1));
  await ui.unmount();
  expect(productSignal.aborted).toBe(true);
  await act(async () => resolveProducts(hotelPage));
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test.each([
  [S.HOTEL_CHECK_IN, 'date-sheet'],
  [S.HOTEL_CHECK_OUT, 'date-sheet'],
  [S.HOTEL_LOCATION, 'destination-sheet'],
])(
  '자동 숙소 검색 중 %s 입력란을 눌러도 조건 선택창을 열지 않는다',
  async (label, sheetId) => {
    jest.spyOn(commonApi, 'fetchCountriesApi').mockResolvedValue({
      status: 200,
      message: '국가 목록 조회 성공',
      data: { countries: [] },
    });
    jest.spyOn(commonApi, 'fetchCitiesApi').mockResolvedValue({
      status: 200,
      message: '도시 목록 조회 성공',
      data: { cities: [] },
    });
    jest
      .spyOn(myRealTrip, 'searchRegions')
      .mockResolvedValue([{ regionId: 123, name: '제주시' }]);
    let resolveProducts!: (page: typeof hotelPage) => void;
    const search = jest.spyOn(myRealTrip, 'searchHotels').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveProducts = resolve;
        }),
    );
    const ui = await render(
      <BookingScreen
        kind='hotel'
        context={courseHotelContext}
        onBack={jest.fn()}
      />,
    );
    await waitFor(() => expect(search).toHaveBeenCalledTimes(1));
    const input = ui.getByLabelText(label);
    expect(input.props.editable).toBe(false);
    // Native pressIn may still arrive for a read-only input; RNTL suppresses it.
    await act(async () => input.props.onPressIn());
    expect(ui.queryByTestId(sheetId)).toBeNull();
    await act(async () => resolveProducts(hotelPage));
    expect(await ui.findByText(hotelProduct.itemName)).toBeTruthy();
    const summary = ui.getByTestId('hotel-search-summary');
    expect(within(summary).getByText('제주시')).toBeTruthy();
    expect(search).toHaveBeenCalledTimes(1);
  },
);

test('숙소 지역 제안은 네 개씩 보이며 내부 스크롤로 다른 지역을 선택한다', async () => {
  jest.spyOn(myRealTrip, 'searchRegions').mockImplementation(async (query) =>
    query === '제주'
      ? [{ regionId: 123, name: '제주시' }]
      : Array.from({ length: 6 }, (_, index) => ({
          regionId: index + 1,
          name: `서울 지역 ${index + 1}`,
        })),
  );
  const search = jest
    .spyOn(myRealTrip, 'searchHotels')
    .mockResolvedValue({ items: [], page: 0, totalCount: 0, hasMore: false });
  const ui = await render(
    <BookingScreen
      kind='hotel'
      context={{
        keyword: '제주',
        startDate: '2099-12-30',
        endDate: '2100-01-02',
      }}
      onBack={jest.fn()}
    />,
  );
  await waitFor(() =>
    expect(ui.getByLabelText(S.HOTEL_LOCATION).props.value).toBe('제주시'),
  );
  await fireEvent.changeText(ui.getByLabelText(S.HOTEL_LOCATION), '서울');
  const suggestions = await ui.findByTestId('hotel-region-suggestion-list');
  expect(suggestions.props.data).toHaveLength(6);
  expect(suggestions.props.scrollEnabled).toBe(true);
  expect(
    StyleSheet.flatten(
      ui.getByTestId('hotel-region-suggestion-viewport').props.style,
    ),
  ).toMatchObject({ height: 178, overflow: 'hidden' });
  await fireEvent.press(ui.getByTestId('hotel-region-choice-2'));
  expect(ui.getByLabelText(S.HOTEL_LOCATION).props.value).toBe('서울 지역 2');
  await fireEvent.press(ui.getByTestId('booking-search'));
  await ui.findByText(S.EMPTY);
  expect(search).toHaveBeenCalledWith(
    expect.objectContaining({ regionId: 2 }),
    expect.anything(),
  );
});

test('숙소 결과 끝에서 다음 페이지를 이어 붙이고 맨 위로 돌아간다', async () => {
  jest
    .spyOn(myRealTrip, 'searchRegions')
    .mockResolvedValue([{ regionId: 123, name: '제주시' }]);
  const nextHotel = {
    ...hotelProduct,
    itemName: '제주 산 호텔',
    productUrl: 'https://accommodation.myrealtrip.com/union/products/2',
  };
  const search = jest
    .spyOn(myRealTrip, 'searchHotels')
    .mockImplementation(async (query) =>
      query.page === 1
        ? {
            items: [hotelProduct, nextHotel],
            page: 1,
            totalCount: 21,
            hasMore: false,
          }
        : { items: [hotelProduct], page: 0, totalCount: 21, hasMore: true },
    );
  const ui = await render(
    <BookingScreen
      kind='hotel'
      context={{
        keyword: '제주',
        startDate: '2099-12-30',
        endDate: '2100-01-02',
      }}
      onBack={jest.fn()}
    />,
  );
  await waitFor(() =>
    expect(ui.getByLabelText(S.HOTEL_LOCATION).props.value).toBe('제주시'),
  );
  await fireEvent.press(ui.getByTestId('booking-search'));
  await ui.findByText(hotelProduct.itemName);
  const list = ui.getByTestId('booking-results-list');
  expect(list.props.data).toHaveLength(1);
  await fireEvent.scroll(list, { nativeEvent: { contentOffset: { y: 100 } } });
  await act(async () => {
    fireEvent(list, 'onEndReached');
    await Promise.resolve();
  });
  await waitFor(() =>
    expect(ui.getByTestId('booking-results-list').props.data).toHaveLength(2),
  );
  expect(ui.getByText(nextHotel.itemName)).toBeTruthy();
  expect(search).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 1 }),
    expect.anything(),
  );
  await act(async () => {
    fireEvent(ui.getByTestId('booking-results-list'), 'onEndReached');
  });
  expect(search).toHaveBeenCalledTimes(2);
  await fireEvent.scroll(ui.getByTestId('booking-results-list'), {
    nativeEvent: { contentOffset: { y: 300 } },
  });
  await waitFor(() =>
    expect(ui.getByTestId('booking-scroll-top')).toBeTruthy(),
  );
  await fireEvent.press(ui.getByTestId('booking-scroll-top'));
});

test('왕복 항공은 사용자가 고른 두 공항과 날짜로 링크를 생성한다', async () => {
  const airports = jest
    .spyOn(myRealTrip, 'searchAirports')
    .mockImplementation(async (query) =>
      query === '인천'
        ? [{ airport: { code: 'ICN', koName: '인천' } }]
        : [{ airport: { code: 'CJU', koName: '제주' } }],
    );
  const link = jest
    .spyOn(myRealTrip, 'createFlightLink')
    .mockResolvedValue('https://myrealt.rip/flight');
  const ui = await render(
    <BookingScreen
      kind='flight'
      context={{
        keyword: '제주',
        startDate: '2099-12-30',
        endDate: '2100-01-02',
      }}
      onBack={jest.fn()}
    />,
  );
  await waitFor(() => {
    expect(ui.getByLabelText(S.DEPARTURE).props.value).toBe('인천 (ICN)');
    expect(ui.getByLabelText(S.ARRIVAL).props.value).toBe('제주 (CJU)');
  });
  expect(airports).toHaveBeenCalledWith('인천', expect.anything());
  expect(airports).toHaveBeenCalledWith('제주', expect.anything());
  expect(ui.getByTestId('booking-airport-row').props.style.flexDirection).toBe(
    'row',
  );
  expect(ui.getByTestId('booking-date-row').props.style.flexDirection).toBe(
    'row',
  );
  expect(ui.queryByText(/YYYY-MM-DD/)).toBeNull();
  await fireEvent.changeText(
    ui.getByLabelText(S.FLIGHT_START_DATE),
    '20261013',
  );
  expect(ui.getByLabelText(S.FLIGHT_START_DATE).props.value).toBe('2026-10-13');
  await fireEvent.changeText(
    ui.getByLabelText(S.FLIGHT_START_DATE),
    '20991230',
  );
  await fireEvent.changeText(ui.getByLabelText(S.FLIGHT_END_DATE), '21000102');
  expect(ui.getByLabelText(S.FLIGHT_START_DATE).props.value).toBe('2099-12-30');
  expect(ui.getByLabelText(S.FLIGHT_END_DATE).props.value).toBe('2100-01-02');
  expect(ui.getByLabelText(S.FLIGHT_START_DATE).props.keyboardType).toBe(
    'number-pad',
  );
  await fireEvent.press(ui.getByTestId('booking-search'));
  await waitFor(() =>
    expect(Linking.openURL).toHaveBeenCalledWith('https://myrealt.rip/flight'),
  );
  expect(link).toHaveBeenCalledWith(
    {
      depAirportCd: 'ICN',
      arrAirportCd: 'CJU',
      depDate: '2099-12-30',
      arrDate: '2100-01-02',
      adult: 1,
    },
    expect.anything(),
  );
});

test('샤를드 골을 입력한 뒤 목록을 누르지 않아도 첫 공항 CDG로 조회한다', async () => {
  jest
    .spyOn(myRealTrip, 'searchAirports')
    .mockImplementation(async (query) =>
      query === '인천'
        ? [{ airport: { code: 'ICN', koName: '인천' } }]
        : query === '도쿄'
          ? [{ airport: { code: 'NRT', koName: '나리타' } }]
          : [
              { airport: { code: 'CDG', koName: '샤를드 골' } },
              { airport: { code: 'ORY', koName: '오를리' } },
            ],
    );
  const link = jest
    .spyOn(myRealTrip, 'createFlightLink')
    .mockResolvedValue('https://myrealt.rip/flight');
  const ui = await render(
    <BookingScreen
      kind='flight'
      context={{
        keyword: '도쿄',
        startDate: '2099-12-30',
        endDate: '2100-01-02',
      }}
      onBack={jest.fn()}
    />,
  );
  await waitFor(() =>
    expect(ui.getByLabelText(S.ARRIVAL).props.value).toBe('나리타 (NRT)'),
  );
  await fireEvent.changeText(ui.getByLabelText(S.ARRIVAL), '샤를드 골');
  await fireEvent.press(ui.getByTestId('booking-search'));
  await waitFor(() =>
    expect(link).toHaveBeenCalledWith(
      expect.objectContaining({ depAirportCd: 'ICN', arrAirportCd: 'CDG' }),
      expect.anything(),
    ),
  );
  expect(ui.getByLabelText(S.ARRIVAL).props.value).toBe('샤를드 골 (CDG)');
});

test('공항 입력 중에는 스크롤 가능한 제안 목록에서 공항을 바꿀 수 있다', async () => {
  jest.spyOn(myRealTrip, 'searchAirports').mockImplementation(async (query) => {
    if (query === '인천') return [{ airport: { code: 'ICN', koName: '인천' } }];
    if (query === '제주') return [{ airport: { code: 'CJU', koName: '제주' } }];
    return [
      { airport: { code: 'GMP', koName: '김포' } },
      { airport: { code: 'PUS', koName: '김해' } },
      { airport: { code: 'CJJ', koName: '청주' } },
      { airport: { code: 'TAE', koName: '대구' } },
      { airport: { code: 'KWJ', koName: '광주' } },
      { airport: { code: 'RSU', koName: '여수' } },
    ];
  });
  const ui = await render(
    <BookingScreen
      kind='flight'
      context={{ keyword: '제주' }}
      onBack={jest.fn()}
    />,
  );
  await waitFor(() =>
    expect(ui.getByLabelText(S.DEPARTURE).props.value).toBe('인천 (ICN)'),
  );
  await fireEvent(ui.getByLabelText(S.DEPARTURE), 'focus');
  expect(ui.getByText('출발지가 어디인가요?')).toBeTruthy();
  await fireEvent.changeText(ui.getByTestId('airport-sheet-search'), '김');
  const suggestions = await ui.findByTestId('airport-suggestion-list');
  expect(suggestions.props.scrollEnabled).toBe(true);
  await waitFor(() =>
    expect(ui.getByTestId('airport-suggestion-list').props.data).toHaveLength(
      6,
    ),
  );
  expect(
    StyleSheet.flatten(
      ui.getByTestId('airport-suggestion-viewport').props.style,
    ),
  ).toMatchObject({ flex: 1, overflow: 'hidden' });
  await fireEvent.press(await ui.findByTestId('airport-suggestion-GMP'));
  expect(ui.getByLabelText(S.DEPARTURE).props.value).toBe('김포 (GMP)');
  expect(ui.queryByTestId('airport-suggestion-list')).toBeNull();
});

test('늦게 도착한 기본 공항 검색 결과가 사용자의 입력을 덮어쓰지 않는다', async () => {
  let resolveDeparture!: (
    value: { airport: { code: string; koName: string } }[],
  ) => void;
  jest.spyOn(myRealTrip, 'searchAirports').mockImplementation((query) =>
    query === '인천'
      ? new Promise((resolve) => {
          resolveDeparture = resolve;
        })
      : Promise.resolve([{ airport: { code: 'CJU', koName: '제주' } }]),
  );
  const ui = await render(
    <BookingScreen
      kind='flight'
      context={{ keyword: '제주' }}
      onBack={jest.fn()}
    />,
  );
  await fireEvent.changeText(ui.getByLabelText(S.DEPARTURE), '김포');
  await act(async () =>
    resolveDeparture([{ airport: { code: 'ICN', koName: '인천' } }]),
  );
  expect(ui.getByLabelText(S.DEPARTURE).props.value).toBe('김포');
});

test('알 수 없는 공항/잘못된 날짜는 임의 보정 없이 안내한다', async () => {
  const link = jest.spyOn(myRealTrip, 'createFlightLink');
  const ui = await render(
    <BookingScreen
      kind='flight'
      context={{ startDate: '2000-01-01', endDate: '2000-01-02' }}
      onBack={jest.fn()}
    />,
  );
  await fireEvent.press(ui.getByTestId('booking-search'));
  expect(ui.getByText(S.INVALID_DATE)).toBeTruthy();
  expect(link).not.toHaveBeenCalled();
});

test.each([
  [new MyRealTripError('configuration'), S.UNAVAILABLE],
  [new MyRealTripError('request', 429), S.RATE_LIMIT],
  [new Error('offline'), S.ERROR],
])('API 실패를 안내하고 재시도할 수 있다', async (error, message) => {
  jest
    .spyOn(myRealTrip, 'searchTicketPage')
    .mockRejectedValueOnce(error)
    .mockResolvedValueOnce(ticketPage([]));
  const ui = await render(
    <BookingScreen
      kind='ticket'
      context={{ keyword: '제주' }}
      onBack={jest.fn()}
    />,
  );
  await fireEvent.press(ui.getByTestId('booking-search'));
  await ui.findByText(message as string);
  await fireEvent.press(ui.getByTestId('booking-search'));
  await ui.findByText(S.EMPTY);
});

test('링크 열기 실패 후 상품을 다시 선택할 수 있다', async () => {
  jest
    .spyOn(myRealTrip, 'searchTicketPage')
    .mockResolvedValue(ticketPage([product]));
  jest
    .spyOn(myRealTrip, 'createLink')
    .mockResolvedValue('https://myrealt.rip/test');
  jest
    .spyOn(Linking, 'openURL')
    .mockRejectedValueOnce(new Error('no browser'))
    .mockResolvedValueOnce(true);
  const ui = await render(
    <BookingScreen
      kind='ticket'
      context={{ keyword: '제주' }}
      onBack={jest.fn()}
    />,
  );
  await fireEvent.press(ui.getByTestId('booking-search'));
  await fireEvent.press(await ui.findByText(product.itemName));
  await ui.findByText(S.OPEN_ERROR);
  await fireEvent.press(ui.getByText(product.itemName));
  await waitFor(() => expect(Linking.openURL).toHaveBeenCalledTimes(2));
});

test('중복 클릭은 요청 하나만 실행하고 닫힌 창의 응답은 외부 페이지를 열지 않는다', async () => {
  jest
    .spyOn(myRealTrip, 'searchTicketPage')
    .mockResolvedValue(ticketPage([product]));
  let complete!: (url: string) => void;
  const link = jest.spyOn(myRealTrip, 'createLink').mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const close = jest.fn();
  const ui = await render(
    <BookingScreen
      kind='ticket'
      context={{ keyword: '제주' }}
      onBack={close}
    />,
  );
  await fireEvent.press(ui.getByTestId('booking-search'));
  const item = await ui.findByText(product.itemName);
  await fireEvent.press(item);
  await fireEvent.press(item);
  expect(link).toHaveBeenCalledTimes(1);
  await fireEvent.press(ui.getByLabelText(S.BACK));
  await act(async () => complete('https://myrealt.rip/late'));
  expect(close).toHaveBeenCalledTimes(1);
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test('일정 종료일은 연말을 넘겨 계산하고 과거/없는 날짜를 허용하지 않는다', () => {
  expect(
    courseBookingContext({
      startDate: '2099-12-30',
      totalDays: 4,
      destinationCity: '제주',
      destinationCountry: '대한민국',
    } as any).endDate,
  ).toBe('2100-01-02');
  expect(isBookingDate('2099-02-30')).toBe(false);
  expect(isBookingDate('2000-01-01')).toBe(false);
  expect(isBookingDate('2099-12-30')).toBe(true);
});

test('숙소 검색에서 지난 날짜와 선택하지 않은 지역을 각각 안내한다', async () => {
  const ui = await render(
    <BookingScreen
      kind='hotel'
      context={{ startDate: '2000-01-01', endDate: '2000-01-02' }}
      onBack={jest.fn()}
    />,
  );
  await fireEvent.press(ui.getByTestId('booking-search'));
  expect(ui.getByText('오늘부터 유효한 날짜를 입력해 주세요.')).toBeTruthy();

  await fireEvent.changeText(ui.getByLabelText(S.HOTEL_CHECK_IN), '20991230');
  await fireEvent.changeText(ui.getByLabelText(S.HOTEL_CHECK_OUT), '21000102');
  await fireEvent.press(ui.getByTestId('booking-search'));
  expect(
    ui.getByText('숙소 지역을 검색한 뒤 목록에서 선택해 주세요.'),
  ).toBeTruthy();
});

test('항공권 검색에서 날짜가 맞아도 선택된 공항이 없으면 공항 선택을 안내한다', async () => {
  jest.spyOn(myRealTrip, 'searchAirports').mockResolvedValue([]);
  const ui = await render(
    <BookingScreen
      kind='flight'
      context={{ startDate: '2099-12-30', endDate: '2100-01-02' }}
      onBack={jest.fn()}
    />,
  );
  await fireEvent.press(ui.getByTestId('booking-search'));
  expect(
    ui.getByText('출발 공항과 도착 공항을 목록에서 선택해 주세요.'),
  ).toBeTruthy();
});

test('지원하지 않는 항공 노선은 안내 후 홈 제휴 링크로 직접 검색할 수 있다', async () => {
  jest
    .spyOn(myRealTrip, 'searchAirports')
    .mockImplementation(async (query) =>
      query === '인천'
        ? [{ airport: { code: 'ICN', koName: '인천' } }]
        : [{ airport: { code: 'CJU', koName: '제주' } }],
    );
  jest
    .spyOn(myRealTrip, 'createFlightLink')
    .mockRejectedValue(new MyRealTripError('request', 400));
  const link = jest
    .spyOn(myRealTrip, 'createLink')
    .mockResolvedValue('https://myrealt.rip/home');
  const ui = await render(
    <BookingScreen
      kind='flight'
      context={{
        keyword: '제주',
        startDate: '2099-12-30',
        endDate: '2100-01-02',
      }}
      onBack={jest.fn()}
    />,
  );
  await waitFor(() =>
    expect(ui.getByLabelText(S.ARRIVAL).props.value).toBe('제주 (CJU)'),
  );
  await fireEvent.press(ui.getByTestId('booking-search'));
  await ui.findByText(S.FLIGHT_UNAVAILABLE);
  expect(Linking.openURL).not.toHaveBeenCalled();
  await fireEvent.press(ui.getByText(S.FLIGHT_FALLBACK));
  await waitFor(() =>
    expect(Linking.openURL).toHaveBeenCalledWith('https://myrealt.rip/home'),
  );
  expect(link).toHaveBeenCalledWith(
    'https://www.myrealtrip.com/',
    expect.anything(),
  );
});

test('투어 예약 정보는 국가와 도시를 함께 표시하고 지역 변경과 직접 검색을 구분한다', async () => {
  jest.spyOn(commonApi, 'fetchCountriesApi').mockResolvedValue({
    status: 200,
    message: 'ok',
    data: { countries: [{ countryName: '일본' }, { countryName: '프랑스' }] },
  });
  jest.spyOn(commonApi, 'fetchCitiesApi').mockResolvedValue({
    status: 200,
    message: 'ok',
    data: { cities: [{ cityName: '파리' }] },
  });

  const search = jest
    .spyOn(myRealTrip, 'searchTicketPage')
    .mockResolvedValue(ticketPage([product]));
  const ui = await render(
    <BookingScreen
      kind='ticket'
      context={{ country: '일본', keyword: '도쿄', autoSearch: true }}
      onBack={jest.fn()}
    />,
  );
  let summary = within(await ui.findByTestId('ticket-search-summary'));
  expect(summary.getByText('일본')).toBeTruthy();
  expect(summary.getByText('도쿄')).toBeTruthy();
  expect(search).toHaveBeenCalledWith('도쿄', 1, expect.anything());
  expect(search).toHaveBeenCalledTimes(1);
  await fireEvent.press(ui.getByTestId('ticket-toggle-form'));
  await fireEvent.press(ui.getByTestId('booking-destination-picker'));
  await layoutDestinationCountries();
  await fireEvent.press(await revealDestinationCountry('프랑스'));
  await fireEvent.press(await ui.findByTestId('destination-city-파리'));
  await fireEvent.press(ui.getByTestId('booking-search'));
  summary = within(await ui.findByTestId('ticket-search-summary'));
  expect(summary.getByText('프랑스')).toBeTruthy();
  expect(summary.getByText('파리')).toBeTruthy();
  expect(summary.queryByText('일본')).toBeNull();
  expect(search).toHaveBeenLastCalledWith('파리', 1, expect.anything());
  await fireEvent.press(ui.getByTestId('ticket-toggle-form'));
  await fireEvent.press(ui.getByTestId('booking-destination-picker'));
  await layoutDestinationCountries();
  expect(await revealDestinationCountry('프랑스')).toHaveProp(
    'accessibilityState',
    { selected: true },
  );
  await fireEvent.press(ui.getByTestId('destination-sheet-backdrop'));
  await fireEvent.changeText(ui.getByLabelText(S.KEYWORD), '제주');
  await fireEvent.press(ui.getByTestId('booking-search'));
  summary = within(await ui.findByTestId('ticket-search-summary'));
  expect(summary.getByText('제주')).toBeTruthy();
  expect(summary.queryByText('프랑스')).toBeNull();
  expect(search).toHaveBeenLastCalledWith('제주', 1, expect.anything());
});

test('사진 없는 투어 카드도 태그를 숨기고 가격과 상품명은 유지한다', async () => {
  jest
    .spyOn(myRealTrip, 'searchTicketPage')
    .mockResolvedValue(ticketPage([{ ...product, imageUrl: '' }]));
  const ui = await render(
    <BookingScreen
      kind='ticket'
      context={{ keyword: '제주', autoSearch: true }}
      onBack={jest.fn()}
    />,
  );
  const card = within(await ui.findByTestId('ticket-result-0'));
  expect(card.getByText(product.itemName)).toBeTruthy();
  expect(card.getByText('시작가 ₩15,000')).toBeTruthy();
  for (const tag of product.tags) expect(card.queryByText(tag)).toBeNull();
});

test('투어 첫 검색은 요청 중 먼저 접히고 검색 후 펼치면 쿠폰팩을 다시 사용할 수 있다', async () => {
  let resolveSearch!: (value: ReturnType<typeof ticketPage>) => void;
  const search = jest.spyOn(myRealTrip, 'searchTicketPage').mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
  );
  const ui = await render(
    <BookingScreen
      kind='ticket'
      context={{ keyword: '교토' }}
      onBack={jest.fn()}
    />,
  );
  expect(ui.getByTestId('ticket-coupon-pack')).toBeTruthy();
  await fireEvent.press(ui.getByTestId('booking-search'));
  expect(ui.getByTestId('ticket-search-summary')).toBeTruthy();
  expect(ui.queryByTestId('ticket-coupon-pack')).toBeNull();
  expect(ui.getByText(S.LOADING)).toBeTruthy();
  expect(ui.getByTestId('ticket-toggle-form')).toBeDisabled();
  await act(async () => resolveSearch(ticketPage([product])));
  expect(await ui.findByTestId('ticket-result-0')).toBeTruthy();
  expect(ui.queryByTestId('ticket-coupon-pack')).toBeNull();
  await fireEvent.press(ui.getByTestId('ticket-toggle-form'));
  expect(ui.getByTestId('ticket-coupon-pack')).toBeTruthy();
  await fireEvent.press(ui.getByTestId('ticket-coupon-copy-PACKMKTP3000'));
  expect(Clipboard.setString).toHaveBeenCalledWith('PACKMKTP3000');
  expect(ui.getByTestId('ticket-result-0')).toBeTruthy();
  await fireEvent.press(ui.getByTestId('ticket-toggle-form'));
  expect(ui.queryByTestId('ticket-coupon-pack')).toBeNull();
  expect(search).toHaveBeenCalledTimes(1);
});
