/**
 * @file CourseDetailHeader.tsx
 * @description Header component displaying destination country, city, start date, and course title.
 * @requirements REQ-9
 * @functional FUN-3
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

export interface CourseDetailHeaderProps {
  destinationCountry: string;
  destinationCity: string;
  startDate: string;
  title: string;
  totalCost?: number;
}

export const CourseDetailHeader: React.FC<CourseDetailHeaderProps> = ({
  destinationCountry,
  destinationCity,
  startDate,
  title,
}) => {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>
        {destinationCountry} {destinationCity}
      </Text>
      <Text style={styles.headerSubtitle}>
        {startDate}, {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.text.subtle,
    fontWeight: '500',
  },
});
