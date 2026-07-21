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
          <Ionicons name="chevron-back" size={18} color="#4648D4" />
        </TouchableOpacity>
        <Text style={styles.calendarMonthText}>
          {currentYearMonth.year}년 {currentYearMonth.month}월
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.monthNavBtn}>
          <Ionicons name="chevron-forward" size={18} color="#4648D4" />
        </TouchableOpacity>
      </View>

      {/* Day of Week Header (7 Columns) */}
      <View style={styles.weekHeaderRow}>
        {['일', '월', '화', '수', '목', '금', '토'].map((dayName, idx) => (
          <Text
            key={dayName}
            style={[
              styles.weekHeaderText,
              idx === 0 && { color: '#EF4444' },
              idx === 6 && { color: '#4648D4' },
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  calendarMonthText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
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
    backgroundColor: '#4648D4',
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

export default InlineCalendarView;
