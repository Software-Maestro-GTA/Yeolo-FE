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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface HomeScreenProps {
  onNavigateToCreate?: () => void;
  onNavigateToExplore?: () => void;
  onNavigateToProfile?: () => void;
}

const DEFAULT_HERO_BG =
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=80';
const MOCK_THUMBNAIL =
  'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=400&q=80';

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToCreate,
  onNavigateToExplore,
  onNavigateToProfile,
}) => {
  useGA4ScreenTracking('HomeScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const auth = useContext(AuthContext);
  const user = auth?.user;
  const displayName = user?.displayName || UI_STRINGS.HOME.GUEST;

  return (
    <View style={styles.container} testID='home-screen'>
      <StatusBar
        barStyle='light-content'
        backgroundColor='transparent'
        translucent
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <ImageBackground
            source={{ uri: DEFAULT_HERO_BG }}
            style={styles.heroImageBg}
            resizeMode='cover'>
            {/* Gradient Overlay */}
            <LinearGradient
              colors={[
                'rgba(13, 33, 55, 0.75)',
                'rgba(13, 33, 55, 0.35)',
                'rgba(245, 250, 248, 0.85)',
                palette.softMint,
              ]}
              locations={[0, 0.45, 0.8, 1]}
              style={styles.gradientOverlay}
            />

            {/* Top Brand Logo Row */}
            <View style={styles.heroTopNav}>
              <Text style={styles.brandTitle}>여로</Text>
            </View>

            {/* Greeting Stack */}
            <View style={styles.greetingStack}>
              <Text style={styles.greetingText}>
                {displayName}
                {UI_STRINGS.HOME.HONORIFIC_NIM},
              </Text>
              <Text style={styles.greetingSubText}>
                오늘은 어디로 떠나볼까요?
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
                <Ionicons name='sparkles' size={16} color='#FFFFFF' />
              </View>
              <Text style={styles.shortcutBtnText}>코스 생성하기</Text>
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
              <View style={[styles.iconBadge, { backgroundColor: '#E0F7F1' }]}>
                <Ionicons
                  name='compass-outline'
                  size={18}
                  color={palette.accent}
                />
              </View>
              <Text style={styles.shortcutBtnText}>코스 둘러보기</Text>
            </TouchableOpacity>

            {/* 3. 내 여행 취향 */}
            <TouchableOpacity
              style={styles.shortcutBtn}
              activeOpacity={0.8}
              onPress={() => {
                trackButtonClick(
                  'btn_home_taste',
                  'Taste Profile Quick Button',
                );
                onNavigateToProfile?.();
              }}>
              <View style={[styles.iconBadge, { backgroundColor: '#E0F7F1' }]}>
                <Ionicons
                  name='options-outline'
                  size={18}
                  color={palette.accent}
                />
              </View>
              <Text style={styles.shortcutBtnText}>내 여행 취향</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Course Section */}
          <View style={styles.sectionContainer} testID='recent-course-section'>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>최근 확인한 여행 코스</Text>
            </View>

            <TouchableOpacity
              style={styles.compactRouteCard}
              activeOpacity={0.85}
              onPress={() => {
                trackButtonClick(
                  'btn_home_recent_course',
                  'Recent Course Card Click',
                );
                onNavigateToExplore?.();
              }}>
              <Image
                source={{ uri: MOCK_THUMBNAIL }}
                style={styles.cardThumbnail}
              />
              <View style={styles.cardInfoStack}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  서울 힐링 여행
                </Text>
                <Text style={styles.cardMeta}>대한민국 서울 • 3일</Text>
                <Text style={styles.cardDesc} numberOfLines={1}>
                  도심 속 자연과 전통을 동시에 즐기는 코스
                </Text>
                <View style={styles.tagsRow}>
                  <Text style={styles.tagText}>#힐링</Text>
                  <Text style={styles.tagText}>#나홀로여행</Text>
                  <Text style={styles.tagText}>#교육깊은여행</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Booking Partner Section */}
          <View style={styles.sectionContainer} testID='booking-section'>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>여행 예약</Text>
              <Text style={styles.partnerSourceText}>Trip.com</Text>
            </View>

            <View style={styles.bookingTilesRow}>
              {/* ✈️ 항공 */}
              <TouchableOpacity
                style={[
                  styles.bookingTile,
                  { backgroundColor: 'rgba(45,125,210,0.08)' },
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  trackButtonClick(
                    'btn_home_booking_flight',
                    'Booking Flight Click',
                  )
                }>
                <View
                  style={[
                    styles.bookingIconCircle,
                    { backgroundColor: 'rgba(45,125,210,0.18)' },
                  ]}>
                  <Text style={styles.bookingEmoji}>✈️</Text>
                </View>
                <Text style={styles.bookingLabel}>항공</Text>
              </TouchableOpacity>

              {/* 🏨 숙소 */}
              <TouchableOpacity
                style={[
                  styles.bookingTile,
                  { backgroundColor: 'rgba(0,201,167,0.08)' },
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  trackButtonClick(
                    'btn_home_booking_hotel',
                    'Booking Hotel Click',
                  )
                }>
                <View
                  style={[
                    styles.bookingIconCircle,
                    { backgroundColor: 'rgba(0,201,167,0.18)' },
                  ]}>
                  <Text style={styles.bookingEmoji}>🏨</Text>
                </View>
                <Text style={styles.bookingLabel}>숙소</Text>
              </TouchableOpacity>

              {/* 🚄 기차 */}
              <TouchableOpacity
                style={[
                  styles.bookingTile,
                  { backgroundColor: 'rgba(242,153,51,0.08)' },
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  trackButtonClick(
                    'btn_home_booking_train',
                    'Booking Train Click',
                  )
                }>
                <View
                  style={[
                    styles.bookingIconCircle,
                    { backgroundColor: 'rgba(242,153,51,0.18)' },
                  ]}>
                  <Text style={styles.bookingEmoji}>🚄</Text>
                </View>
                <Text style={styles.bookingLabel}>기차</Text>
              </TouchableOpacity>

              {/* 🎫 투어·티켓 */}
              <TouchableOpacity
                style={[
                  styles.bookingTile,
                  { backgroundColor: 'rgba(153,102,204,0.08)' },
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  trackButtonClick(
                    'btn_home_booking_ticket',
                    'Booking Ticket Click',
                  )
                }>
                <View
                  style={[
                    styles.bookingIconCircle,
                    { backgroundColor: 'rgba(153,102,204,0.18)' },
                  ]}>
                  <Text style={styles.bookingEmoji}>🎫</Text>
                </View>
                <Text style={styles.bookingLabel}>투어·티켓</Text>
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
    backgroundColor: palette.softMint, // #F5FAF8
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 76,
  },
  heroSection: {
    width: '100%',
    height: 310,
    backgroundColor: '#0D2137',
  },
  heroImageBg: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT + 12,
    paddingBottom: 24,
    justifyContent: 'space-between',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    lineHeight: 28,
  },
  greetingSubText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
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
    borderColor: '#E0E5EB',
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
    color: palette.deepNavy, // #0D2137
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
    color: '#808C99',
  },
  compactRouteCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: '#E0E5EB',
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
    color: '#7E8B9B',
  },
  cardDesc: {
    fontSize: 11,
    fontWeight: '400',
    color: '#45464C',
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
    color: palette.primary, // #2D7DD2
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
