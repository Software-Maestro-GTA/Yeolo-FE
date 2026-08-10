/**
 * @file CourseDetailScreen.tsx
 * @description Screen component for rendering recommended travel course details and timeline itinerary.
 */
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  Share,
  Alert,
  Platform,
  ToastAndroid,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { type ItineraryStop } from '@yeolo/common';
import {
  CourseDetailHeader,
  CourseMiniMapView,
  CourseDayTabs,
  ItineraryTimelineItem,
} from '../components/course';
import {
  useCourseDetailQuery,
  useCreateShareLinkMutation,
} from '../hooks/queries';
import { processCourseStopsMapData, ProcessedCourseMapData } from '../services';
import { palette, hexToRgba } from '../theme/colors';
import { UI_STRINGS, APP_CONFIG } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import ctaFlightBg from '../../assets/images/cta_flight_bg.png';
import ctaHotelBg from '../../assets/images/cta_hotel_bg.png';

export interface CourseDetailScreenProps {
  courseId: string;
  onSelectPlace?: (stop: ItineraryStop) => void;
  onBack?: () => void;
}

export function CourseDetailScreen({
  courseId,
  onSelectPlace,
  onBack,
}: CourseDetailScreenProps) {
  useGA4ScreenTracking('CourseDetailScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const {
    data: course,
    isLoading,
    error,
    refetch,
  } = useCourseDetailQuery({
    courseId,
  });

  const createShareLinkMutation = useCreateShareLinkMutation();

  const handleShareCourse = () => {
    trackButtonClick('btn_course_detail_share', 'Share Course Click');
    if (!courseId) return;

    createShareLinkMutation.mutate(courseId, {
      onSuccess: async (shareData) => {
        const shareMessage = `[여로] ${course?.title || '여행 코스'} 여행 일정을 공유합니다!`;

        try {
          await Share.share({
            message: shareMessage,
            url: shareData.shareUrl,
          });
        } catch (shareError) {
          Clipboard.setString(shareData.shareUrl);
          if (Platform.OS === 'android') {
            ToastAndroid.show(
              '공유 링크가 클립보드에 복사되었습니다.',
              ToastAndroid.SHORT,
            );
          } else {
            Alert.alert(
              '공유 링크 복사 완료',
              '공유 링크가 클립보드에 복사되었습니다.',
            );
          }
        }
      },
      onError: (err: any) => {
        Alert.alert(
          '공유 실패',
          err?.message || '공유 링크를 생성하지 못했습니다.',
        );
      },
    });
  };

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isMapInteracting, setIsMapInteracting] = useState<boolean>(false);
  const [mapData, setMapData] = useState<ProcessedCourseMapData>({
    coordinates: [],
    region: APP_CONFIG.DEFAULT_MAP_REGION,
    leafletHtml: '',
  });

  useEffect(() => {
    if (course?.itinerary?.days?.length) {
      setSelectedDay(course.itinerary.days[0].day);
    }
  }, [course]);

  const currentDayData = course?.itinerary?.days?.find(
    (d) => d.day === selectedDay,
  );

  useEffect(() => {
    let isMounted = true;
    const loadMapCoordinatesData = async () => {
      if (!currentDayData || !currentDayData.stops) {
        if (isMounted) {
          setMapData({
            coordinates: [],
            region: APP_CONFIG.DEFAULT_MAP_REGION,
            leafletHtml: '',
          });
        }
        return;
      }

      const processed = await processCourseStopsMapData(
        currentDayData.stops,
        course?.destinationCity,
      );
      if (isMounted) {
        setMapData(processed);
      }
    };

    loadMapCoordinatesData();
    return () => {
      isMounted = false;
    };
  }, [currentDayData, selectedDay, course?.destinationCity]);

  if (isLoading) {
    return (
      <View style={[styles.screenContainer, styles.centerContainer]}>
        <ActivityIndicator size='large' color={palette.primary} />
        <Text style={styles.loadingText}>코스 정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={[styles.screenContainer, styles.centerContainer]}>
        <Text style={styles.errorText}>
          {UI_STRINGS.COURSE_DETAIL.ERROR_TITLE}
        </Text>
        <Text style={styles.errorSubText}>
          {error?.message || '코스 정보를 불러오지 못했습니다.'}
        </Text>
        <TouchableOpacity
          testID='retry-button'
          style={styles.retryButton}
          onPress={() => {
            trackButtonClick(
              'btn_course_detail_retry',
              'Retry Fetch Course Detail',
            );
            refetch();
          }}
          activeOpacity={0.8}>
          <Text style={styles.retryButtonText}>
            {UI_STRINGS.COURSE_LIST.RETRY_BUTTON}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const calculatedTotalCost =
    course.totalCost ||
    course.itinerary?.days?.reduce((acc, d) => {
      return acc + (d.stops?.reduce((sAcc, s) => sAcc + (s.cost || 0), 0) || 0);
    }, 0);

  return (
    <View style={styles.screenContainer} testID='screen-container'>
      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        scrollEnabled={!isMapInteracting}
        showsVerticalScrollIndicator={false}>
        {/* Header Section Component */}
        <CourseDetailHeader
          destinationCountry={course.destinationCountry}
          destinationCity={course.destinationCity}
          startDate={course.startDate}
          title={course.title}
          totalCost={calculatedTotalCost}
          onBack={() => {
            trackButtonClick('btn_course_detail_back', 'Back Button Click');
            onBack?.();
          }}
          onShare={handleShareCourse}
        />

        {/* Main Content Body */}
        <View style={styles.mainContentBody}>
          {/* Mini Map View Component */}
          <CourseMiniMapView
            stopCoordinates={mapData.coordinates}
            mapRegion={mapData.region}
            leafletHtml={mapData.leafletHtml}
            onInteractionStart={() => setIsMapInteracting(true)}
            onInteractionEnd={() => setIsMapInteracting(false)}
          />

          {/* Day Selector Tabs Component */}
          <CourseDayTabs
            days={course.itinerary?.days}
            selectedDay={selectedDay}
            onSelectDay={(day) => {
              trackButtonClick(
                'btn_course_detail_day_tab',
                `Select Day ${day}`,
                { day },
              );
              setSelectedDay(day);
            }}
          />

          {/* Flight Booking Banner */}
          <TouchableOpacity
            style={styles.ctaBanner}
            activeOpacity={0.85}
            onPress={() =>
              trackButtonClick('btn_flight_cta', 'Click Flight Booking Banner')
            }>
            <ImageBackground
              source={ctaFlightBg}
              style={styles.bannerImageBg}
              resizeMode='cover'>
              <LinearGradient
                colors={[
                  hexToRgba(palette.primary, 0.85),
                  hexToRgba(palette.darkBlue, 0.85),
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bannerGradient}>
                <View style={styles.bannerLeft}>
                  <Text style={styles.bannerTitle}>
                    {UI_STRINGS.COURSE_DETAIL.FLIGHT_BANNER_TITLE}
                  </Text>
                  <Text style={styles.bannerSubTitle}>
                    {UI_STRINGS.COURSE_DETAIL.FLIGHT_BANNER_DESC}
                  </Text>
                </View>
                <View style={styles.bannerCtaBadge}>
                  <Text style={styles.bannerCtaText}>
                    {UI_STRINGS.COURSE_DETAIL.BOOK_NOW}
                  </Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>

          {/* Timeline Itinerary Items Stream */}
          <View style={styles.timelineSection} testID='timeline-section'>
            {currentDayData?.stops && currentDayData.stops.length > 0 ? (
              currentDayData.stops.map((stop: ItineraryStop, index: number) => (
                <ItineraryTimelineItem
                  key={stop.sequence || index}
                  stop={stop}
                  isLast={index === currentDayData.stops.length - 1}
                  onPressPlace={onSelectPlace}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  해당 일차의 일정이 존재하지 않습니다.
                </Text>
              </View>
            )}
          </View>

          {/* Hotel Booking Banner */}
          <TouchableOpacity
            style={styles.ctaBanner}
            activeOpacity={0.85}
            onPress={() =>
              trackButtonClick('btn_hotel_cta', 'Click Hotel Booking Banner')
            }>
            <ImageBackground
              source={ctaHotelBg}
              style={styles.bannerImageBg}
              resizeMode='cover'>
              <LinearGradient
                colors={[
                  hexToRgba(palette.accent, 0.85),
                  hexToRgba(palette.darkTeal, 0.85),
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bannerGradient}>
                <View style={styles.bannerLeft}>
                  <Text style={styles.bannerTitle}>
                    {UI_STRINGS.COURSE_DETAIL.HOTEL_BANNER_TITLE}
                  </Text>
                  <Text style={styles.bannerSubTitle}>
                    {UI_STRINGS.COURSE_DETAIL.HOTEL_BANNER_DESC}
                  </Text>
                </View>
                <View style={styles.bannerCtaBadge}>
                  <Text style={styles.bannerCtaText}>
                    {UI_STRINGS.COURSE_DETAIL.BOOK_NOW}
                  </Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>

          {/* Summary Section (총 예상 경비) */}
          <View style={styles.summarySection} testID='summary-section'>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                {UI_STRINGS.COURSE_DETAIL.TOTAL_BUDGET_LABEL}
              </Text>
              <Text style={styles.summaryValue}>
                ₩
                {calculatedTotalCost
                  ? calculatedTotalCost.toLocaleString()
                  : '78,000'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: palette.softMint,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: palette.subText,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.red500,
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 13,
    color: palette.subText,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: palette.white,
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContentContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 60,
  },
  mainContentBody: {
    paddingHorizontal: 20,
    gap: 16,
  },
  ctaBanner: {
    width: '100%',
    height: 136,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginVertical: 4,
  },
  bannerImageBg: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bannerLeft: {
    flex: 1,
    gap: 6,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.white,
  },
  bannerSubTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: hexToRgba(palette.white, 0.85),
  },
  bannerCtaBadge: {
    backgroundColor: hexToRgba(palette.white, 0.15),
    borderWidth: 1,
    borderColor: hexToRgba(palette.white, 0.4),
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 36,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.white,
  },
  timelineSection: {
    width: '100%',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: palette.subText,
  },
  summarySection: {
    width: '100%',
    marginVertical: 4,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    padding: 16,
    borderRadius: 12,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.subText,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.deepNavy,
  },
});
