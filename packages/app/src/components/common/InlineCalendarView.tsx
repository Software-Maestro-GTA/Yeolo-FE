/**
 * @file InlineCalendarView.tsx
 * @description Accordion inline calendar view component with UI v2 styling and UI_STRINGS constants.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
}

export const InlineCalendarView: React.FC<InlineCalendarViewProps> = ({
  currentYearMonth,
  startDate,
  endDate,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
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

  const calendarDays = getDaysInMonth(
    currentYearMonth.year,
    currentYearMonth.month,
  );
  const weekRows = getWeekRows(calendarDays);

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
        <TouchableOpacity
          onPress={onPrevMonth}
          disabled={isPrevMonthDisabled}
          style={[styles.monthNavBtn, isPrevMonthDisabled && { opacity: 0.3 }]}
          activeOpacity={0.7}>
          <Ionicons name='chevron-back' size={18} color={palette.deepNavy} />
        </TouchableOpacity>
        <Text style={styles.calendarMonthText}>
          {currentYearMonth.year}
          {UI_STRINGS.COMPONENTS.CALENDAR_YEAR_SUFFIX} {currentYearMonth.month}
          {UI_STRINGS.COMPONENTS.CALENDAR_MONTH_SUFFIX}
        </Text>
        <TouchableOpacity
          onPress={onNextMonth}
          style={styles.monthNavBtn}
          activeOpacity={0.7}>
          <Ionicons name='chevron-forward' size={18} color={palette.deepNavy} />
        </TouchableOpacity>
      </View>

      {/* Day of Week Header (7 Columns) */}
      <View style={styles.weekHeaderRow}>
        {UI_STRINGS.COMPONENTS.CALENDAR_WEEKDAYS.map((dayName, idx) => (
          <Text
            key={dayName}
            style={[
              styles.weekHeaderText,
              idx === 0 && { color: '#EF4444' },
              idx === 6 && { color: palette.primary },
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
                if (days !== null && days >= 30) {
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
                <TouchableOpacity
                  key={`day-${dayNum}`}
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
                    <View
                      style={[styles.rangeTrack, styles.rangeTrackMiddle]}
                    />
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
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inlineCalendarCard: {
    backgroundColor: palette.softMint, // #F5FAF8
    borderWidth: 1,
    borderColor: '#E0E8E5',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 15,
    fontWeight: '700',
    color: palette.deepNavy, // #0D2137
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEDF2',
    paddingBottom: 8,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: palette.subText,
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
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  rangeTrack: {
    position: 'absolute',
    height: 32,
    backgroundColor: 'rgba(0, 201, 167, 0.15)', // #00C9A7 15% opacity
    top: 3,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  dayBubbleSelected: {
    backgroundColor: palette.primary, // #2D7DD2
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.deepNavy,
  },
  dayCellTextInRange: {
    color: palette.accent, // #00C9A7
    fontWeight: '800',
  },
  dayTextDisabled: {
    color: palette.gray200,
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
