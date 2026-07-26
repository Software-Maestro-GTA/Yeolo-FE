/**
 * @file InlineCalendarView.tsx
 * @description Accordion inline calendar view component with 7-column row-grouped week layout.
 * @requirements REQ-7
 * @functional FUN-6
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
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

  const calendarDays = getDaysInMonth(currentYearMonth.year, currentYearMonth.month);
  const weekRows = getWeekRows(calendarDays);

  return (
    <View style={styles.inlineCalendarCard}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.monthNavBtn}>
          <Ionicons name="chevron-back" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.calendarMonthText}>
          {currentYearMonth.year}{UI_STRINGS.COMPONENTS.CALENDAR_YEAR_SUFFIX} {currentYearMonth.month}{UI_STRINGS.COMPONENTS.CALENDAR_MONTH_SUFFIX}
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.monthNavBtn}>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Day of Week Header (7 Columns) */}
      <View style={styles.weekHeaderRow}>
        {UI_STRINGS.COMPONENTS.CALENDAR_WEEKDAYS.map((dayName, idx) => (
          <Text
            key={dayName}
            style={[
              styles.weekHeaderText,
              idx === 0 && { color: theme.colors.status.error },
              idx === 6 && { color: theme.colors.primary },
            ]}
          >
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
                return <View key={`empty-${weekIdx}-${dayIdx}`} style={styles.dayCell} />;
              }

              const mm = String(currentYearMonth.month).padStart(2, '0');
              const dd = String(dayNum).padStart(2, '0');
              const dateStr = `${currentYearMonth.year}-${mm}-${dd}`;

              const isStart = startDate === dateStr;
              const isEnd = endDate === dateStr;

              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  style={[
                    styles.dayCell,
                    (isStart || isEnd) && styles.dayCellSelected,
                  ]}
                  onPress={() => onSelectDay(dayNum)}
                >
                  <Text
                    style={[
                      styles.dayCellText,
                      (isStart || isEnd) && styles.dayCellTextSelected,
                    ]}
                  >
                    {dayNum}
                  </Text>
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
    backgroundColor: theme.colors.bg.input,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthNavBtn: {
    padding: 6,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 8,
  },
  calendarMonthText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
    paddingBottom: 6,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.subtle,
  },
  calendarBody: {
    gap: 4,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  dayCellSelected: {
    backgroundColor: theme.colors.primary,
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  dayTextDisabled: {
    color: theme.colors.border.default,
  },
  dayCellTextSelected: {
    color: theme.colors.text.inverse,
    fontWeight: '800',
  },
});
