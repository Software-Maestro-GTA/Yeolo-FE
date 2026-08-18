/**
 * @file PlaceDetailScreen.tsx
 * @description Screen for displaying detailed place information (API-PLACE-1) combined with itinerary stop details.
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { ItineraryStop } from '@yeolo/common';
import { isValidCoordinate } from '@yeolo/common';
import { OpeningHoursModal } from '../components/place';
import { CourseMiniMapView } from '../components/course';
import { usePlaceDetailQuery } from '../hooks/queries';
import { palette, hexToRgba } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import { getDestinationImageUrl } from '../services';
import { useBackground } from '../context';

export interface PlaceDetailScreenProps {
  stop?: ItineraryStop;
}

export function PlaceDetailScreen({ stop }: PlaceDetailScreenProps) {
  useGA4ScreenTracking('PlaceDetailScreen');
  const { trackButtonClick } = useGA4ButtonClick();
  const { setBackground, resetBackground } = useBackground();
  const insets = useSafeAreaInsets();
  const topPadding = (insets.top || StatusBar.currentHeight || 24) + 12;

  React.useEffect(() => {
    setBackground({ noTopEdges: true });
    return () => {
      resetBackground();
    };
  }, [setBackground, resetBackground]);

  const targetPlaceId = stop?.place?.placeId;
  const { data: placeDetail } = usePlaceDetailQuery({
    placeId: targetPlaceId,
  });

  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);

  const displayPlaceName =
    placeDetail?.placeName || stop?.place?.placeName || '';
  const displayPlaceEngName = placeDetail?.placeEngName || '';
  const displayCategory = placeDetail?.category || stop?.place?.category || '';
  const displayRating =
    placeDetail?.rating !== undefined && placeDetail?.rating !== null
      ? String(placeDetail.rating)
      : '';
  const displayAddress = placeDetail?.address || '';

  const currentDayIdx = new Date().getDay();
  const currentFullDay = UI_STRINGS.PLACE_DETAIL.WEEKDAYS[currentDayIdx];
  const currentShortDay = UI_STRINGS.PLACE_DETAIL.SHORT_WEEKDAYS[currentDayIdx];

  const todayOpeningHours = placeDetail?.openingHours?.find((str) => {
    if (!str) return false;
    const trimmed = str.trim();
    return (
      trimmed.includes(currentFullDay) || trimmed.startsWith(currentShortDay)
    );
  });

  const displayOpeningHours =
    todayOpeningHours ||
    (placeDetail?.openingHours && placeDetail.openingHours.length > 0
      ? placeDetail.openingHours[0]
      : '');

  const rawLat = placeDetail?.latitude ?? stop?.place?.latitude;
  const rawLng = placeDetail?.longitude ?? stop?.place?.longitude;
  const hasValidLocation = isValidCoordinate({
    latitude: rawLat,
    longitude: rawLng,
  });

  const displayLatitude = hasValidLocation ? (rawLat as number) : 0;
  const displayLongitude = hasValidLocation ? (rawLng as number) : 0;
  const displayHeroImageUrl =
    placeDetail?.photoUrl || getDestinationImageUrl('', displayPlaceName);

  // 코스 확인 창에서 보여준 정보 (일정 정보 종합)
  const displayTime = stop?.arrivalTime || '';
  const displayStay = stop?.stayMinutes ? `${stop.stayMinutes}분 소요` : '';
  const displayCost =
    stop?.transportToNext?.cost !== undefined &&
    stop?.transportToNext?.cost !== null
      ? `₩${stop.transportToNext.cost.toLocaleString()}`
      : '';
  const hasReason = Boolean(stop?.reason && stop.reason.trim() !== '');
  const hasMemo = Boolean(
    stop?.memo &&
    stop.memo.trim() !== '' &&
    stop.memo.trim() !== stop?.reason?.trim(),
  );

  const mockMapCoordinates = hasValidLocation
    ? [
        {
          placeName: displayPlaceName,
          latitude: displayLatitude,
          longitude: displayLongitude,
        },
      ]
    : [];

  const parsedHoursData = placeDetail?.openingHours?.map((str) => {
    if (!str) return { day: '', hours: '' };
    // '월요일 09:00 - 18:00' 또는 '월요일: 09:00 - 18:00' 형태 유연하게 정규식 파싱
    const match = str.match(/^([가-힣a-zA-Z]+)(?:\s*:?\s*)(.*)$/);
    if (match) {
      return { day: match[1].trim(), hours: match[2].trim() };
    }
    const colonIdx = str.indexOf(':');
    if (colonIdx !== -1) {
      return {
        day: str.substring(0, colonIdx).trim(),
        hours: str.substring(colonIdx + 1).trim(),
      };
    }
    return { day: str, hours: '' };
  });

  const hasEngName = Boolean(
    displayPlaceEngName &&
    displayPlaceEngName.trim() !== '' &&
    displayPlaceEngName.trim().toLowerCase() !==
      displayPlaceName.trim().toLowerCase(),
  );

  return (
    <View style={styles.screenContainer} testID='place-detail-screen'>
      <StatusBar
        barStyle='dark-content'
        backgroundColor='transparent'
        translucent
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}>
        {/* Hero Photo Container Header (Extends into Status Bar) */}
        <View style={styles.heroSection}>
          <ImageBackground
            source={{ uri: displayHeroImageUrl }}
            style={styles.heroImageBackground}
            resizeMode='cover'>
            <LinearGradient
              colors={[
                hexToRgba(palette.softMint, 0),
                hexToRgba(palette.softMint, 0.35),
                hexToRgba(palette.softMint, 0.95),
                palette.softMint,
              ]}
              locations={[0, 0.4, 0.8, 1]}
              style={styles.heroGradient}
            />

            {/* Place Title & Tags Group */}
            <View style={[styles.heroContentGroup, { paddingTop: topPadding }]}>
              <View style={styles.placeTitleRow}>
                <View style={styles.titleTextContainer}>
                  <Text style={styles.placeTitleText}>{displayPlaceName}</Text>
                  {hasEngName && (
                    <Text style={styles.placeEngTitleText}>
                      {displayPlaceEngName}
                    </Text>
                  )}
                </View>
                <View style={styles.tagRow}>
                  {Boolean(displayCategory) && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {displayCategory}
                      </Text>
                    </View>
                  )}
                  {Boolean(displayRating) && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name='star' size={12} color={palette.warning} />
                      <Text style={styles.ratingBadgeText}>
                        {displayRating}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Address Row */}
              {Boolean(displayAddress) && (
                <View style={styles.addressRow}>
                  <Ionicons
                    name='location-outline'
                    size={14}
                    color={palette.subText}
                  />
                  <Text style={styles.addressText}>{displayAddress}</Text>
                </View>
              )}
            </View>
          </ImageBackground>
        </View>

        {/* Main Body (Node 423:561) */}
        <View style={styles.mainBody}>
          {/* Summary Metric 3-Column Card */}
          <View style={styles.summaryBarCard} testID='summary-bar-card'>
            <View style={styles.metricColumn}>
              <Ionicons name='time-outline' size={20} color={palette.subText} />
              <Text style={styles.metricTimeText}>{displayTime}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.metricColumn}>
              <Ionicons
                name='timer-outline'
                size={20}
                color={palette.subText}
              />
              <Text style={styles.metricStayText}>{displayStay}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.metricColumn}>
              <Ionicons
                name='ticket-outline'
                size={20}
                color={palette.accent}
              />
              <Text style={styles.metricCostText}>{displayCost}</Text>
            </View>
          </View>

          {/* Opening Hours Section */}
          <View style={styles.sectionContainer} testID='opening-hours-section'>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name='time-outline'
                size={18}
                color={palette.deepNavy}
              />
              <Text style={styles.sectionTitleText}>
                {UI_STRINGS.PLACE_DETAIL.BUSINESS_HOURS_TITLE}
              </Text>
            </View>

            <View style={styles.hoursContentRow}>
              <Text style={styles.hoursValueText}>
                {displayOpeningHours || UI_STRINGS.COURSE_DETAIL.NO_INFO}
              </Text>
              {placeDetail?.openingHours &&
                placeDetail.openingHours.length > 1 && (
                  <TouchableOpacity
                    testID='btn-more-hours'
                    onPress={() => {
                      trackButtonClick(
                        'btn_open_hours_modal',
                        'Open Opening Hours Modal',
                      );
                      setIsHoursModalOpen(true);
                    }}
                    activeOpacity={0.7}>
                    <Text style={styles.moreButtonText}>
                      {UI_STRINGS.PLACE_DETAIL.MORE_BUTTON}
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
          </View>

          {/* AI Recommendation Card */}
          <View style={styles.aiRecommendCard} testID='ai-recommend-card'>
            <View style={styles.aiRecommendHeader}>
              <Ionicons name='sparkles' size={18} color={palette.accent} />
              <Text style={styles.aiRecommendTitle}>
                {UI_STRINGS.PLACE_DETAIL.AI_RECOMMEND_TITLE}
              </Text>
            </View>

            {hasReason && (
              <View style={styles.tipRow}>
                <Ionicons
                  name='bulb-outline'
                  size={14}
                  color={palette.accent}
                  style={styles.tipIcon}
                />
                <Text style={styles.aiRecommendDesc}>
                  {stop?.reason?.trim()}
                </Text>
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
                <Text style={styles.aiRecommendDesc}>{stop?.memo?.trim()}</Text>
              </View>
            )}

            {!hasReason && !hasMemo && (
              <Text style={styles.aiRecommendDesc}>
                {UI_STRINGS.COURSE_DETAIL.NO_INFO}
              </Text>
            )}
          </View>

          {/* Location Section */}
          <View style={styles.sectionContainer} testID='location-section'>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name='map-outline' size={18} color={palette.deepNavy} />
              <Text style={styles.sectionTitleText}>
                {UI_STRINGS.PLACE_DETAIL.LOCATION_TITLE}
              </Text>
            </View>

            <CourseMiniMapView
              interactive={false}
              stopCoordinates={mockMapCoordinates}
              mapRegion={
                hasValidLocation
                  ? {
                      latitude: displayLatitude,
                      longitude: displayLongitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }
                  : undefined
              }
            />

            {hasValidLocation && (
              <View style={styles.gpsRow}>
                <Ionicons
                  name='information-circle-outline'
                  size={14}
                  color={palette.subText}
                />
                <Text style={styles.gpsText}>
                  {`GPS: ${displayLatitude.toFixed(4)}, ${displayLongitude.toFixed(4)}`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Weekly Opening Hours Modal */}
      <OpeningHoursModal
        visible={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
        hoursData={parsedHoursData}
      />
    </View>
  );
}

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: palette.softMint,
  },
  scrollContentContainer: {
    paddingTop: 0,
    paddingBottom: 24,
  },
  heroSection: {
    height: 280,
    backgroundColor: palette.lightTeal,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleTextContainer: {
    flex: 1,
    gap: 2,
  },
  placeTitleText: {
    fontSize: 24,
    fontWeight: '900',
    color: palette.deepNavy,
  },
  placeEngTitleText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.subText,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: palette.lightTeal,
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
    backgroundColor: hexToRgba(palette.warning, 0.15),
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
    color: palette.warning,
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
    backgroundColor: palette.gray200,
  },
  metricTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.primary,
  },
  metricStayText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.deepNavy,
  },
  metricCostText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.accent,
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
    color: palette.accent,
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
    borderColor: palette.lightTeal,
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
    flex: 1,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  tipIcon: {
    marginTop: 3,
  },
  tipLabelText: {
    fontWeight: '700',
    color: palette.deepNavy,
  },
  tipDivider: {
    height: 1,
    backgroundColor: 'rgba(13, 33, 55, 0.08)',
    marginVertical: 2,
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
