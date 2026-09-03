/**
 * @file HomeScreen.tsx
 * @description Main home screen with hero background, quick feature buttons, recent course card, and booking partner tiles.
 */
import React, { useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  Platform,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getDestinationImageUrl } from '../services';
import { AuthContext, useBackground } from '../context';
import { palette, hexToRgba } from '../theme/colors';
import { UI_STRINGS, APP_IMAGES, APP_CONFIG } from '../constants';

import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import { useTasteProfileQuery, useCourseDetailQuery } from '../hooks/queries';

export interface HomeScreenProps {
  onNavigateToCreate?: () => void;
  onNavigateToExplore?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToTasteProfile?: () => void;
  onNavigateToPhotoConsent?: () => void;
  onSelectCourse?: (courseId: string) => void;
  selectedCourseId?: string | null;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToCreate,
  onNavigateToExplore,
  onNavigateToProfile,
  onNavigateToTasteProfile,
  onNavigateToPhotoConsent,
  onSelectCourse,
  selectedCourseId,
}) => {
  useGA4ScreenTracking('HomeScreen');
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

  const auth = useContext(AuthContext);
  const user = auth?.user;
  const displayName = user?.displayName || UI_STRINGS.HOME.GUEST;
  const effectiveCourseId = selectedCourseId || auth?.recentCourseId || null;

  const { data: tasteProfile } = useTasteProfileQuery();
  const hasTasteProfile = !!tasteProfile;

  const { data: recentCourse } = useCourseDetailQuery({
    courseId: effectiveCourseId || '',
    options: {
      enabled: !!effectiveCourseId,
    },
  });

  const handleOpenBookingPartner = async (
    url: string,
    buttonId: string,
    buttonLabel: string,
  ) => {
    trackButtonClick(buttonId, buttonLabel);
    try {
      await Linking.openURL(url);
    } catch (_err) {
      Alert.alert(
        UI_STRINGS.COURSE_DETAIL.BOOKING_ERROR_TITLE,
        UI_STRINGS.COURSE_DETAIL.BOOKING_ERROR_MESSAGE,
      );
    }
  };

  const handleTasteQuickAction = () => {
    trackButtonClick('btn_home_taste', 'Taste Profile Quick Button');
    if (hasTasteProfile) {
      if (onNavigateToTasteProfile) {
        onNavigateToTasteProfile();
      } else {
        onNavigateToProfile?.();
      }
    } else {
      if (onNavigateToPhotoConsent) {
        onNavigateToPhotoConsent();
      } else {
        onNavigateToProfile?.();
      }
    }
  };

  return (
    <View style={styles.container} testID='home-screen'>
      <StatusBar
        barStyle='dark-content'
        backgroundColor='transparent'
        translucent
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <ImageBackground
            source={APP_IMAGES.HOME_HERO_BG}
            style={[styles.heroImageBg, { paddingTop: topPadding }]}
            resizeMode='cover'>
            {/* Gradient Overlay */}
            <LinearGradient
              colors={[
                hexToRgba(palette.softMint, 0.75),
                hexToRgba(palette.softMint, 0.5),
                hexToRgba(palette.softMint, 0.85),
                palette.softMint,
              ]}
              locations={[0, 0.45, 0.8, 1]}
              style={styles.gradientOverlay}
            />

            {/* Greeting Stack (Bottom-aligned inside Hero Image) */}
            <View style={styles.greetingStack}>
              <Text style={styles.greetingText}>
                {displayName}
                {UI_STRINGS.HOME.HONORIFIC_NIM},
              </Text>
              <Text style={styles.greetingSubText}>
                {UI_STRINGS.HOME.GREETING_SUBTITLE}
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* Main Content Body */}
        <View style={styles.mainContentBody}>
          {/* Quick Feature Shortcut Buttons */}
          <View style={styles.quickIconsRow} testID='quick-icons'>
            {/* 1. 코스 생성하기 */}
            <TouchableOpacity
              style={styles.shortcutBtn}
              activeOpacity={0.8}
              onPress={() => {
                trackButtonClick(
                  'btn_home_create_course',
                  'Create Course Quick Button',
                );
                onNavigateToCreate?.();
              }}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: palette.primary },
                ]}>
                <Ionicons name='sparkles' size={16} color={palette.white} />
              </View>
              <Text style={styles.shortcutBtnText}>
                {UI_STRINGS.HOME.QUICK_CREATE_COURSE}
              </Text>
            </TouchableOpacity>

            {/* 2. 코스 둘러보기 */}
            <TouchableOpacity
              style={styles.shortcutBtn}
              activeOpacity={0.8}
              onPress={() => {
                trackButtonClick(
                  'btn_home_explore',
                  'Explore Courses Quick Button',
                );
                onNavigateToExplore?.();
              }}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: palette.lightTeal },
                ]}>
                <Ionicons
                  name='compass-outline'
                  size={18}
                  color={palette.accent}
                />
              </View>
              <Text style={styles.shortcutBtnText}>
                {UI_STRINGS.HOME.QUICK_EXPLORE_COURSES}
              </Text>
            </TouchableOpacity>

            {/* 3. 내 여행 취향 */}
            <TouchableOpacity
              style={styles.shortcutBtn}
              activeOpacity={0.8}
              onPress={handleTasteQuickAction}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: palette.lightTeal },
                ]}>
                <Ionicons
                  name='options-outline'
                  size={18}
                  color={palette.accent}
                />
              </View>
              <Text style={styles.shortcutBtnText}>
                {UI_STRINGS.HOME.QUICK_MY_TASTE}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent Course Section */}
          {effectiveCourseId && recentCourse ? (
            <View
              style={styles.sectionContainer}
              testID='recent-course-section'>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  {UI_STRINGS.HOME.RECENT_COURSE_TITLE}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.compactRouteCard}
                testID='recent-course-card'
                activeOpacity={0.85}
                onPress={() => {
                  trackButtonClick(
                    'btn_home_recent_course',
                    'Recent Course Card Click',
                  );
                  if (onSelectCourse) {
                    onSelectCourse(effectiveCourseId);
                  } else {
                    onNavigateToExplore?.();
                  }
                }}>
                <Image
                  testID='recent-course-thumbnail'
                  source={{
                    uri:
                      recentCourse.coverImageUrl ||
                      getDestinationImageUrl(
                        recentCourse.destinationCountry || '',
                        recentCourse.destinationCity || '',
                      ),
                  }}
                  style={styles.cardThumbnail}
                />
                <View style={styles.cardInfoStack}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {recentCourse.title}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {`${recentCourse.destinationCountry || ''} ${recentCourse.destinationCity || ''} • ${recentCourse.totalDays || 0}일`}
                  </Text>
                  {recentCourse.recommendationReason ? (
                    <Text style={styles.cardDesc} numberOfLines={1}>
                      {recentCourse.recommendationReason}
                    </Text>
                  ) : null}
                  {recentCourse.tags && recentCourse.tags.length > 0 ? (
                    <View style={styles.tagsRow}>
                      {recentCourse.tags.slice(0, 3).map((tag, idx) => (
                        <Text key={idx} style={styles.tagText}>
                          #{tag}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Booking Partner Section */}
          <View style={styles.sectionContainer} testID='booking-section'>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {UI_STRINGS.HOME.BOOKING_SECTION_TITLE}
              </Text>
              <Text style={styles.partnerSourceText}>
                {UI_STRINGS.HOME.BOOKING_PARTNER_SOURCE}
              </Text>
            </View>

            <View style={styles.bookingTilesRow}>
              {/* ✈️ 항공 */}
              <TouchableOpacity
                testID='booking-tile-flight'
                style={[
                  styles.bookingTile,
                  { backgroundColor: hexToRgba(palette.primary, 0.08) },
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  handleOpenBookingPartner(
                    APP_CONFIG.TRIP_FLIGHT_URL,
                    'btn_home_booking_flight',
                    'Booking Flight Click',
                  )
                }>
                <View
                  style={[
                    styles.bookingIconCircle,
                    { backgroundColor: hexToRgba(palette.primary, 0.18) },
                  ]}>
                  <Text style={styles.bookingEmoji}>✈️</Text>
                </View>
                <Text style={styles.bookingLabel}>
                  {UI_STRINGS.HOME.BOOKING_FLIGHT}
                </Text>
              </TouchableOpacity>

              {/* 🏨 숙소 */}
              <TouchableOpacity
                testID='booking-tile-hotel'
                style={[
                  styles.bookingTile,
                  { backgroundColor: hexToRgba(palette.accent, 0.08) },
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  handleOpenBookingPartner(
                    APP_CONFIG.TRIP_HOTEL_URL,
                    'btn_home_booking_hotel',
                    'Booking Hotel Click',
                  )
                }>
                <View
                  style={[
                    styles.bookingIconCircle,
                    { backgroundColor: hexToRgba(palette.accent, 0.18) },
                  ]}>
                  <Text style={styles.bookingEmoji}>🏨</Text>
                </View>
                <Text style={styles.bookingLabel}>
                  {UI_STRINGS.HOME.BOOKING_HOTEL}
                </Text>
              </TouchableOpacity>

              {/* 🚄 기차 */}
              <TouchableOpacity
                testID='booking-tile-train'
                style={[
                  styles.bookingTile,
                  { backgroundColor: hexToRgba(palette.warning, 0.08) },
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  handleOpenBookingPartner(
                    APP_CONFIG.TRIP_TRAIN_URL,
                    'btn_home_booking_train',
                    'Booking Train Click',
                  )
                }>
                <View
                  style={[
                    styles.bookingIconCircle,
                    { backgroundColor: hexToRgba(palette.warning, 0.18) },
                  ]}>
                  <Text style={styles.bookingEmoji}>🚄</Text>
                </View>
                <Text style={styles.bookingLabel}>
                  {UI_STRINGS.HOME.BOOKING_TRAIN}
                </Text>
              </TouchableOpacity>

              {/* 🎫 투어·티켓 */}
              <TouchableOpacity
                testID='booking-tile-ticket'
                style={[
                  styles.bookingTile,
                  { backgroundColor: hexToRgba(palette.purple, 0.08) },
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  handleOpenBookingPartner(
                    APP_CONFIG.TRIP_TICKET_URL,
                    'btn_home_booking_ticket',
                    'Booking Ticket Click',
                  )
                }>
                <View
                  style={[
                    styles.bookingIconCircle,
                    { backgroundColor: hexToRgba(palette.purple, 0.18) },
                  ]}>
                  <Text style={styles.bookingEmoji}>🎫</Text>
                </View>
                <Text style={styles.bookingLabel}>
                  {UI_STRINGS.HOME.BOOKING_TICKET}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.softMint,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 24,
  },
  heroSection: {
    width: '100%',
    height: 320,
    backgroundColor: palette.deepNavy,
  },
  heroImageBg: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'flex-end',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
  },
  heroTopNav: {
    zIndex: 2,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: palette.deepNavy,
    letterSpacing: -0.64,
  },
  greetingStack: {
    gap: 4,
    zIndex: 2,
    marginBottom: 8,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.deepNavy,
    lineHeight: 28,
  },
  greetingSubText: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.deepNavy,
    lineHeight: 28,
  },
  mainContentBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 24,
  },
  quickIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shortcutBtn: {
    flex: 1,
    height: 70,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  sectionContainer: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  partnerSourceText: {
    fontSize: 12,
    fontWeight: '400',
    color: palette.mutedText,
  },
  compactRouteCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  cardInfoStack: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.subText,
  },
  cardDesc: {
    fontSize: 11,
    fontWeight: '400',
    color: palette.gray600,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    color: palette.primary,
  },
  bookingTilesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookingTile: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookingIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingEmoji: {
    fontSize: 20,
  },
  bookingLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.deepNavy,
  },
});
