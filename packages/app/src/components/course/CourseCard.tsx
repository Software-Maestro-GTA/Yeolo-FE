/**
 * @file CourseCard.tsx
 * @description Card component displaying previous course recommendation details in Bento Grid layout (FUN-7, DOM-2).
 * @requirements REQ-9
 * @functional FUN-7
 * @api API-FB-10
 * @author Antigravity Agent
 */
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import type { CourseSummary } from '@yeolo/common';

import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

/**
 * Helper function to dynamically construct an online image search URL based on country and city search terms.
 * Queries LoremFlickr dynamic photo search endpoint by country/city keywords.
 */
export function getDestinationImageUrl(country: string, city: string): string {
  const keyword = (city || country || UI_STRINGS.COMPONENTS.DEFAULT_TRAVEL_KEYWORD).trim();
  return `https://loremflickr.com/600/400/${encodeURIComponent(keyword)}`;
}

export interface CourseCardProps {
  course: CourseSummary;
  onPress: (courseId: string) => void;
  viewMode?: 'grid' | 'list';
}

export function CourseCard({ course, onPress, viewMode = 'grid' }: CourseCardProps) {
  const durationText =
    course.totalDays && course.totalDays > 1
      ? `${course.totalDays - 1}${UI_STRINGS.COMPONENTS.DURATION_NIGHTS_SUFFIX} ${course.totalDays}${UI_STRINGS.COMPONENTS.DURATION_DAYS_SUFFIX}`
      : UI_STRINGS.COMPONENTS.DURATION_SAME_DAY;

  const isList = viewMode === 'list';

  // Fallback banner image gradient/color based on course id hash
  const defaultColors = [theme.colors.primary, '#6c5ce7', '#00cec9', '#e84393', '#fdcb6e'];
  const colorIndex = Math.abs(
    course.courseId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % defaultColors.length;
  const accentColor = defaultColors[colorIndex];

  const imageUrl = getDestinationImageUrl(course.destinationCountry, course.destinationCity);
  
  return (
    <TouchableOpacity
      testID={`course-card-${course.courseId}`}
      style={[styles.card, isList ? styles.listCard : styles.gridCard]}
      activeOpacity={0.8}
      onPress={() => onPress(course.courseId)}
    >
      <View style={[styles.bannerContainer, { backgroundColor: accentColor }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.thumbnailImage} />
        ) : (
          <View style={styles.placeholderBanner}>
            <Text style={styles.placeholderText}>{course.destinationCity || course.destinationCountry}</Text>
          </View>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{durationText}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {!isList ? (
          <Text style={styles.titleText} numberOfLines={1}>
            {course.destinationCountry} {course.destinationCity}
          </Text>
        ) : (
          <>
            <Text style={styles.locationText}>
              {course.destinationCountry} {course.destinationCity}
            </Text>
            <Text style={styles.titleText} numberOfLines={2}>
              {course.title}
            </Text>
          </>
        )}

        {course.tags && course.tags.length > 0 && (
          <View style={styles.tagContainer}>
            {course.tags.slice(0, 3).map((tag, idx) => (
              <View key={idx} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.dateText}>
          {course.startDate ? `${course.startDate} 출발` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bg.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  gridCard: {
    width: '100%',
  },
  listCard: {
    width: '100%',
    flexDirection: 'row',
  },
  bannerContainer: {
    height: 100,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderBanner: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.bg.glass,
  },
  placeholderText: {
    color: theme.colors.text.inverse,
    fontWeight: '800',
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(3, 6, 18, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: theme.colors.text.inverse,
    fontSize: 11,
    fontWeight: '700',
  },
  contentContainer: {
    padding: 12,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  tagChip: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    color: theme.colors.text.placeholder,
    marginTop: 'auto',
  },
});
