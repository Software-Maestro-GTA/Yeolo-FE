/**
 * @file CourseDetailScreen.tsx
 * @description Renders course timelines with native scroll clipping, verified currency totals and safe booking/share actions.
 */
import BackSvg from '../../assets/images/figma-course/back.svg';
import ShareSvg from '../../assets/images/figma-course/share.svg';
import ReelSvg from '../../assets/images/figma-course/reel.svg';
import BookingShadeSvg from '../../assets/images/figma-course/booking-shade.svg';
import BookingArrowSvg from '../../assets/images/figma-course/booking-arrow.svg';
import TicketShadeSvg from '../../assets/images/figma-course/ticket-shade.svg';
import { Text } from '../components/common/Typography';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Image,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Share,
  Alert,
  Platform,
  ToastAndroid,
} from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import type { ItineraryStop, BookingKind } from '@yeolo/common';
import {
  CourseMiniMapView,
  CourseDayTabs,
  ItineraryTimelineItem,
} from '../components/course';
import {
  COURSE_MAP_EXPANDED_HEIGHT,
  COURSE_MAP_COMPACT_HEIGHT,
} from '../components/course/CourseMiniMapView';
import {
  useCourseDetailQuery,
  useCreateShareLinkMutation,
} from '../hooks/queries';
import { processCourseStopsMapData } from '../services';
import { palette } from '../theme/colors';
import { COURSE_UI } from '../constants/courseUiStrings';
import { FigmaAsset } from '../components/common/FigmaAsset';
import { UI_STRINGS, APP_CONFIG } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import {
  courseBookingContext,
  type OpenBooking,
} from '../services/bookingService';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { CourseReelComposer } from '../components/course/CourseReelComposer';

import { useBackground, AuthContext } from '../context';

type DetailRow =
  | { kind: 'intro' | 'controls' | 'date' }
  | { kind: 'stop'; stop: ItineraryStop; index: number };

export type CourseDetailViewState = {
  selectedDay: number;
  currencyMode: 'KRW' | 'LOCAL';
};

export interface CourseDetailScreenProps {
  courseId: string;
  onBack?: () => void;
  onOpenBooking?: OpenBooking;
  initialViewState?: CourseDetailViewState;
  onViewStateChange?: (state: CourseDetailViewState) => void;
}

