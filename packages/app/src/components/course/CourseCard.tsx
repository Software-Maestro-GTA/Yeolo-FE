/**
 * @file CourseCard.tsx
 * @description Course card component displaying photo area, title, itinerary summary, and tags for CourseListScreen matching UI v2 design system.
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CourseSummary } from '@yeolo/common';
import { getDestinationImageUrl } from '../../services';
import { palette, hexToRgba } from '../../theme/colors';

export interface CourseCardProps {
  item: CourseSummary;
  onPress?: (courseId: string) => void;
  onLongPress?: (course: CourseSummary) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  item,
  onPress,
  onLongPress,
}) => {
  const summaryItem = item as any;
  const imageUrl =
    summaryItem.imageUrl ||
    getDestinationImageUrl(item.destinationCountry, item.destinationCity);
  const summaryText = item.recommendationReason || summaryItem.summary || '';
  const displayTags = item.tags ? item.tags.slice(0, 3) : [];

  return (
    <TouchableOpacity
      style={styles.heroRouteCard}
      activeOpacity={0.9}
      onPress={() => onPress?.(item.courseId)}
      onLongPress={() => onLongPress?.(item)}
      testID={`course-card-${item.courseId}`}>
      {/* Photo Area Header */}
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.photoArea}
        resizeMode='cover'>
        <View style={styles.photoDimOverlay} />

        {/* Card Title & Meta Overlay */}
        <View style={styles.photoContentOverlay}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {item.destinationCountry} {item.destinationCity}
            {item.startDate ? ` • ${item.startDate}` : ''}
            {item.totalDays ? ` • ${item.totalDays}일` : ''}
          </Text>
        </View>
      </ImageBackground>

      {/* Hero Card Body */}
      <View style={styles.heroBody}>
        {summaryText ? (
          <View style={styles.locationRow}>
            <Ionicons
              name='location-outline'
              size={14}
              color={palette.subText}
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {summaryText}
            </Text>
          </View>
        ) : null}

        {displayTags.length > 0 && (
          <View style={styles.tagsRow}>
            {displayTags.map((tag, idx) => (
              <View key={`${item.courseId}-tag-${idx}`} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  heroRouteCard: {
    backgroundColor: palette.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  photoArea: {
    height: 160,
    justifyContent: 'flex-end',
    padding: 12,
  },
  photoDimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: hexToRgba(palette.deepNavy, 0.35),
  },
  photoContentOverlay: {
    gap: 2,
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.white,
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: '400',
    color: hexToRgba(palette.white, 0.9),
  },
  heroBody: {
    height: 85,
    padding: 16,
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: palette.subText,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagChip: {
    backgroundColor: palette.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.primary,
  },
});
