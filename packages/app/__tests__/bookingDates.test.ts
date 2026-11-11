/**
 * @file bookingDates.test.ts
 * @description Verifies Seoul booking-day boundaries and booking-specific calendar minimum dates across month changes.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { bookingToday, isBookingDate } from '../src/services/bookingService';
import { InlineCalendarView } from '../src/components/common/InlineCalendarView';
import { TravelDateSheet } from '../src/components/course/TravelDateSheet';
import { renderWithQueryClient } from './test-utils';

jest.mock('../src/hooks/useSheetEntrance', () => ({
  useSheetEntrance: () => ({}),
}));

afterEach(() => jest.useRealTimers());

test('서울 자정 이후에는 기기 현지 날짜가 전날이어도 예약일을 거절한다', () => {
  jest.useFakeTimers({ now: new Date('2026-11-07T15:00:00Z') });
  expect(isBookingDate('2026-11-07')).toBe(false);
  expect(isBookingDate('2026-11-08')).toBe(true);
});

test.each([
  ['2026-11-07T14:59:59Z', '2026-11-07'],
  ['2026-11-07T15:00:00Z', '2026-11-08'],
  ['2026-12-31T15:00:00Z', '2027-01-01'],
])('예약 기준일은 %s에서 서울 날짜 %s이다', (instant, expected) => {
  jest.useFakeTimers({ now: new Date(instant) });
  expect(bookingToday()).toBe(expected);
});

test('서비스 기준일이 현지 날짜보다 늦으면 이전 날짜와 월 이동을 차단한다', async () => {
  jest.useFakeTimers({ now: new Date('2026-11-30T15:00:00Z') });
  const onPrevMonth = jest.fn();
  const props = {
    currentYearMonth: { year: 2026, month: 11 },
    startDate: '',
    endDate: '',
    minimumDate: '2026-12-01',
    onPrevMonth,
    onNextMonth: jest.fn(),
    onSelectDay: jest.fn(),
  };
  const ui = await render(React.createElement(InlineCalendarView, props));
  expect(ui.getByTestId('calendar-day-2026-11-30')).toBeDisabled();
  await ui.rerender(
    React.createElement(InlineCalendarView, {
      ...props,
      currentYearMonth: { year: 2026, month: 12 },
    }),
  );
  expect(ui.getByTestId('calendar-day-2026-12-01')).toBeEnabled();
  expect(ui.getByTestId('calendar-prev-month')).toBeDisabled();
  await ui.rerender(
    React.createElement(InlineCalendarView, {
      ...props,
      currentYearMonth: { year: 2026, month: 12 },
      minimumDate: '2026-11-30',
    }),
  );
  expect(ui.getByTestId('calendar-prev-month')).toBeEnabled();
});

test('기기 날짜가 앞서도 서비스 기준일의 전월 날짜를 달력에서 선택할 수 있다', async () => {
  jest.useFakeTimers({ now: new Date('2026-12-01T01:00:00Z') });
  const ui = await renderWithQueryClient(
    React.createElement(TravelDateSheet, {
      visible: true,
      startDate: '',
      endDate: '',
      minimumDate: '2026-11-30',
      onClose: jest.fn(),
      onConfirm: jest.fn(),
    }),
  );
  expect(ui.getByTestId('calendar-day-2026-11-30')).toBeEnabled();
  expect(ui.getByTestId('calendar-day-2026-11-29')).toBeDisabled();
});

test('기준일을 전달하지 않은 공통 달력은 기존 현지 날짜 기준을 유지한다', async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 7, 12) });
  const ui = await render(
    React.createElement(InlineCalendarView, {
      currentYearMonth: { year: 2026, month: 11 },
      startDate: '',
      endDate: '',
      onPrevMonth: jest.fn(),
      onNextMonth: jest.fn(),
      onSelectDay: jest.fn(),
    }),
  );
  expect(ui.getByTestId('calendar-day-2026-11-06')).toBeDisabled();
  expect(ui.getByTestId('calendar-day-2026-11-07')).toBeEnabled();
});
