/**
 * @file CourseDetailScreen.tsx
 * @description Screen component for rendering recommended travel course details matching Figma UI v1 (FUN-3, REQ-9).
 * @requirements REQ-9
 * @functional FUN-3
 * @api API-FB-7
 * @author Antigravity Agent
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { WebView } from 'react-native-webview';
import {
  getCourseDetailApi,
  CourseDetail,
  ItineraryStop,
  TransportType,
  geocodePlace,
  getAdjustedCoordinates,
  calculateRegion,
  getLeafletMapHtml,
  MapCoordinate,
} from '@yeolo/common';
import { BottomNavBar } from '../components/navigation/BottomNavBar';

interface CourseDetailScreenProps {
  courseId: string;
  initialCourse?: CourseDetail;
  onBack?: () => void;
}

export function CourseDetailScreen({ courseId, initialCourse, onBack }: CourseDetailScreenProps) {
  const [course, setCourse] = useState<CourseDetail | null>(initialCourse || null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(!initialCourse);
  const [error, setError] = useState<string | null>(null);
  const [isMapInteracting, setIsMapInteracting] = useState<boolean>(false);

  const [stopCoordinates, setStopCoordinates] = useState<MapCoordinate[]>([]);

  const mapRef = React.useRef<MapView | null>(null);

  const fetchCourseDetail = useCallback(async () => {
    if (initialCourse) {
      setCourse(initialCourse);
      if (initialCourse.itinerary?.days?.length > 0) {
        setSelectedDay(initialCourse.itinerary.days[0].day);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.yeolo.com';
      const token = (await AsyncStorage.getItem('accessToken')) || '';
      const data = await getCourseDetailApi(apiUrl, token, courseId);
      setCourse(data);
      if (data.itinerary?.days?.length > 0) {
        setSelectedDay(data.itinerary.days[0].day);
      }
    } catch (err: any) {
      setError(err?.message || '여행 코스 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, initialCourse]);

  useEffect(() => {
    fetchCourseDetail();
  }, [fetchCourseDetail]);

  const currentDayData = course?.itinerary?.days?.find((d) => d.day === selectedDay);

  useEffect(() => {
    let isMounted = true;
    const loadGeocodedCoordinates = async () => {
      if (!currentDayData || !currentDayData.stops) {
        if (isMounted) setStopCoordinates([]);
        return;
      }

      const city = course?.destinationCity || '';
      const rawStops = (
        await Promise.all(
          currentDayData.stops.map(async (stop) => {
            const coords = await geocodePlace(stop.placeName, city);
            if (!coords) return null;
            return {
              ...coords,
              placeName: stop.placeName,
              sequence: stop.sequence,
            };
          })
        )
      ).filter((item): item is NonNullable<typeof item> => item !== null);

      if (isMounted) {
        setStopCoordinates(getAdjustedCoordinates(rawStops));
      }
    };

    loadGeocodedCoordinates();
    return () => {
      isMounted = false;
    };
  }, [currentDayData, course?.destinationCity]);

  const mapRegion = calculateRegion(stopCoordinates);
  const leafletHtml = Platform.OS === 'android' ? getLeafletMapHtml(stopCoordinates) : '';

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
    const minutesText = `${minutes}분`;
    switch (transport) {
      case 'walking':
        return `도보 ${minutesText}`;
      case 'transit':
        return `대중교통 ${minutesText}`;
      case 'driving':
        return `차량 ${minutesText}`;
      case 'taxi':
        return `택시 ${minutesText}`;
      default:
        return `이동 ${minutesText}`;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f45e5" />
        <Text style={styles.loadingText}>여행 코스를 불러오는 중입니다...</Text>
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>여행 코스 정보를 불러오지 못했습니다.</Text>
        {error && <Text style={styles.errorSubText}>{error}</Text>}
        <TouchableOpacity
          testID="retry-button"
          style={styles.retryButton}
          onPress={fetchCourseDetail}
        >
          <Text style={styles.retryButtonText}>다시 시도</Text>
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
        {/* Header Section without background */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>{course.destinationCountry} {course.destinationCity}</Text>
          <Text style={styles.headerSubtitle}>
            {course.startDate}, {course.title}
          </Text>
        </View>

        <View style={styles.mainContent}>
          {/* Mini Map Section - Native (iOS) vs In-App WebView (Android) */}
          <View
            style={styles.miniMapSection}
            onTouchStart={() => setIsMapInteracting(true)}
            onTouchEnd={() => setIsMapInteracting(false)}
            onTouchCancel={() => setIsMapInteracting(false)}
          >
            {Platform.OS === 'ios' ? (
              <View style={styles.miniMapCard} testID="mini-map-card">
                <MapView
                  ref={mapRef}
                  testID="in-app-map-view"
                  style={styles.mapView}
                  region={mapRegion}
                  scrollEnabled={true}
                  zoomEnabled={true}
                >
                  {stopCoordinates.map((stop, idx) => (
                    <Marker
                      key={`${stop.placeName}-${idx}`}
                      coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                      title={`${idx + 1}. ${stop.placeName}`}
                    />
                  ))}
                  {stopCoordinates.length > 1 && (
                    <Polyline
                      coordinates={stopCoordinates.map((s) => ({
                        latitude: s.latitude,
                        longitude: s.longitude,
                      }))}
                      strokeColor="#4f45e5"
                      strokeWidth={4}
                    />
                  )}
                </MapView>
              </View>
            ) : (
              /* Android In-App WebView Card */
              <View style={styles.miniMapCard} testID="mini-map-webview-card">
                <WebView
                  testID="in-app-webview"
                  source={{ html: leafletHtml }}
                  style={styles.webView}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  nestedScrollEnabled={true}
                  overScrollMode="never"
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View style={styles.webViewLoading}>
                      <ActivityIndicator size="small" color="#4f45e5" />
                      <Text style={styles.webViewLoadingText}>지도 로딩 중...</Text>
                    </View>
                  )}
                />
              </View>
            )}
          </View>

          {/* Timeline Section & Day Selector */}
          <View style={styles.timelineSection}>
            {/* Horizontal Day Tabs */}
            {course.itinerary?.days && course.itinerary.days.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dayTabContainer}
              >
                {course.itinerary.days.map((dayItem) => {
                  const isSelected = dayItem.day === selectedDay;
                  return (
                    <TouchableOpacity
                      key={dayItem.day}
                      testID={`day-tab-${dayItem.day}`}
                      style={[styles.dayPill, isSelected && styles.dayPillSelected]}
                      onPress={() => setSelectedDay(dayItem.day)}
                    >
                      <Text style={[styles.dayPillText, isSelected && styles.dayPillTextSelected]}>
                        Day {dayItem.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            {/* Timeline Stream matching Figma UI v1 */}
            <View style={styles.timelineStream}>
              {currentDayData?.stops && currentDayData.stops.length > 0 ? (
                currentDayData.stops.map((stop: ItineraryStop, index: number) => {
                  const isLast = index === currentDayData.stops.length - 1;
                  const transportText = formatTransportText(stop.transportToNext, stop.travelMinutesToNext);

                  return (
                    <View key={stop.sequence || index} style={styles.timelineItemWrapper}>
                      <View style={styles.timelineItem}>
                        {/* Timeline Left Node Circle */}
                        <View style={styles.nodeCircle}>
                          <Ionicons
                            name={getCategoryIcon(stop.category)}
                            size={18}
                            color="#4648d4"
                          />
                        </View>

                        {/* Timeline Connecting Vertical Line */}
                        {!isLast && <View style={styles.verticalLine} />}

                        {/* Content Right Area */}
                        <View style={styles.itemContent}>
                          {/* Time & Cost Header */}
                          <View style={styles.itemHeader}>
                            <Text style={styles.arrivalTime}>{stop.arrivalTime || '시간 미정'}</Text>
                            <View style={styles.costBadge}>
                              <Text style={styles.costBadgeText}>
                                약 ₩{stop.cost !== undefined ? stop.cost.toLocaleString() : '0'}
                              </Text>
                            </View>
                          </View>

                          {/* Place Name */}
                          <Text style={styles.placeName}>{stop.placeName}</Text>

                          {/* Stay Minutes & Meta */}
                          {stop.stayMinutes ? (
                            <Text style={styles.stayMinutesText}>⏱️ {stop.stayMinutes}분 체류</Text>
                          ) : null}

                          {/* AI Tip / Recommendation Card */}
                          <View style={styles.aiTipCard}>
                            <Ionicons name="sparkles" size={16} color="#6063ee" style={styles.sparkleIcon} />
                            <View style={styles.aiTipContent}>
                              <Text style={styles.aiTipText}>
                                {stop.reason && stop.reason.trim() !== ''
                                  ? stop.reason
                                  : stop.memo && stop.memo.trim() !== ''
                                  ? stop.memo
                                  : '정보 없음'}
                              </Text>
                            </View>
                          </View>

                          {/* Transport Indicator to Next Stop */}
                          {transportText ? (
                            <View style={styles.transportRow}>
                              <Ionicons name="walk-outline" size={14} color="#76777c" />
                              <Text style={styles.transportText}>{transportText}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>해당 일자의 일정이 존재하지 않습니다.</Text>
                </View>
              )}
            </View>
          </View>

          {/* Summary Section (총 예상 경비 - Glassmorphism Card) */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>총 예상 경비</Text>
            <Text style={styles.summaryAmount}>₩{calculatedTotalCost?.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>
      <BottomNavBar currentTab="create" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaeef2',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eaeef2',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4f45e5',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: '#76777c',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4f45e5',
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  /* Header Section */
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
    gap: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#171c1f',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#45464c',
    fontWeight: '500',
    lineHeight: 20,
  },
  /* Main Container */
  mainContent: {
    padding: 20,
    gap: 20,
  },
  /* Mini Map Section */
  miniMapSection: {
    width: '100%',
  },
  miniMapCard: {
    height: 200,
    backgroundColor: '#f6fafe',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(198, 198, 204, 0.3)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  miniMapCardFallback: {
    height: 140,
    backgroundColor: '#f0f4ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  miniMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  miniMapFallbackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e1b4b',
  },
  miniMapFallbackBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a5b4fc',
  },
  miniMapFallbackBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338ca',
  },
  mapView: {
    width: '100%',
    height: '100%',
  },
  webView: {
    flex: 1,
    backgroundColor: '#transparent',
  },
  webViewLoading: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6fafe',
    gap: 8,
  },
  webViewLoadingText: {
    fontSize: 12,
    color: '#4f45e5',
    fontWeight: '600',
  },
  miniMapBadgeOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  miniMapBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  /* Timeline Section */
  timelineSection: {
    gap: 16,
  },
  daySelectorRow: {
    flexDirection: 'row',
  },
  dayTabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  dayPillSelected: {
    backgroundColor: '#4f45e5',
    borderColor: '#4f45e5',
  },
  dayPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#45464c',
  },
  dayPillTextSelected: {
    color: '#ffffff',
  },
  timelineStream: {
    paddingLeft: 4,
  },
  timelineItemWrapper: {
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
  },
  nodeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1e0ff',
    borderWidth: 2,
    borderColor: '#f6fafe',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 2,
  },
  verticalLine: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: -24,
    width: 2,
    backgroundColor: '#6063ee',
    zIndex: 1,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  arrivalTime: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4648d4',
    letterSpacing: 0.5,
  },
  costBadge: {
    backgroundColor: '#e4e9ed',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  costBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#45464c',
  },
  placeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a26',
  },
  stayMinutesText: {
    fontSize: 12,
    color: '#5b5d6b',
    fontWeight: '500',
  },
  aiTipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(246, 250, 254, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sparkleIcon: {
    marginTop: 2,
  },
  aiTipContent: {
    flex: 1,
  },
  aiTipText: {
    fontSize: 13,
    color: '#171c1f',
    lineHeight: 18,
    fontWeight: '500',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  transportText: {
    fontSize: 12,
    color: '#76777c',
    fontWeight: '500',
  },
  emptyBox: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#76777c',
  },
  /* Summary Section */
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(246, 250, 254, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 18,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171c1f',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4648d4',
  },
});
