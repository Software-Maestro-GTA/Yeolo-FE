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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ItineraryStop } from '@yeolo/common';
import {
  CourseDetailHeader,
  CourseMiniMapView,
  CourseDayTabs,
  ItineraryTimelineItem,
} from '../components/course';
import { useCourseDetailQuery } from '../hooks/queries';
import { processCourseStopsMapData, ProcessedCourseMapData } from '../services';
import { palette } from '../theme/colors';
import { UI_STRINGS, APP_CONFIG } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface CourseDetailScreenProps {
  courseId: string;
  onSelectPlace?: (stop: ItineraryStop) => void;
}

export function CourseDetailScreen({
  courseId,
  onSelectPlace,
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
        <Text style={styles.errorText}>코스 정보를 불러오지 못했습니다.</Text>
        {error && <Text style={styles.errorSubText}>{error.message}</Text>}
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
          <Text style={styles.retryButtonText}>다시 시도하기</Text>
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
          onBack={() =>
            trackButtonClick('btn_course_detail_back', 'Back Button Click')
          }
          onShare={() =>
            trackButtonClick('btn_course_detail_share', 'Share Course Click')
          }
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
            <LinearGradient
              colors={['rgba(45,125,210,0.9)', 'rgba(30,95,166,0.9)']}
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
            <LinearGradient
              colors={['rgba(0,201,167,0.9)', 'rgba(13,115,97,0.9)']}
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
    backgroundColor: palette.softMint, // #F5FAF8
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
    color: '#EF4444',
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
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContentContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 76,
  },
  mainContentBody: {
    paddingHorizontal: 20,
    gap: 16,
  },
  ctaBanner: {
    width: '100%',
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
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
    gap: 4,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bannerSubTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  bannerCtaBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  bannerCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    padding: 18,
    borderRadius: 16,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.deepNavy,
  },
});