/** Displays a course and restores the caller's day/currency selection when returning to it. */
export function CourseDetailScreen({
  courseId,
  onBack,
  onOpenBooking,
  initialViewState,
  onViewStateChange,
}: CourseDetailScreenProps) {
  useGA4ScreenTracking('CourseDetailScreen');
  const { trackButtonClick } = useGA4ButtonClick();
  const { setBackground, resetBackground } = useBackground();
  const insets = useSafeAreaInsets();
  const contentInsetStyles = React.useMemo(
    () =>
      StyleSheet.create({
        scrollContent: { paddingBottom: insets.bottom + 16 },
      }),
    [insets.bottom],
  );
  const auth = React.useContext(AuthContext);
  const recentCourseId = auth?.recentCourseId;
  const setRecentCourseId = auth?.setRecentCourseId;
  const detailList = React.useRef<FlatList<DetailRow>>(null);
  const scrollOffset = React.useRef(new Animated.Value(0)).current;
  const [introHeight, setIntroHeight] = useState(0);
  const [controlsDetailsHeight, setControlsDetailsHeight] = useState(0);
  // Move the fixed-size header on the UI thread. Clipping the upper map strip
  // avoids resizing native maps or racing scroll events against JS layout.
  const controlsTranslateY = React.useMemo(
    () =>
      scrollOffset.interpolate({
        inputRange: [
          0,
          introHeight + COURSE_MAP_EXPANDED_HEIGHT - COURSE_MAP_COMPACT_HEIGHT,
        ],
        outputRange: [
          0,
          -(
            introHeight +
            COURSE_MAP_EXPANDED_HEIGHT -
            COURSE_MAP_COMPACT_HEIGHT
          ),
        ],
        extrapolateRight: 'clamp',
      }),
    [scrollOffset, introHeight],
  );
  const controlsSpacerStyle = React.useMemo(
    () =>
      StyleSheet.create({
        spacer: {
          height:
            COURSE_MAP_EXPANDED_HEIGHT +
            controlsDetailsHeight +
            styles.controls.gap +
            styles.controls.paddingBottom,
        },
      }).spacer,
    [controlsDetailsHeight],
  );
  const cornersTranslateY = React.useMemo(
    () =>
      scrollOffset.interpolate({
        inputRange: [0, Math.max(introHeight, 1)],
        outputRange: [0, -introHeight],
        extrapolateRight: 'clamp',
      }),
    [scrollOffset, introHeight],
  );
  const [bookingCardWidth, setBookingCardWidth] = useState(165);
  const bookingShadeStyle = React.useMemo(
    () =>
      StyleSheet.create({
        shade: { transform: [{ scaleX: bookingCardWidth / 165 }] },
      }),
    [bookingCardWidth],
  );

  useEffect(() => {
    setBackground({ noTopEdges: true });
    return () => {
      resetBackground();
    };
  }, [setBackground, resetBackground]);

  useEffect(() => {
    if (courseId && courseId !== recentCourseId) {
      setRecentCourseId?.(courseId);
      AsyncStorage.setItem('recentCourseId', courseId).catch(() => {});
    }
  }, [courseId, recentCourseId, setRecentCourseId]);

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
        const inviteUrl = shareData.shareToken
          ? `${APP_CONFIG.INVITE_BASE_URL}/${shareData.shareToken}`
          : shareData.shareUrl;

        try {
          await Share.share(
            Platform.OS === 'ios' ? { url: inviteUrl } : { message: inviteUrl },
          );
        } catch (shareError) {
          Clipboard.setString(inviteUrl);
          if (Platform.OS === 'android') {
            ToastAndroid.show(
              UI_STRINGS.COURSE_DETAIL.SHARE_SUCCESS_TOAST,
              ToastAndroid.SHORT,
            );
          } else {
            Alert.alert(
              UI_STRINGS.COURSE_DETAIL.SHARE_SUCCESS_TITLE,
              UI_STRINGS.COURSE_DETAIL.SHARE_SUCCESS_TOAST,
            );
          }
        }
      },
      onError: (err: any) => {
        Alert.alert(
          UI_STRINGS.COURSE_DETAIL.SHARE_FAIL_TITLE,
          err?.message || UI_STRINGS.COURSE_DETAIL.SHARE_FAIL_DEFAULT,
        );
      },
    });
  };

  const handleOpenBooking = (kind: BookingKind) => {
    trackButtonClick(`btn_${kind}_cta`, `Open ${kind} Booking`);
    onOpenBooking?.(kind, {
      ...courseBookingContext(course, kind),
      autoSearch: true,
    });
  };

  const [selectedDay, setSelectedDay] = useState(
    initialViewState?.selectedDay ?? 1,
  );
  const [currencyMode, setCurrencyMode] = useState<
    CourseDetailViewState['currencyMode']
  >(initialViewState?.currencyMode ?? 'KRW');
  const calculatedTotalCost =
    course?.totalCost ??
    course?.itinerary?.days?.reduce((acc, d) => {
      return (
        acc +
        (d.stops?.reduce((sAcc, s) => {
          return sAcc + (s?.cost || 0) + (s?.transportToNext?.cost || 0);
        }, 0) || 0)
      );
    }, 0) ??
    0;
  const localCurrencySymbol = course?.exRateIcon?.trim() || '';
  const localCurrencyIsKrw = ['₩', '￦', 'KRW', '원'].includes(
    localCurrencySymbol.toUpperCase(),
  );
  const canShowLocalCurrency = Boolean(
    localCurrencySymbol &&
    !localCurrencyIsKrw &&
    course?.totalCostExRate != null &&
    Number.isFinite(course.totalCostExRate) &&
    course.totalCostExRate >= 0 &&
    !(calculatedTotalCost > 0 && course.totalCostExRate === 0),
  );
  const displayedCurrencyMode = canShowLocalCurrency ? currencyMode : 'KRW';
  const updateViewState = (state: CourseDetailViewState) => {
    if (
      state.selectedDay === selectedDay &&
      state.currencyMode === currencyMode
    )
      return;
    setSelectedDay(state.selectedDay);
    setCurrencyMode(state.currencyMode);
    onViewStateChange?.(state);
  };
  const [reelOpen, setReelOpen] = useState(false);
  const [isMapInteracting, setIsMapInteracting] = useState<boolean>(false);
  const handleMapInteractionStart = useCallback(
    () => setIsMapInteracting(true),
    [],
  );
  const handleMapInteractionEnd = useCallback(
    () => setIsMapInteracting(false),
    [],
  );
  useEffect(() => {
    if (!course) return;
    const days = course?.itinerary?.days;
    const nextDay =
      days?.length && !days.some((day) => day.day === selectedDay)
        ? days[0].day
        : selectedDay;
    if (nextDay === selectedDay && displayedCurrencyMode === currencyMode)
      return;
    setSelectedDay(nextDay);
    setCurrencyMode(displayedCurrencyMode);
    onViewStateChange?.({
      selectedDay: nextDay,
      currencyMode: displayedCurrencyMode,
    });
  }, [
    course,
    course?.itinerary?.days,
    selectedDay,
    currencyMode,
    displayedCurrencyMode,
    onViewStateChange,
  ]);

  const currentDayData = course?.itinerary?.days?.find(
    (d) => d.day === selectedDay,
  );

  const mapData = useMemo(
    () =>
      currentDayData?.stops
        ? processCourseStopsMapData(
            currentDayData.stops,
            course?.destinationCity,
          )
        : { coordinates: [], region: undefined },
    [currentDayData?.stops, course?.destinationCity],
  );

  if (isLoading) {
    return (
      <View style={[styles.screenContainer, styles.centerContainer]}>
        <ActivityIndicator size='large' color={palette.primary} />
        <Text
          lineBreakStrategyIOS='hangul-word'
          textBreakStrategy='balanced'
          style={styles.loadingText}>
          {COURSE_UI.LOADING_COURSE}
        </Text>
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={[styles.screenContainer, styles.centerContainer]}>
        <Text
          lineBreakStrategyIOS='hangul-word'
          textBreakStrategy='balanced'
          style={styles.errorText}>
          {UI_STRINGS.COURSE_DETAIL.ERROR_TITLE}
        </Text>
        <Text
          lineBreakStrategyIOS='hangul-word'
          textBreakStrategy='balanced'
          style={styles.errorSubText}>
          {error?.message || COURSE_UI.COURSE_ERROR}
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
          <Text
            lineBreakStrategyIOS='hangul-word'
            textBreakStrategy='balanced'
            style={styles.retryButtonText}>
            {UI_STRINGS.COURSE_LIST.RETRY_BUTTON}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const budgetSymbol =
    displayedCurrencyMode === 'KRW' ? '₩' : localCurrencySymbol;
  const budgetAmount =
    displayedCurrencyMode === 'KRW'
      ? calculatedTotalCost
      : course.totalCostExRate;
  const formattedBudgetDisplay = `${budgetSymbol}\u00a0${(budgetAmount ?? 0).toLocaleString()}`;

  const range = courseBookingContext(course);
  const formatDate = (date?: string) => date?.slice(2).replace(/-/g, '.') || '';
  const dateRange = `${formatDate(course.startDate)} - ${formatDate(range.endDate)}`;
  const dayDate = currentDayData?.date
    ? new Date(`${currentDayData.date}T12:00:00`)
    : undefined;
  const dayLabel = currentDayData?.date
    ? `${formatDate(currentDayData.date)}(${COURSE_UI.WEEKDAYS[dayDate?.getDay() ?? 0]})`
    : '';
  const rows: DetailRow[] = [
    { kind: 'intro' },
    { kind: 'controls' },
    { kind: 'date' },
    ...(currentDayData?.stops ?? []).map((stop, index) => ({
      kind: 'stop' as const,
      stop,
      index,
    })),
  ];
  const renderRow = ({ item }: { item: DetailRow }) => {
    if (item.kind === 'intro')
      return (
        <View
          style={styles.headerContentGroup}
          onLayout={(event) => setIntroHeight(event.nativeEvent.layout.height)}
          testID='course-detail-header'
          accessibilityLabel={course.title}>
          <View style={styles.headerTitleRow}>
            <Text
              lineBreakStrategyIOS='hangul-word'
              textBreakStrategy='balanced'
              style={styles.headerTitle}>
              {course.destinationCountry}
            </Text>
            <View style={styles.headerTitleDivider} />
            <Text
              lineBreakStrategyIOS='hangul-word'
              textBreakStrategy='balanced'
              style={styles.headerTitle}>
              {course.destinationCity}
            </Text>
          </View>
          <Text
            lineBreakStrategyIOS='hangul-word'
            textBreakStrategy='balanced'
            style={styles.headerSubtitle}>
            {dateRange}
          </Text>
          <View style={styles.tags}>
            {course.tags?.map((tag) => (
              <Text
                lineBreakStrategyIOS='hangul-word'
                textBreakStrategy='balanced'
                key={tag}
                style={styles.tag}>
                #{tag.replace(/^#/, '')}
              </Text>
            ))}
          </View>
        </View>
      );
    if (item.kind === 'controls')
      return (
        <View testID='course-controls-spacer' style={controlsSpacerStyle} />
      );
    if (item.kind === 'date')
      return (
        <View
          style={styles.dayHeader}
          accessibilityHint={currentDayData?.memo}
          testID='day-header'>
          <Text
            lineBreakStrategyIOS='hangul-word'
            textBreakStrategy='balanced'
            style={styles.dayDate}>
            {dayLabel}
          </Text>
        </View>
      );
    if (item.kind === 'stop')
      return (
        <View style={styles.timelineRow}>
          <ItineraryTimelineItem
            stop={item.stop}
            nextPlace={currentDayData?.stops[item.index + 1]?.place}
            isLast={item.index === (currentDayData?.stops.length ?? 0) - 1}
          />
        </View>
      );
    return null;
  };
  return (
    <SafeAreaView
      style={styles.screenContainer}
      edges={['top', 'left', 'right']}
      testID='screen-container'>
      <View style={styles.navActionsRow} testID='nav-actions'>
        <TouchableOpacity
          testID='btn-back'
          accessibilityRole='button'
          accessibilityLabel={COURSE_UI.BACK}
          style={styles.actionCircleBtn}
          onPress={() => {
            trackButtonClick('btn_course_detail_back', 'Back Button Click');
            onBack?.();
          }}>
          <FigmaAsset source={BackSvg} width={24} height={24} />
        </TouchableOpacity>
        <View style={styles.shareActions} testID='course-share-actions'>
          <TouchableOpacity
            testID='btn-reel'
            accessibilityRole='button'
            accessibilityLabel={UI_STRINGS.REEL.BUTTON}
            style={styles.actionCircleBtn}
            onPress={() => {
              trackButtonClick('btn_course_detail_reel', 'Create Course Reel');
              setReelOpen(true);
            }}>
            <View style={styles.reelIcon}>
              <ReelSvg />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            testID='btn-share'
            accessibilityRole='button'
            accessibilityLabel={UI_STRINGS.COURSE_DETAIL.SHARE_COURSE_BUTTON}
            style={styles.actionCircleBtn}
            onPress={handleShareCourse}>
            <FigmaAsset source={ShareSvg} width={24} height={24} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.timelineViewport}>
        <Animated.FlatList
          ref={detailList}
          testID='course-detail-list'
          data={rows}
          renderItem={renderRow}
          keyExtractor={(row) =>
            row.kind === 'stop'
              ? `stop-${selectedDay}-${row.stop.sequence}-${row.index}`
              : row.kind
          }
          scrollEnabled={!isMapInteracting}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollOffset } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          contentInsetAdjustmentBehavior='never'
          contentContainerStyle={[
            styles.scrollContentContainer,
            contentInsetStyles.scrollContent,
          ]}
          ListFooterComponent={
            <View style={styles.footer}>
              {!currentDayData?.stops?.length && (
                <Text
                  lineBreakStrategyIOS='hangul-word'
                  textBreakStrategy='balanced'
                  style={styles.emptyText}>
                  {COURSE_UI.EMPTY_DAY}
                </Text>
              )}
              <View style={styles.bookingRow}>
                <TouchableOpacity
                  testID='btn-flight-cta'
                  accessibilityRole='button'
                  style={styles.bookingCard}
                  onLayout={(event) =>
                    setBookingCardWidth(event.nativeEvent.layout.width)
                  }
                  onPress={() => handleOpenBooking('flight')}>
                  <Image
                    source={require('../../assets/images/figma-course/flight-booking.jpg')}
                    style={styles.bookingImage}
                    resizeMode='cover'
                  />
                  <View style={styles.bookingShade}>
                    <FigmaAsset
                      source={BookingShadeSvg}
                      width={165}
                      height={65}
                      style={bookingShadeStyle.shade}
                    />
                  </View>
                  <View style={styles.bookingContent}>
                    <Text
                      lineBreakStrategyIOS='hangul-word'
                      textBreakStrategy='balanced'
                      style={styles.bookingTitle}>
                      {COURSE_UI.FLIGHT}
                    </Text>
                    <View style={styles.bookingDescription}>
                      <Text
                        lineBreakStrategyIOS='hangul-word'
                        textBreakStrategy='balanced'
                        style={styles.bookingSubtitle}>
                        {COURSE_UI.FLIGHT_DESC}
                      </Text>
                      <FigmaAsset
                        source={BookingArrowSvg}
                        width={14.5}
                        height={8.5}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  testID='btn-hotel-cta'
                  accessibilityRole='button'
                  style={styles.bookingCard}
                  onPress={() => handleOpenBooking('hotel')}>
                  <Image
                    source={require('../../assets/images/figma-course/hotel-booking.jpg')}
                    style={styles.bookingImage}
                    resizeMode='cover'
                  />
                  <View style={styles.bookingShade}>
                    <FigmaAsset
                      source={BookingShadeSvg}
                      width={165}
                      height={65}
                      style={bookingShadeStyle.shade}
                    />
                  </View>
                  <View style={styles.bookingContent}>
                    <Text
                      lineBreakStrategyIOS='hangul-word'
                      textBreakStrategy='balanced'
                      style={styles.bookingTitle}>
                      {COURSE_UI.HOTEL}
                    </Text>
                    <View style={styles.bookingDescription}>
                      <Text
                        lineBreakStrategyIOS='hangul-word'
                        textBreakStrategy='balanced'
                        style={styles.bookingSubtitle}>
                        {course.destinationCity} {COURSE_UI.HOTEL_RECOMMENDED}
                      </Text>
                      <FigmaAsset
                        source={BookingArrowSvg}
                        width={14.5}
                        height={8.5}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                testID='btn-ticket-cta'
                accessibilityRole='button'
                style={styles.ticketCard}
                onPress={() => handleOpenBooking('ticket')}>
                <Image
                  source={require('../../assets/images/figma-course/ticket-booking.jpg')}
                  style={styles.bookingImage}
                  resizeMode='cover'
                />
                <FigmaAsset
                  source={TicketShadeSvg}
                  width={80}
                  height={248}
                  style={styles.ticketShade}
                />
                <View style={styles.ticketContent}>
                  <Text
                    lineBreakStrategyIOS='hangul-word'
                    textBreakStrategy='balanced'
                    style={styles.bookingTitle}>
                    {COURSE_UI.TICKET}
                  </Text>
                  <FigmaAsset
                    source={BookingArrowSvg}
                    width={14.5}
                    height={8.5}
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                testID='btn-share-bottom'
                accessibilityRole='button'
                style={styles.bottomShareBtn}
                onPress={handleShareCourse}>
                <Text
                  lineBreakStrategyIOS='hangul-word'
                  textBreakStrategy='balanced'
                  style={styles.bottomShareBtnText}>
                  {UI_STRINGS.COURSE_DETAIL.SHARE_COURSE_BUTTON}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
        {/* The full viewport parent keeps translated Android controls hittable. */}
        <View
          testID='course-controls-overlay'
          style={styles.controlsOverlay}
          pointerEvents='box-none'>
          <Animated.View
            testID='course-controls-motion'
            style={[
              styles.floatingControls,
              {
                top: introHeight,
                opacity: introHeight > 0 ? 1 : 0,
                transform: [{ translateY: controlsTranslateY }],
              },
            ]}>
            <View style={styles.controls} testID='course-sticky-controls'>
              <CourseMiniMapView
                stopCoordinates={mapData.coordinates}
                mapRegion={mapData.region}
                onInteractionStart={handleMapInteractionStart}
                onInteractionEnd={handleMapInteractionEnd}
              />
              <View
                style={styles.controlsDetails}
                testID='course-controls-details'
                onLayout={(event) =>
                  setControlsDetailsHeight(event.nativeEvent.layout.height)
                }>
                <CourseDayTabs
                  days={course.itinerary?.days}
                  selectedDay={selectedDay}
                  onSelectDay={(day) => {
                    if (day === selectedDay) return;
                    trackButtonClick(
                      'btn_course_detail_day_tab',
                      `Select Day ${day}`,
                      { day },
                    );
                    updateViewState({
                      selectedDay: day,
                      currencyMode: displayedCurrencyMode,
                    });
                    detailList.current?.scrollToOffset({
                      offset: 0,
                      animated: true,
                    });
                  }}
                />
                <View style={styles.summarySection} testID='summary-section'>
                  <View style={styles.summaryCard}>
                    <Text
                      lineBreakStrategyIOS='hangul-word'
                      textBreakStrategy='balanced'
                      style={styles.summaryTitle}>
                      {UI_STRINGS.COURSE_DETAIL.TOTAL_BUDGET_LABEL}
                    </Text>
                    <Text
                      lineBreakStrategyIOS='hangul-word'
                      textBreakStrategy='balanced'
                      style={styles.summaryValue}>
                      {formattedBudgetDisplay}
                    </Text>
                  </View>
                  {canShowLocalCurrency && (
                    <View style={styles.currencyToggleGroup}>
                      <TouchableOpacity
                        testID='currency-toggle-krw'
                        accessibilityRole='button'
                        accessibilityState={{
                          selected: currencyMode === 'KRW',
                        }}
                        style={[
                          styles.currencyToggleBtn,
                          currencyMode === 'KRW' &&
                            styles.currencyToggleBtnActive,
                        ]}
                        onPress={() =>
                          updateViewState({ selectedDay, currencyMode: 'KRW' })
                        }>
                        <Text
                          lineBreakStrategyIOS='hangul-word'
                          textBreakStrategy='balanced'
                          style={[
                            styles.currencyToggleText,
                            currencyMode === 'KRW' &&
                              styles.currencyToggleTextActive,
                          ]}>
                          ₩
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID='currency-toggle-local'
                        accessibilityRole='button'
                        accessibilityState={{
                          selected: currencyMode === 'LOCAL',
                        }}
                        style={[
                          styles.currencyToggleBtn,
                          currencyMode === 'LOCAL' &&
                            styles.currencyToggleBtnActive,
                        ]}
                        onPress={() =>
                          updateViewState({
                            selectedDay,
                            currencyMode: 'LOCAL',
                          })
                        }>
                        <Text
                          lineBreakStrategyIOS='hangul-word'
                          textBreakStrategy='balanced'
                          style={[
                            styles.currencyToggleText,
                            currencyMode === 'LOCAL' &&
                              styles.currencyToggleTextActive,
                          ]}>
                          {localCurrencySymbol}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>
          {/* Round the newly exposed map edge without resizing its native surface. */}
          <Animated.View
            pointerEvents='none'
            style={[
              styles.mapTopCorners,
              {
                top: introHeight,
                opacity: introHeight > 0 ? 1 : 0,
                transform: [{ translateY: cornersTranslateY }],
              },
            ]}>
            <Svg width={16} height={16} viewBox='0 0 16 16'>
              <Path d='M0 0H16A16 16 0 0 0 0 16Z' fill={palette.white} />
            </Svg>
            <Svg
              width={16}
              height={16}
              viewBox='0 0 16 16'
              style={styles.rightMapCorner}>
              <Path d='M0 0H16A16 16 0 0 0 0 16Z' fill={palette.white} />
            </Svg>
          </Animated.View>
        </View>
      </View>
      {reelOpen && (
        <CourseReelComposer
          key={course.courseId}
          course={course}
          initialDay={selectedDay}
          onClose={() => setReelOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  controlsDetails: { gap: 20 },
  timelineViewport: { flex: 1, overflow: 'hidden' },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  floatingControls: { position: 'absolute', left: 0, right: 0, zIndex: 1 },
  mapTopCorners: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  rightMapCorner: { transform: [{ scaleX: -1 }] },
  reelIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenContainer: { flex: 1, backgroundColor: palette.white },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: palette.subText },
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
  retryButtonText: { color: palette.white, fontWeight: '600', fontSize: 14 },
  navActionsRow: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.white,
  },
  actionCircleBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  scrollContentContainer: {
    backgroundColor: palette.white,
  },
  headerContentGroup: {
    paddingHorizontal: 32,
    paddingTop: 4,
    paddingBottom: 20,
    backgroundColor: palette.white,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitleDivider: {
    width: 2,
    height: 16,
    backgroundColor: palette.gray200,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 37,
    fontWeight: '600',
    color: palette.deepNavy,
    letterSpacing: -1,
    flexShrink: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.subText,
    marginTop: 4,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag: {
    fontSize: 14,
    color: palette.subText,
    backgroundColor: palette.gray200,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  controls: {
    backgroundColor: palette.white,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 20,
  },
  summarySection: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  summaryCard: {
    minHeight: 52,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: palette.gray300,
    borderRadius: 16,
    paddingHorizontal: 14,
    gap: 8,
    flexWrap: 'wrap',
    alignContent: 'center',
  },
  summaryTitle: { fontSize: 16, color: palette.subText, letterSpacing: -0.6 },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.deepNavy,
    letterSpacing: -0.7,
  },
  currencyToggleGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: palette.gray300,
    borderRadius: 16,
    overflow: 'hidden',
    height: 52,
  },
  currencyToggleBtn: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
  },
  currencyToggleBtnActive: { backgroundColor: palette.primary },
  currencyToggleText: {
    fontSize: 16,
    color: palette.deepNavy,
    fontWeight: '500',
  },
  currencyToggleTextActive: { color: palette.white },
  dayHeader: {
    minHeight: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.gray100,
  },
  dayDate: { fontSize: 16, color: palette.subText },
  timelineRow: { paddingHorizontal: 20, backgroundColor: palette.gray100 },
  footer: {
    padding: 20,
    paddingTop: 28,
    gap: 16,
    backgroundColor: palette.white,
  },
  bookingRow: { flexDirection: 'row', gap: 20, marginBottom: 4 },
  bookingCard: {
    flex: 1,
    minHeight: 106,
    backgroundColor: palette.gray300,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bookingImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  bookingShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bookingContent: {
    paddingHorizontal: 12,
    paddingBottom: 15,
    paddingTop: 55,
    gap: 1,
  },
  bookingDescription: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.white,
    letterSpacing: -1,
  },
  bookingSubtitle: {
    fontSize: 14,
    color: palette.white,
    letterSpacing: -1,
    flexShrink: 1,
  },
  ticketCard: {
    minHeight: 80,
    borderRadius: 16,
    backgroundColor: palette.gray300,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ticketContent: {
    paddingHorizontal: 23,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  ticketShade: {
    position: 'absolute',
    width: 80,
    height: 248,
    left: 84,
    top: -84,
    transform: [{ rotate: '90deg' }],
  },
  bottomShareBtn: {
    minHeight: 62,
    backgroundColor: palette.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 16,
  },
  bottomShareBtnText: {
    color: palette.white,
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  emptyText: {
    color: palette.subText,
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
  },
});
