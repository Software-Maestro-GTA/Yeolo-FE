/**
 * @file CourseDayTabs.tsx
 * @description Horizontal scrollable day selection tab pills component.
 */
import { Text } from '../common/Typography';
import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
            accessibilityRole='tab'
            accessibilityState={{ selected: isSelected }}
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
    marginVertical: 0,
  },
  dayPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 48,
    backgroundColor: palette.gray100,
    borderWidth: 1,
    borderColor: palette.gray300,
  },
  dayPillSelected: {
    backgroundColor: palette.deepNavy,
    borderColor: palette.deepNavy,
  },
  dayPillText: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.deepNavy,
  },
  dayPillTextSelected: {
    color: palette.white,
    fontWeight: '500',
  },
});
