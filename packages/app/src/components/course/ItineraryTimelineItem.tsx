/**
 * @file ItineraryTimelineItem.tsx
 * @description Timeline item card displaying itinerary stop details, AI tips, and transport info.
 * @requirements REQ-9
 * @functional FUN-3
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ItineraryStop, TransportType } from '@yeolo/common';
import { palette } from '../../theme/colors';
import { UI_STRINGS } from '../../constants';

export interface ItineraryTimelineItemProps {
  stop: ItineraryStop;
  isLast: boolean;
  onPressPlace?: (stop: ItineraryStop) => void;
}

export const ItineraryTimelineItem: React.FC<ItineraryTimelineItemProps> = ({
  stop,
  isLast,
  onPressPlace,
}) => {
  const getCategoryIcon = (category?: string) => {
    if (!category) return 'location-outline';
    if (category.includes('미술관') || category.includes('박물관') || category.includes('전시')) return 'easel-outline';
    if (category.includes('카페') || category.includes('디저트')) return 'cafe-outline';
    if (category.includes('해변') || category.includes('관광') || category.includes('공원')) return 'camera-outline';
    if (category.includes('식당') || category.includes('맛집') || category.includes('음식')) return 'restaurant-outline';
    return 'compass-outline';
  };

  const getTransportIcon = (transport: TransportType) => {
    switch (transport) {
      case 'walking':
        return 'footsteps-outline';
      case 'transit':
        return 'bus-outline';
      case 'driving':
        return 'car-outline';
      case 'taxi':
        return 'car-sport-outline';
      default:
        return 'walk-outline';
    }
  };

  const formatTransportLabel = (transport: TransportType, minutes?: number): string => {
    const mins = minutes ? `${minutes}${UI_STRINGS.COURSE_DETAIL.MINUTES_SUFFIX}` : '';
    switch (transport) {
      case 'walking':
        return `도보 ${mins}`;
      case 'transit':
        return `대중교통 ${mins}`;
      case 'driving':
        return `자가용 ${mins}`;
      case 'taxi':
        return `택시 ${mins}`;
      default:
        return `이동 ${mins}`;
    }
  };

  const hasTransport = stop.transportToNext && stop.transportToNext !== 'none' && stop.travelMinutesToNext;

  return (
    <View style={styles.timelineItemWrapper}>
      <TouchableOpacity
        style={styles.placeCard}
        testID="place-card"
        activeOpacity={0.85}
        onPress={() => onPressPlace?.(stop)}
      >
        <View style={styles.titleRow}>
          <View style={styles.placeTitleGroup}>
            <Ionicons
              name={getCategoryIcon(stop.category)}
              size={18}
              color={palette.primary}
            />
            <Text style={styles.placeNameText}>{stop.placeName}</Text>
          </View>
          <View style={styles.mintBadge}>
            <Text style={styles.mintBadgeText}>
              ₩{stop.cost !== undefined ? stop.cost.toLocaleString() : '0'}
            </Text>
          </View>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.arrivalTimeText}>
            {stop.arrivalTime || '10:00 AM'}
          </Text>
          <View style={styles.dividerDot} />
          <Text style={styles.stayMinutesText}>
            {stop.stayMinutes ? `${stop.stayMinutes}${UI_STRINGS.COURSE_DETAIL.MINUTES_SUFFIX}` : '60분 소요'}
          </Text>
        </View>

        <View style={styles.aiTipBox}>
          <Ionicons name="bulb-outline" size={14} color={palette.accent} style={styles.tipIcon} />
          <Text style={styles.aiTipText}>
            {stop.reason && stop.reason.trim() !== ''
              ? stop.reason
              : stop.memo && stop.memo.trim() !== ''
              ? stop.memo
              : UI_STRINGS.COURSE_DETAIL.NO_INFO}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Connected Transit Card */}
      {hasTransport && (
        <View style={styles.transitCardWrapper}>
          <View style={styles.transitCard} testID="transit-card">
            {/* Transit Header */}
            <View style={styles.transitHeader}>
              <View style={styles.transitTitleGroup}>
                <Ionicons
                  name={getTransportIcon(stop.transportToNext)}
                  size={16}
                  color={palette.deepNavy}
                />
                <Text style={styles.transitTitleText}>
                  {formatTransportLabel(stop.transportToNext, stop.travelMinutesToNext)}
                </Text>
              </View>
              <View style={styles.mintBadge}>
                <Text style={styles.mintBadgeText}>
                  {UI_STRINGS.COURSE_DETAIL.FREE_TRANSIT}
                </Text>
              </View>
            </View>

            {/* Route Visual Line */}
            <View style={styles.routeVisualRow}>
              <View style={styles.routeDot} />
              <View style={styles.routeLine} />
              <Ionicons name="footsteps" size={12} color={palette.primary} />
              <View style={styles.routeLine} />
              <View style={styles.routeDot} />
            </View>

            {/* Transit Tip Box */}
            <View style={styles.aiTipBox}>
              <Ionicons name="bulb-outline" size={14} color={palette.accent} style={styles.tipIcon} />
              <Text style={styles.aiTipText}>
                {stop.memo && stop.memo.includes('이동')
                  ? stop.memo
                  : '가장 효율적인 추천 동선으로 연결된 구간입니다.'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  timelineItemWrapper: {
    width: '100%',
    marginBottom: 16,
    gap: 12,
  },
  placeCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200, // #E0E5EB
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.deepNavy, // #0D2137
  },
  mintBadge: {
    backgroundColor: '#E0F7F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  mintBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.accent, // #00C9A7
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrivalTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.primary, // #2D7DD2
  },
  dividerDot: {
    width: 1,
    height: 12,
    backgroundColor: '#EBEDF2',
  },
  stayMinutesText: {
    fontSize: 13,
    fontWeight: '400',
    color: palette.subText, // #59616B
  },
  aiTipBox: {
    backgroundColor: palette.softMint, // #F5FAF8
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  tipIcon: {
    marginTop: 1,
  },
  aiTipText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '400',
    color: palette.subText,
    lineHeight: 15,
  },
  transitCardWrapper: {
    width: '100%',
  },
  transitCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  transitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transitTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transitTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  routeVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 16,
  },
  routeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.primary,
  },
  routeLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#E0E5EB',
  },
});
