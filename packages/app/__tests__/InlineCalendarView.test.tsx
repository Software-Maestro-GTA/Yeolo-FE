/**
 * @file InlineCalendarView.test.tsx
 * @description Checks calendar selection and that unchanged date labels do not render again on range changes.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { InlineCalendarView } from '../src/components/common/InlineCalendarView';

const mockDayRenders = jest.fn();
jest.mock('../src/components/common/Typography', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Text: (props: any) => {
      if (typeof props.children === 'number') mockDayRenders(props.children);
      return React.createElement(Text, props);
    },
  };
});

it('종료일 변경은 표시가 바뀐 날짜만 갱신하고 최신 선택 이벤트를 전달한다', async () => {
  const nextYear = new Date().getFullYear() + 1;
  const props = {
    currentYearMonth: { year: nextYear, month: 1 },
    startDate: `${nextYear}-01-10`,
    endDate: `${nextYear}-01-12`,
    onSelectDay: jest.fn(),
    onPrevMonth: jest.fn(),
    onNextMonth: jest.fn(),
  };
  const ui = await render(<InlineCalendarView {...props} />);
  mockDayRenders.mockClear();
  await ui.rerender(
    <InlineCalendarView {...props} endDate={`${nextYear}-01-14`} />,
  );
  expect(mockDayRenders.mock.calls.map(([day]) => day)).toEqual([12, 13, 14]);
  expect(ui.getByTestId(`calendar-day-${nextYear}-01-14`)).toHaveProp(
    'accessibilityState',
    { selected: true, disabled: false },
  );
  await fireEvent.press(ui.getByTestId(`calendar-day-${nextYear}-01-15`));
  expect(props.onSelectDay).toHaveBeenCalledWith(15);
  const onSelectDay = jest.fn();
  await ui.rerender(
    <InlineCalendarView {...props} onSelectDay={onSelectDay} />,
  );
  await fireEvent.press(ui.getByTestId(`calendar-day-${nextYear}-01-15`));
  expect(onSelectDay).toHaveBeenCalledWith(15);
});
