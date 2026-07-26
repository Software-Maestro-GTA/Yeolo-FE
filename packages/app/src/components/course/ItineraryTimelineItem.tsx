/**
 * @file ItineraryTimelineItem.tsx
 * @description Timeline item card displaying itinerary stop details, AI tips, and transport info.
 * @requirements REQ-9
 * @functional FUN-3
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ItineraryStop, TransportType } from '@yeolo/common';
import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

export interface ItineraryTimelineItemProps {
  stop: ItineraryStop;
  isLast: boolean;
}

export const ItineraryTimelineItem: React.FC<ItineraryTimelineItemProps> = ({
  stop,
  isLast,
}) => {
  const getCategoryIcon = (category?: string) => {
    if (!category) return 'location-outline';
    if (category.includes('미술관') || category.includes('전시')) return 'color-palette-outline';
    if (category.includes('카페')) return 'cafe-outline';
    if (category.includes('해변') || category.includes('관광')) return 'camera-outline';
    if (category.includes('전망대')) return 'eye-outline';
    return 'compass-outline';
  };

  const formatTransportText = (transport: TransportType, minutes?: number): string | null => {
    if (transport === 'none' || !minutes) return null;
    const minutesText = `${minutes}${UI_STRINGS.COURSE_DETAIL.MINUTES_SUFFIX}`;
    switch (transport) {
      case 'walking':
        return `${UI_STRINGS.COURSE_DETAIL.TRANSPORT_WALKING} ${minutesText}`;
      case 'transit':
        return `${UI_STRINGS.COURSE_DETAIL.TRANSPORT_TRANSIT} ${minutesText}`;
      case 'driving':
        return `${UI_STRINGS.COURSE_DETAIL.TRANSPORT_DRIVING} ${minutesText}`;
      case 'taxi':
        return `${UI_STRINGS.COURSE_DETAIL.TRANSPORT_TAXI} ${minutesText}`;
      default:
        return `${UI_STRINGS.COURSE_DETAIL.TRANSPORT_DEFAULT} ${minutesText}`;
    }
  };

  const transportText = formatTransportText(stop.transportToNext, stop.travelMinutesToNext);

  return (
    <View style={styles.timelineItemWrapper}>
      <View style={styles.timelineItem}>
        {/* Timeline Left Node Circle */}
        <View style={styles.nodeCircle}>
          <Ionicons
            name={getCategoryIcon(stop.category)}
            size={18}
            color={theme.colors.primary}
          />
        </View>

        {/* Timeline Connecting Vertical Line */}
        {!isLast && <View style={styles.verticalLine} />}

        {/* Content Right Area */}
        <View style={styles.itemContent}>
          {/* Time & Cost Header */}
          <View style={styles.itemHeader}>
            <Text style={styles.arrivalTime}>{stop.arrivalTime || UI_STRINGS.COURSE_DETAIL.TIME_UNSET}</Text>
            <View style={styles.costBadge}>
              <Text style={styles.costBadgeText}>
                {UI_STRINGS.COURSE_DETAIL.APPROX_CURRENCY}{stop.cost !== undefined ? stop.cost.toLocaleString() : '0'}
              </Text>
            </View>
          </View>

          {/* Place Name */}
          <Text style={styles.placeName}>{stop.placeName}</Text>

          {/* Stay Minutes & Meta */}
          {stop.stayMinutes ? (
            <Text style={styles.stayMinutesText}>⏱️ {stop.stayMinutes}{UI_STRINGS.COURSE_DETAIL.MINUTES_SUFFIX} {UI_STRINGS.COURSE_DETAIL.STAY_SUFFIX}</Text>
          ) : null}

          {/* AI Tip / Recommendation Card */}
          <View style={styles.aiTipCard}>
            <Ionicons name="sparkles" size={16} color={theme.colors.primary} style={styles.sparkleIcon} />
            <View style={styles.aiTipContent}>
              <Text style={styles.aiTipText}>
                {stop.reason && stop.reason.trim() !== ''
                  ? stop.reason
                  : stop.memo && stop.memo.trim() !== ''
                  ? stop.memo
                  : UI_STRINGS.COURSE_DETAIL.NO_INFO}
              </Text>
            </View>
          </View>

          {/* Transport Indicator to Next Stop */}
          {transportText ? (
            <View style={styles.transportRow}>
              <Ionicons name="walk-outline" size={14} color={theme.colors.text.muted} />
              <Text style={styles.transportText}>{transportText}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  timelineItemWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
  },
  nodeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  verticalLine: {
    position: 'absolute',
    left: 17,
    top: 36,
    bottom: -16,
    width: 2,
    backgroundColor: theme.colors.border.light,
    zIndex: 1,
  },
  itemContent: {
    flex: 1,
    marginLeft: 14,
    backgroundColor: theme.colors.bg.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  arrivalTime: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  costBadge: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  costBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  stayMinutesText: {
    fontSize: 12,
    color: theme.colors.text.subtle,
    marginBottom: 10,
  },
  aiTipCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bg.input,
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 8,
  },
  sparkleIcon: {
    marginTop: 2,
  },
  aiTipContent: {
    flex: 1,
  },
  aiTipText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  transportText: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
});
