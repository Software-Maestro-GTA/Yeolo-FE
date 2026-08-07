/**
 * @file PlaceDetailScreen.tsx
 * @description Screen for displaying detailed place information, AI tips, opening hours, and location.
 * @requirements REQ-9
 * @functional FUN-3, FUN-GA4
 * @author Antigravity Agent
 */
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ItineraryStop } from '@yeolo/common';
import { OpeningHoursModal } from '../components/place';
import { CourseMiniMapView } from '../components/course';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface PlaceDetailScreenProps {
  stop?: ItineraryStop;
  placeName?: string;
  category?: string;
  address?: string;
  rating?: string;
  arrivalTime?: string;
  stayMinutes?: number;
  cost?: number;
  aiTip?: string;
  openingHours?: string;
  latitude?: number;
  longitude?: number;
  heroImageUrl?: string;
}

const DEFAULT_PLACE_IMAGE = 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1000&q=80';

export function PlaceDetailScreen({
  stop,
  placeName,
  category,
  address,
  rating,
  arrivalTime,
  stayMinutes,
  cost,
  aiTip,
  openingHours,
  latitude = 35.6605,
  longitude = 139.7292,
  heroImageUrl = DEFAULT_PLACE_IMAGE,
}: PlaceDetailScreenProps) {
  useGA4ScreenTracking('PlaceDetailScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);

  const displayPlaceName = placeName || stop?.placeName || UI_STRINGS.PLACE_DETAIL.DEFAULT_NAME;
  const displayCategory = category || stop?.category || UI_STRINGS.PLACE_DETAIL.DEFAULT_CATEGORY;
  const displayRating = rating || UI_STRINGS.PLACE_DETAIL.DEFAULT_RATING;
  const displayAddress = address || UI_STRINGS.PLACE_DETAIL.DEFAULT_ADDRESS;
  const displayTime = arrivalTime || stop?.arrivalTime || UI_STRINGS.PLACE_DETAIL.DEFAULT_TIME;
  const displayStay = stayMinutes
    ? `${stayMinutes}분 소요`
    : stop?.stayMinutes
    ? `${stop.stayMinutes}분 소요`
    : UI_STRINGS.PLACE_DETAIL.DEFAULT_STAY;
  const displayCost = cost !== undefined
    ? `₩${cost.toLocaleString()}`
    : stop?.cost !== undefined
    ? `₩${stop.cost.toLocaleString()}`
    : UI_STRINGS.PLACE_DETAIL.DEFAULT_COST;
  const displayAiTip = aiTip || stop?.reason || stop?.memo || UI_STRINGS.PLACE_DETAIL.AI_RECOMMEND_DESC;
  const displayOpeningHours = openingHours || UI_STRINGS.PLACE_DETAIL.OPENING_HOURS;

  const mockMapCoordinates = [
    {
      placeName: displayPlaceName,
      latitude,
      longitude,
    },
  ];

  return (
    <View style={styles.screenContainer} testID="place-detail-screen">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Hero Photo Container Header (Extends into Status Bar) */}
        <View style={styles.heroSection}>
          <ImageBackground
            source={{ uri: heroImageUrl }}
            style={styles.heroImageBackground}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(245, 250, 248, 0)', 'rgba(245, 250, 248, 0.35)', 'rgba(245, 250, 248, 0.95)', palette.softMint]}
              locations={[0, 0.4, 0.8, 1]}
              style={styles.heroGradient}
            />

            {/* Place Title & Tags Group */}
            <View style={styles.heroContentGroup}>
              <View style={styles.placeTitleRow}>
                <Text style={styles.placeTitleText}>{displayPlaceName}</Text>
                <View style={styles.tagRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{displayCategory}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#F97316" />
                    <Text style={styles.ratingBadgeText}>{displayRating}</Text>
                  </View>
                </View>
              </View>

              {/* Address Row */}
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color={palette.subText} />
                <Text style={styles.addressText}>{displayAddress}</Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Main Body (Node 423:561) */}
        <View style={styles.mainBody}>
          {/* Summary Metric 3-Column Card */}
          <View style={styles.summaryBarCard} testID="summary-bar-card">
            <View style={styles.metricColumn}>
              <Ionicons name="time-outline" size={20} color={palette.subText} />
              <Text style={styles.metricTimeText}>{displayTime}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.metricColumn}>
              <Ionicons name="timer-outline" size={20} color={palette.subText} />
              <Text style={styles.metricStayText}>{displayStay}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.metricColumn}>
              <Ionicons name="ticket-outline" size={20} color={palette.accent} />
              <Text style={styles.metricCostText}>{displayCost}</Text>
            </View>
          </View>

          {/* Opening Hours Section */}
          <View style={styles.sectionContainer} testID="opening-hours-section">
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="time-outline" size={18} color={palette.deepNavy} />
              <Text style={styles.sectionTitleText}>
                {UI_STRINGS.PLACE_DETAIL.BUSINESS_HOURS_TITLE}
              </Text>
            </View>

            <View style={styles.hoursContentRow}>
              <View style={styles.hoursStatusGroup}>
                <Text style={styles.openStatusText}>
                  {UI_STRINGS.PLACE_DETAIL.OPENING_STATUS}
                </Text>
                <Text style={styles.statusDot}>·</Text>
                <Text style={styles.hoursValueText}>{displayOpeningHours}</Text>
              </View>
              <TouchableOpacity
                testID="btn-more-hours"
                onPress={() => {
                  trackButtonClick('btn_open_hours_modal', 'Open Opening Hours Modal');
                  setIsHoursModalOpen(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.moreButtonText}>
                  {UI_STRINGS.PLACE_DETAIL.MORE_BUTTON}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* AI Recommendation Card */}
          <View style={styles.aiRecommendCard} testID="ai-recommend-card">
            <View style={styles.aiRecommendHeader}>
              <Ionicons name="sparkles" size={18} color={palette.accent} />
              <Text style={styles.aiRecommendTitle}>
                {UI_STRINGS.PLACE_DETAIL.AI_RECOMMEND_TITLE}
              </Text>
            </View>
            <Text style={styles.aiRecommendDesc}>{displayAiTip}</Text>
          </View>

          {/* Location Section */}
          <View style={styles.sectionContainer} testID="location-section">
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="map-outline" size={18} color={palette.deepNavy} />
              <Text style={styles.sectionTitleText}>
                {UI_STRINGS.PLACE_DETAIL.LOCATION_TITLE}
              </Text>
            </View>

            <CourseMiniMapView
              stopCoordinates={mockMapCoordinates}
              mapRegion={{
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              leafletHtml=""
            />

            <View style={styles.gpsRow}>
              <Ionicons name="information-circle-outline" size={14} color={palette.subText} />
              <Text style={styles.gpsText}>
                {`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Weekly Opening Hours Modal */}
      <OpeningHoursModal
        visible={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
      />
    </View>
  );
}

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: palette.softMint, // #F5FAF8
  },
  scrollContentContainer: {
    paddingTop: 0,
    paddingBottom: 76,
  },
  heroSection: {
    height: 280,
    backgroundColor: '#D1E5E0',
  },
  heroImageBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT + 12,
    paddingBottom: 16,
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
  },
  heroContentGroup: {
    gap: 8,
    zIndex: 2,
  },
  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeTitleText: {
    fontSize: 24,
    fontWeight: '900',
    color: palette.deepNavy, // #0D2137
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: '#E0F7F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.accent,
  },
  ratingBadge: {
    backgroundColor: '#FFF7ED',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F97316',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '400',
    color: palette.subText,
    flex: 1,
  },
  mainBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 20,
  },
  summaryBarCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cardDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#EBEDF2',
  },
  metricTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.primary, // #2D7DD2
  },
  metricStayText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.deepNavy,
  },
  metricCostText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.accent, // #00C9A7
  },
  sectionContainer: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  hoursContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  hoursStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.accent, // #00C9A7
  },
  statusDot: {
    fontSize: 14,
    color: palette.subText,
  },
  hoursValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.deepNavy,
  },
  moreButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.subText,
  },
  aiRecommendCard: {
    backgroundColor: palette.softMint,
    borderWidth: 1,
    borderColor: '#E0E8E5',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  aiRecommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiRecommendTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  aiRecommendDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: palette.subText,
    lineHeight: 20,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  gpsText: {
    fontSize: 12,
    fontWeight: '400',
    color: palette.subText,
  },
});
