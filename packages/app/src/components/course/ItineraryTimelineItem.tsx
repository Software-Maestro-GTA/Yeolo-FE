/**
 * @file ItineraryTimelineItem.tsx
 * @description UI v3 일정·교통 정보를 표시하고 Google Place ID로 장소 지도와 확인 불가 구간의 길찾기를 엽니다.
 */
import SequenceCircleSvg from '../../../assets/images/figma-course/sequence-circle.svg';
import PlaceExpandSvg from '../../../assets/images/figma-course/place-expand.svg';
import WalkingSvg from '../../../assets/images/figma-course/walking.svg';
import BusSvg from '../../../assets/images/figma-course/bus.svg';
import { Text } from '../common/Typography';
import React from 'react';
import {
  Image,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getPlaceCategoryLabel,
  type ItineraryStop,
  type ItineraryPlace,
} from '@yeolo/common';
import { palette } from '../../theme/colors';
import { UI_STRINGS } from '../../constants';
import { COURSE_UI } from '../../constants/courseUiStrings';
import { FigmaAsset } from '../common/FigmaAsset';

export interface ItineraryTimelineItemProps {
  stop: ItineraryStop;
  nextPlace?: ItineraryPlace;
  isLast: boolean;
}

/** Displays one real itinerary stop and its onward journey, without fabricating arrival times or fees. */
export const ItineraryTimelineItem: React.FC<ItineraryTimelineItemProps> = ({
  stop,
  nextPlace,
  isLast,
}) => {
  const place = stop.place;
  const displayCategory = getPlaceCategoryLabel(place?.category);
  const transport = stop.transportToNext;
  const reason = stop.reason?.trim();
  const memo = stop.memo?.trim();
  const distinctMemo = Boolean(memo && memo !== reason);
  const unknownTransport = transport?.type === 'unknown';
  const hasTransport =
    !isLast &&
    transport &&
    transport.type !== 'none' &&
    (unknownTransport || transport.minutes == null || transport.minutes > 0);
  const transportCost =
    transport?.type === 'walking'
      ? UI_STRINGS.COURSE_DETAIL.FREE_WALKING
      : transport?.cost && transport.cost > 0
        ? `₩${transport.cost.toLocaleString()}`
        : UI_STRINGS.COURSE_DETAIL.SEPARATE_TRANSIT_COST;
  const openMap = () => {
    const placeId = place?.placeId?.trim();
    const query = place?.placeName?.trim() || placeId;
    if (!query) {
      Alert.alert(COURSE_UI.MAP_ERROR);
      return;
    }
    const placeIdParam = placeId
      ? `&query_place_id=${encodeURIComponent(placeId)}`
      : '';
    void Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}${placeIdParam}`,
    ).catch(() => Alert.alert(COURSE_UI.MAP_ERROR));
  };
  const originId = place?.placeId?.trim();
  const destinationId = nextPlace?.placeId?.trim();
  const origin = place?.placeName?.trim() || originId;
  const destination = nextPlace?.placeName?.trim() || destinationId;
  const openDirections = () => {
    if (!origin || !destination) return;
    const params = [
      'api=1',
      `origin=${encodeURIComponent(origin)}`,
      `destination=${encodeURIComponent(destination)}`,
    ];
    if (originId)
      params.push(`origin_place_id=${encodeURIComponent(originId)}`);
    if (destinationId)
      params.push(`destination_place_id=${encodeURIComponent(destinationId)}`);
    void Linking.openURL(
      `https://www.google.com/maps/dir/?${params.join('&')}`,
    ).catch(() => Alert.alert(COURSE_UI.MAP_ERROR));
  };
  return (
    <View style={styles.wrapper}>
      <View style={styles.placeCard} testID='place-card'>
        <View style={styles.titleRow}>
          <Pressable
            style={styles.placeTitle}
            accessibilityRole='link'
            accessibilityLabel={`${place?.placeName || COURSE_UI.UNKNOWN_PLACE}, ${COURSE_UI.MAP_OPEN}`}
            onPress={openMap}>
            <View style={styles.sequence}>
              <FigmaAsset
                source={SequenceCircleSvg}
                width={16}
                height={16}
                style={styles.sequenceCircle}
              />
              <Text style={styles.sequenceText}>{stop.sequence}</Text>
            </View>
            <Text style={styles.placeName}>
              {place?.placeName || COURSE_UI.UNKNOWN_PLACE}
            </Text>
            <FigmaAsset source={PlaceExpandSvg} width={14.5} height={14.5} />
          </Pressable>
          <Pressable
            accessibilityRole='link'
            accessibilityLabel={COURSE_UI.MAP_OPEN}
            testID={`map-link-${stop.sequence}`}
            style={styles.mapButton}
            onPress={openMap}>
            <Image
              source={require('../../../assets/images/figma-course/map-pin.png')}
              style={styles.mapIcon}
            />
          </Pressable>
        </View>
        <View style={styles.metadata}>
          {Boolean(displayCategory) && (
            <Text style={styles.metadataText}>{displayCategory}</Text>
          )}
          {Boolean(displayCategory) && <View style={styles.divider} />}
          <Text style={styles.metadataText}>
            {stop.stayMinutes}
            {COURSE_UI.MINUTES}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.metadataText}>
            {stop.cost == null
              ? UI_STRINGS.COURSE_DETAIL.NO_INFO
              : `₩${stop.cost.toLocaleString()}`}
          </Text>
        </View>
        <View style={styles.tips}>
          {Boolean(reason) && (
            <View style={styles.tip}>
              <Image
                source={require('../../../assets/images/figma-course/sparkles.png')}
                style={styles.reasonIcon}
              />
              <Text style={styles.tipText}>{reason}</Text>
            </View>
          )}
          {distinctMemo && (
            <View style={styles.tip}>
              <Image
                source={require('../../../assets/images/figma-course/tip.png')}
                style={styles.tipIcon}
              />
              <Text style={styles.tipText}>{memo}</Text>
            </View>
          )}
          {!reason && !distinctMemo && (
            <View style={styles.tip}>
              <Text style={styles.tipText}>
                {UI_STRINGS.COURSE_DETAIL.NO_INFO}
              </Text>
            </View>
          )}
        </View>
      </View>
      {hasTransport && (
        <View style={styles.transitCard} testID='transit-card'>
          {transport.type === 'unknown' ? (
            <>
              <View style={styles.metadata}>
                <Ionicons
                  name='help-circle-outline'
                  size={18}
                  color={palette.subText}
                />
                <Text style={styles.metadataText}>
                  {COURSE_UI.ROUTE_UNAVAILABLE}
                </Text>
              </View>
              {Boolean(origin && destination) && (
                <Pressable
                  accessibilityRole='link'
                  accessibilityLabel={COURSE_UI.DIRECTIONS_OPEN}
                  onPress={openDirections}
                  style={styles.directionsButton}>
                  <Text style={styles.directionsText}>
                    {COURSE_UI.DIRECTIONS_OPEN}
                  </Text>
                  <Ionicons
                    name='open-outline'
                    size={16}
                    color={palette.primary}
                  />
                </Pressable>
              )}
            </>
          ) : (
            <>
              <View style={styles.metadata}>
                {transport.type === 'walking' ? (
                  <FigmaAsset source={WalkingSvg} width={8} height={14} />
                ) : transport.type === 'transit' ? (
                  <FigmaAsset source={BusSvg} width={16} height={16} />
                ) : (
                  <Ionicons
                    name='car-outline'
                    size={16}
                    color={palette.subText}
                  />
                )}
                <Text style={styles.metadataText}>
                  {COURSE_UI.TRANSPORT[transport.type]}{' '}
                  {transport.minutes == null
                    ? ''
                    : `${transport.minutes}${UI_STRINGS.COURSE_DETAIL.MINUTES_SUFFIX}`}
                </Text>
                {transport.distance != null && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.metadataText}>
                      {Number((transport.distance / 1000).toFixed(1))}km
                    </Text>
                  </>
                )}
                {transport.cost != null && (
                  <Text style={styles.fare}>{transportCost}</Text>
                )}
              </View>
              <Text style={styles.transitMemo}>
                {transport.memo?.trim() ||
                  UI_STRINGS.COURSE_DETAIL.RECOMMENDED_ROUTE_TIP}
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { width: '100%', gap: 16, paddingBottom: 16 },
  placeCard: {
    backgroundColor: palette.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 24 },
  placeTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 24,
  },
  sequence: {
    width: 16,
    height: 16,
    borderRadius: 8,

    alignItems: 'center',
    justifyContent: 'center',
  },
  sequenceCircle: { position: 'absolute', top: 0, left: 0 },
  sequenceText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
    includeFontPadding: false,
  },
  placeName: {
    color: palette.deepNavy,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.6,
    flexShrink: 1,
  },
  mapButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapIcon: { width: 21, height: 21 },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 8,
  },
  metadataText: { fontSize: 14, color: palette.subText, letterSpacing: -0.6 },
  divider: { width: 1, height: 12, backgroundColor: palette.gray300 },
  tips: { marginTop: 12, gap: 8 },
  tip: {
    minHeight: 52,
    backgroundColor: palette.gray100,
    borderRadius: 6,
    padding: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  reasonIcon: { width: 17, height: 17, marginTop: 1 },
  tipIcon: { width: 19, height: 19, opacity: 0.4 },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: palette.deepNavy,
    lineHeight: 18,
    letterSpacing: -0.6,
  },
  transitCard: {
    backgroundColor: palette.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 44,
    gap: 6,
  },
  directionsText: { fontSize: 14, fontWeight: '600', color: palette.primary },
  transitMemo: {
    fontSize: 14,
    color: palette.deepNavy,
    lineHeight: 18,
    letterSpacing: -0.6,
  },
  fare: { fontSize: 12, color: palette.mutedText },
});
