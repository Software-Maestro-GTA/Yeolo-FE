/**
 * @file CourseDayTabs.tsx
 * @description Horizontal scrollable day selection tab pills component.
 */
import React from 'react';
import { StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import type { ItineraryDay } from '@yeolo/common';
import { palette } from '../../theme/colors';
import { UI_STRINGS } from '../../constants';

export interface CourseDayTabsProps {
  days?: ItineraryDay[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

export const CourseDayTabs: React.FC<CourseDayTabsProps> = ({
  days,
  selectedDay,
  onSelectDay,
}) => {
  if (!days || days.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dayTabContainer}>
      {days.map((dayItem) => {
        const isSelected = dayItem.day === selectedDay;
        return (
          <TouchableOpacity
            key={dayItem.day}
            testID={`day-tab-${dayItem.day}`}
            style={[styles.dayPill, isSelected && styles.dayPillSelected]}
            onPress={() => onSelectDay(dayItem.day)}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.dayPillText,
                isSelected && styles.dayPillTextSelected,
              ]}>
              {UI_STRINGS.COURSE_DETAIL.DAY_PREFIX}
              {dayItem.day}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  dayTabContainer: {
    paddingHorizontal: 0,
    gap: 8,
    marginVertical: 4,
  },
  dayPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.gray200,
  },
  dayPillSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  dayPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.subText,
  },
  dayPillTextSelected: {
    color: palette.white,
    fontWeight: '700',
  },
});
