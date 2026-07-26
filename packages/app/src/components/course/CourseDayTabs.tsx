/**
 * @file CourseDayTabs.tsx
 * @description Horizontal scrollable day selection tab pills for course itinerary.
 * @requirements REQ-9
 * @functional FUN-3
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import type { ItineraryDay } from '@yeolo/common';
import { theme } from '../../theme';

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
      contentContainerStyle={styles.dayTabContainer}
    >
      {days.map((dayItem) => {
        const isSelected = dayItem.day === selectedDay;
        return (
          <TouchableOpacity
            key={dayItem.day}
            testID={`day-tab-${dayItem.day}`}
            style={[styles.dayPill, isSelected && styles.dayPillSelected]}
            onPress={() => onSelectDay(dayItem.day)}
          >
            <Text style={[styles.dayPillText, isSelected && styles.dayPillTextSelected]}>
              Day {dayItem.day}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  dayTabContainer: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  dayPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: theme.colors.bg.card,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  dayPillSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dayPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  dayPillTextSelected: {
    color: theme.colors.text.inverse,
    fontWeight: '700',
  },
});
