/**
 * @file ItineraryTimelineItem.tsx
 * @description Timeline item card displaying itinerary stop details, AI tips, and transport info.
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
    if (
      category.includes('미술관') ||
      category.includes('박물관') ||
      category.includes('전시')
    )
      return 'easel-outline';
    if (category.includes('카페') || category.includes('디저트'))
      return 'cafe-outline';
    if (
      category.includes('해변') ||
      category.includes('관광') ||
      category.includes('공원')
    )
      return 'camera-outline';
    if (
      category.includes('식당') ||
      category.includes('맛집') ||
      category.includes('음식')
    )
      return 'restaurant-outline';
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

  const getRouteVisualIcon = (transport: TransportType) => {
    switch (transport) {
      case 'walking':
        return 'footsteps';
      case 'transit':
        return 'bus';
      case 'driving':
        return 'car';
      case 'taxi':
        return 'car-sport';
      default:
        return 'walk';
    }
  };

  const formatTransportLabel = (
    transport: TransportType,
    minutes?: number | null,
  ): string => {
    const mins = minutes
      ? `${minutes}${UI_STRINGS.COURSE_DETAIL.MINUTES_SUFFIX}`
      : '';
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

  const formatTransitCostBadge = (
    transportType: TransportType,
    cost?: number | null,
  ): string => {
    if (transportType === 'walking') {
      return UI_STRINGS.COURSE_DETAIL.FREE_WALKING;
    }
    if (cost !== null && cost !== undefined && cost > 0) {
      return `₩${cost.toLocaleString()}`;
    }
    return UI_STRINGS.COURSE_DETAIL.SEPARATE_TRANSIT_COST;
  };

  const hasReason = Boolean(stop?.reason && stop.reason.trim() !== '');
  const hasMemo = Boolean(
    stop?.memo &&
    stop.memo.trim() !== '' &&
    stop.memo.trim() !== stop?.reason?.trim(),
  );

  const transport = stop?.transportToNext;
  const place = stop?.place;

  const hasTransport =
    Boolean(transport) &&
    transport?.type !== 'none' &&
    (transport?.minutes !== null && transport?.minutes !== undefined
      ? transport.minutes > 0
      : true);

  return (
    <View style={styles.timelineItemWrapper}>
      <TouchableOpacity
        style={styles.placeCard}
        testID='place-card'
        activeOpacity={0.85}
        onPress={() => onPressPlace?.(stop)}>
        <View style={styles.titleRow}>
          <View style={styles.placeTitleGroup}>
            <Ionicons
              name={getCategoryIcon(place?.category)}
              size={18}
              color={palette.primary}
            />
            <Text style={styles.placeNameText}>
              {place?.placeName || '장소명 없음'}
            </Text>
          </View>
          <View style={styles.mintBadge}>
            <Text style={styles.mintBadgeText}>
              ₩
              {stop?.cost !== null && stop?.cost !== undefined
                ? stop.cost.toLocaleString()
                : transport?.cost !== null && transport?.cost !== undefined
                  ? transport.cost.toLocaleString()
                  : '0'}
            </Text>
          </View>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.arrivalTimeText}>
            {stop.arrivalTime || '10:00 AM'}
          </Text>
          <View style={styles.dividerDot} />
          <Text style={styles.stayMinutesText}>
            {stop.stayMinutes
              ? `${stop.stayMinutes}${UI_STRINGS.COURSE_DETAIL.MINUTES_SUFFIX}`
              : UI_STRINGS.COURSE_DETAIL.DEFAULT_STAY_TIME}
          </Text>
        </View>

        <View style={styles.aiTipBox}>
          {hasReason && (
            <View style={styles.tipRow}>
              <Ionicons
                name='bulb-outline'
                size={14}
                color={palette.accent}
                style={styles.tipIcon}
              />
              <Text style={styles.aiTipText}>{stop.reason?.trim()}</Text>
            </View>
          )}

          {hasReason && hasMemo && <View style={styles.tipDivider} />}

          {hasMemo && (
            <View style={styles.tipRow}>
              <Ionicons
                name='document-text-outline'
                size={14}
                color={palette.primary}
                style={styles.tipIcon}
              />
              <Text style={styles.aiTipText}>{stop.memo?.trim()}</Text>
            </View>
          )}

          {!hasReason && !hasMemo && (
            <View style={styles.tipRow}>
              <Ionicons
                name='bulb-outline'
                size={14}
                color={palette.accent}
                style={styles.tipIcon}
              />
              <Text style={styles.aiTipText}>
                {UI_STRINGS.COURSE_DETAIL.NO_INFO}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Connected Transit Card */}
      {hasTransport && (
        <View style={styles.transitCardWrapper}>
          <View style={styles.transitCard} testID='transit-card'>
            {/* Transit Header */}
            <View style={styles.transitHeader}>
              <View style={styles.transitTitleGroup}>
                <Ionicons
                  name={getTransportIcon(transport?.type || 'walking')}
                  size={16}
                  color={palette.deepNavy}
                />
                <Text style={styles.transitTitleText}>
                  {formatTransportLabel(
                    transport?.type || 'walking',
                    transport?.minutes,
                  )}
                </Text>
              </View>
              {/* 교통비 배지 */}
              <View style={styles.mintBadge}>
                <Text style={styles.mintBadgeText}>
                  {formatTransitCostBadge(
                    transport?.type || 'walking',
                    transport?.cost,
                  )}
                </Text>
              </View>
            </View>

            {/* Route Visual Line */}
            <View style={styles.routeVisualRow}>
              <View style={styles.routeDot} />
              <View style={styles.routeLine} />
              <Ionicons
                name={getRouteVisualIcon(transport?.type || 'walking')}
                size={12}
                color={palette.primary}
              />
              <View style={styles.routeLine} />
              <View style={styles.routeDot} />
            </View>

            {/* 이동 방법 상세 팁 */}
            <View style={styles.aiTipBox}>
              <View style={styles.tipRow}>
                <Ionicons
                  name='bulb-outline'
                  size={14}
                  color={palette.accent}
                  style={styles.tipIcon}
                />
                <Text style={styles.aiTipText}>
                  {transport?.memo && transport.memo.trim() !== ''
                    ? transport.memo.trim()
                    : UI_STRINGS.COURSE_DETAIL.RECOMMENDED_ROUTE_TIP}
                </Text>
              </View>
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
    gap: 8,
  },
  placeTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeNameText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: palette.deepNavy, // #0D2137
  },
  mintBadge: {
    flexShrink: 0,
    backgroundColor: palette.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  mintBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.accent,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrivalTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.primary,
  },
  dividerDot: {
    width: 1,
    height: 12,
    backgroundColor: palette.gray200,
  },
  stayMinutesText: {
    fontSize: 13,
    fontWeight: '400',
    color: palette.subText,
  },
  aiTipBox: {
    backgroundColor: palette.softMint,
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  tipRow: {
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
  tipLabelText: {
    fontWeight: '700',
    color: palette.deepNavy,
  },
  tipDivider: {
    height: 1,
    backgroundColor: 'rgba(13, 33, 55, 0.08)',
    marginVertical: 1,
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
    backgroundColor: palette.gray200,
  },
});
