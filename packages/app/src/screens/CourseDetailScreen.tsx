/**
 * @file CourseDetailScreen.tsx
 * @description Screen component for rendering recommended travel course details integrated with courseService and subcomponents (FUN-3, REQ-9).
 * @requirements REQ-9, REQ-22
 * @functional FUN-3, FUN-GA4
 * @api API-FB-7
 * @author Antigravity Agent
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
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ItineraryStop,
} from '@yeolo/common';
import {
  CourseDetailHeader,
  CourseMiniMapView,
  CourseDayTabs,
  ItineraryTimelineItem,
} from '../components/course';
import { useCourseDetailQuery } from '../hooks/queries';
import { processCourseStopsMapData, ProcessedCourseMapData } from '../services';
import { theme } from '../theme';
import { UI_STRINGS, APP_CONFIG } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface CourseDetailScreenProps {
  courseId: string;
}

export function CourseDetailScreen({ courseId }: CourseDetailScreenProps) {
  useGA4ScreenTracking('CourseDetailScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const { data: course, isLoading, error, refetch } = useCourseDetailQuery({
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

  const currentDayData = course?.itinerary?.days?.find((d) => d.day === selectedDay);

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

      // Delegate geocoding and map region calculation to courseService
      const processed = await processCourseStopsMapData(currentDayData.stops, course?.destinationCity);
      if (isMounted) {
        setMapData(processed);
      }
    };

    loadMapCoordinatesData();
    return () => {
      isMounted = false;
    };
  }, [currentDayData, course?.destinationCity]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{UI_STRINGS.COMMON.LOADING}</Text>
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{UI_STRINGS.COURSE_DETAIL.ERROR_TITLE}</Text>
        {error && <Text style={styles.errorSubText}>{error.message}</Text>}
        <TouchableOpacity
          testID="retry-button"
          style={styles.retryButton}
          onPress={() => {
            trackButtonClick('btn_course_detail_retry', 'Retry Fetch Course Detail');
            refetch();
          }}
        >
          <Text style={styles.retryButtonText}>{UI_STRINGS.COURSE_DETAIL.RETRY_BUTTON}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const calculatedTotalCost = course.totalCost || course.itinerary?.days?.reduce((acc, d) => {
    return acc + (d.stops?.reduce((sAcc, s) => sAcc + (s.cost || 0), 0) || 0);
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} scrollEnabled={!isMapInteracting}>
        {/* Header Section Component */}
        <CourseDetailHeader
          destinationCountry={course.destinationCountry}
          destinationCity={course.destinationCity}
          startDate={course.startDate}
          title={course.title}
          totalCost={calculatedTotalCost}
        />

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
            trackButtonClick('btn_course_detail_day_tab', `Select Day ${day}`, { day });
            setSelectedDay(day);
          }}
        />

        {/* Timeline Itinerary Items Stream */}
        <View style={styles.timelineSection}>
          {currentDayData?.stops && currentDayData.stops.length > 0 ? (
            currentDayData.stops.map((stop: ItineraryStop, index: number) => (
              <ItineraryTimelineItem
                key={stop.sequence || index}
                stop={stop}
                isLast={index === currentDayData.stops.length - 1}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{UI_STRINGS.COURSE_DETAIL.EMPTY_SCHEDULE}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.screen,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.bg.screen,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.text.subtle,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.status.error,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 13,
    color: theme.colors.text.subtle,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  timelineSection: {
    width: '100%',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.muted,
  },
});
