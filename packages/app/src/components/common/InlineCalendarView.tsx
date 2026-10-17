/**
 * @file InlineCalendarView.tsx
 * @description UI v3 연속 월 달력과 기존 월 탐색 UI에서 재사용하는 날짜 범위 캘린더.
 */
import { Text } from './Typography';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateTotalDays } from '@yeolo/common';
import { palette } from '../../theme/colors';
import { UI_STRINGS } from '../../constants';

export interface InlineCalendarViewProps {
  currentYearMonth: { year: number; month: number };
  startDate: string;
  endDate: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (day: number) => void;
  hideMonthNavigation?: boolean;
  maxDays?: number;
}

/** Memoized by visual state so an unchanged date does not rebuild its native views. */
const CalendarDayCell = React.memo(function CalendarDayCell({
  dayNum,
  dateStr,
  isDisabled,
  isStart,
  isEnd,
  isInRange,
  showStartTrack,
  showEndTrack,
  onSelectDay,
}: {
  dayNum: number;
  dateStr: string;
  isDisabled: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
  showStartTrack: boolean;
  showEndTrack: boolean;
  onSelectDay: (day: number) => void;
}) {
  return (
    <TouchableOpacity
      testID={`calendar-day-${dateStr}`}
      accessibilityRole='button'
      accessibilityLabel={dateStr}
      accessibilityState={{
        disabled: isDisabled,
        selected: isStart || isEnd,
      }}
      style={styles.dayCellContainer}
      activeOpacity={isDisabled ? 1 : 0.7}
      disabled={isDisabled}
      onPress={() => !isDisabled && onSelectDay(dayNum)}>
      {/* Connected Ribbon Background Track */}
      {showStartTrack && (
        <View style={[styles.rangeTrack, styles.rangeTrackStart]} />
      )}
      {showEndTrack && (
        <View style={[styles.rangeTrack, styles.rangeTrackEnd]} />
      )}
      {isInRange && (
        <View style={[styles.rangeTrack, styles.rangeTrackMiddle]} />
      )}

      {/* Day Content Bubble */}
      <View
        style={[
          styles.dayBubble,
          (isStart || isEnd) && styles.dayBubbleSelected,
        ]}>
        <Text
          style={[
            styles.dayCellText,
            isDisabled && styles.dayTextDisabled,
            isInRange && styles.dayCellTextInRange,
            (isStart || isEnd) && styles.dayCellTextSelected,
          ]}>
          {dayNum}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export const InlineCalendarView: React.FC<InlineCalendarViewProps> = ({
  currentYearMonth,
  startDate,
  endDate,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  hideMonthNavigation = false,
  maxDays = 29,
}) => {
  const getDaysInMonth = (year: number, month: number) => {
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDate; i++) {
      days.push(i);
    }
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    return days;
  };

  const getWeekRows = (days: (number | null)[]) => {
    const rows: (number | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  };

  const weekRows = React.useMemo(
    () =>
      getWeekRows(
        getDaysInMonth(currentYearMonth.year, currentYearMonth.month),
      ),
    [currentYearMonth.year, currentYearMonth.month],
  );

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = String(today.getMonth() + 1).padStart(2, '0');
  const todayD = String(today.getDate()).padStart(2, '0');
  const todayStr = `${todayY}-${todayM}-${todayD}`;

  const isPrevMonthDisabled =
    currentYearMonth.year < todayY ||
    (currentYearMonth.year === todayY &&
      currentYearMonth.month <= today.getMonth() + 1);

  return (
    <View style={styles.inlineCalendarCard} testID='inline-calendar'>
      <View style={styles.calendarHeader}>
        {!hideMonthNavigation && (
          <TouchableOpacity
            onPress={onPrevMonth}
            disabled={isPrevMonthDisabled}
            style={[
              styles.monthNavBtn,
              isPrevMonthDisabled && styles.disabledNav,
            ]}
            activeOpacity={0.7}>
            <Ionicons name='chevron-back' size={18} color={palette.deepNavy} />
          </TouchableOpacity>
        )}
        <Text style={styles.calendarMonthText}>
          {currentYearMonth.year}.
          {String(currentYearMonth.month).padStart(2, '0')}
        </Text>
        {!hideMonthNavigation && (
          <TouchableOpacity
            onPress={onNextMonth}
            style={styles.monthNavBtn}
            activeOpacity={0.7}>
            <Ionicons
              name='chevron-forward'
              size={18}
              color={palette.deepNavy}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Day of Week Header (7 Columns) */}
      <View style={styles.weekHeaderRow}>
        {UI_STRINGS.COMPONENTS.CALENDAR_WEEKDAYS.map((dayName, idx) => (
          <Text
            key={dayName}
            style={[
              styles.weekHeaderText,
              idx === 0 && styles.sunday,
              idx === 6 && styles.saturday,
            ]}>
            {dayName}
          </Text>
        ))}
      </View>

      {/* Calendar Days Rows */}
      <View style={styles.calendarBody}>
        {weekRows.map((weekRow, weekIdx) => (
          <View key={`week-${weekIdx}`} style={styles.weekRow}>
            {weekRow.map((dayNum, dayIdx) => {
              if (dayNum === null) {
                return (
                  <View
                    key={`empty-${weekIdx}-${dayIdx}`}
                    style={styles.dayCellContainer}
                  />
                );
              }

              const mm = String(currentYearMonth.month).padStart(2, '0');
              const dd = String(dayNum).padStart(2, '0');
              const dateStr = `${currentYearMonth.year}-${mm}-${dd}`;

              const isDisabledByPast = dateStr < todayStr;
              let isDisabledByMaxDays = false;
              if (startDate && !endDate && dateStr >= startDate) {
                const days = calculateTotalDays(startDate, dateStr);
                if (days !== null && days > maxDays) {
                  isDisabledByMaxDays = true;
                }
              }
              const isDisabled = isDisabledByPast || isDisabledByMaxDays;

              const isStart = startDate === dateStr;
              const isEnd = endDate === dateStr;
              const hasBoth = Boolean(startDate) && Boolean(endDate);
              const isSameDate = isStart && isEnd;
              const isInRange =
                hasBoth && startDate < dateStr && dateStr < endDate;

              const showStartTrack = hasBoth && !isSameDate && isStart;
              const showEndTrack = hasBoth && !isSameDate && isEnd;

              return (
                <CalendarDayCell
                  key={dayNum}
                  dayNum={dayNum}
                  dateStr={dateStr}
                  isDisabled={isDisabled}
                  isStart={isStart}
                  isEnd={isEnd}
                  isInRange={isInRange}
                  showStartTrack={showStartTrack}
                  showEndTrack={showEndTrack}
                  onSelectDay={onSelectDay}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inlineCalendarCard: {
    backgroundColor: palette.white,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthText: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.deepNavy,
    flex: 1,
    textAlign: 'center',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 0,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: palette.deepNavy,
  },
  calendarBody: {
    gap: 4,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayCellContainer: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  rangeTrack: {
    position: 'absolute',
    height: 44,
    backgroundColor: palette.gray100,
    top: 2,
  },
  rangeTrackStart: {
    left: '50%',
    right: 0,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  rangeTrackEnd: {
    left: 0,
    right: '50%',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  rangeTrackMiddle: {
    left: 0,
    right: 0,
  },
  dayBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  dayBubbleSelected: {
    backgroundColor: palette.gray600,
  },
  dayCellText: {
    fontSize: 20,
    fontWeight: '500',
    color: palette.deepNavy,
  },
  dayCellTextInRange: {
    color: palette.deepNavy,
    fontWeight: '500',
  },
  dayTextDisabled: {
    color: palette.gray200,
  },
  dayCellTextSelected: {
    color: palette.white,
    fontWeight: '500',
  },
  disabledNav: { opacity: 0.3 },
  sunday: { color: palette.deepNavy },
  saturday: { color: palette.deepNavy },
});
