/**
 * @file HomeScreen.tsx
 * @description Marketing Design 워드마크와 UI v3 취향·최근 코스 카드, 전체 목록·예약 화면 연결을 제공합니다.
 */
import YeoloLogoSvg from '../../assets/branding/yeolo-logo.svg';
import ChevronSvg from '../../assets/figma/home/chevron.svg';
import PersonSvg from '../../assets/figma/profile/person.svg';
import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context';
import { Text } from '../components/common/Typography';
import { theme, palette } from '../theme/colors';
import { HOME_PROFILE_UI as S } from '../constants/homeProfileUiStrings';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import type { OpenBooking } from '../services/bookingService';
import {
  useTasteProfileQuery,
  useCourseListQuery,
  useCourseDetailQuery,
} from '../hooks/queries';
import { CourseCard } from '../components/course/CourseCard';
import { CourseReelComposer } from '../components/course/CourseReelComposer';
import { FigmaAsset } from '../components/common/FigmaAsset';
import { CachedImage } from '../components/common/CachedImage';

const assets = {
  logo: YeoloLogoSvg,
  chevron: ChevronSvg,
  person: PersonSvg,
};

export interface HomeScreenProps {
  onNavigateToCreate?: () => void;
  onNavigateToExplore?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToTasteProfile?: () => void;
  onNavigateToPhotoConsent?: () => void;
  onSelectCourse?: (courseId: string) => void;
  selectedCourseId?: string | null;
  onOpenBooking?: OpenBooking;
}

/** 서버의 최근 코스를 표시하고 모든 주요 흐름의 진입점을 연결합니다. */
export function HomeScreen({
  onNavigateToCreate,
  onNavigateToExplore,
  onNavigateToProfile,
  onNavigateToTasteProfile,
  onNavigateToPhotoConsent,
  onSelectCourse,
  selectedCourseId,
  onOpenBooking,
}: HomeScreenProps) {
  useGA4ScreenTracking('HomeScreen');
  const { trackButtonClick } = useGA4ButtonClick();
  const auth = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [reelCourseId, setReelCourseId] = useState<string | null>(null);
  const {
    data: reelCourse,
    isFetching: reelLoading,
    isError: reelError,
    refetch: retryReel,
  } = useCourseDetailQuery({
    courseId: reelCourseId ?? '',
    options: { enabled: !!reelCourseId },
  });
  const { data: tasteProfile } = useTasteProfileQuery();
  const {
    data: courses = [],
    isLoading,
    isError,
    refetch,
  } = useCourseListQuery();
  const sortedCourses = [...courses].sort(
    (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
  );
  const recentCourses = sortedCourses.slice(0, 3);
  const avatar = auth?.user?.profileImageUrl;
  const openReel = () => {
    if (reelCourseId && reelError) {
      void retryReel();
      return;
    }
    const id =
      selectedCourseId || auth?.recentCourseId || recentCourses[0]?.courseId;
    if (id) setReelCourseId(id);
    else onNavigateToExplore?.();
  };
  const openTaste = () => {
    trackButtonClick('btn_home_taste', 'Taste Profile Quick Button');
    if (tasteProfile) (onNavigateToTasteProfile || onNavigateToProfile)?.();
    else (onNavigateToPhotoConsent || onNavigateToProfile)?.();
  };
  return (
    <View style={styles.container} testID='home-screen'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}>
        <View style={styles.header}>
          <View accessible accessibilityLabel={S.brand} style={styles.brand}>
            <FigmaAsset
              source={assets.logo}
              width={587.998}
              height={187.885}
              style={styles.brandArtwork}
            />
          </View>
          <TouchableOpacity
            testID='home-profile'
            accessibilityRole='button'
            accessibilityLabel={S.profile}
            onPress={onNavigateToProfile}
            style={styles.avatarButton}>
            {avatar ? (
              <CachedImage source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <FigmaAsset source={assets.person} width={19.4689} height={22} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.greeting}>
          {S.greeting(auth?.user?.displayName || S.guest)}
        </Text>
        <View style={styles.featureRow}>
          <TouchableOpacity
            testID='home-taste-card'
            accessibilityRole='button'
            accessibilityLabel={tasteProfile ? S.viewTaste : S.taste}
            onPress={openTaste}
            style={[styles.featureCard, styles.tasteCard]}>
            <View style={styles.featureCaption}>
              <Text style={styles.tasteLead}>{S.tasteLead}</Text>
              <Text style={styles.tasteLabel}>{S.taste}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel={S.create}
            onPress={onNavigateToCreate}
            style={[styles.featureCard, styles.mapCard]}>
            <View style={styles.featureCaption}>
              <Text style={styles.createLead}>{S.createLead}</Text>
              <Text style={styles.createLabel}>{S.create}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          testID='home-reel'
          accessibilityRole='button'
          accessibilityState={{ busy: reelLoading, disabled: reelLoading }}
          disabled={reelLoading}
          style={styles.reelButton}
          onPress={openReel}>
          <Text style={styles.reelText}>{S.reel}</Text>
          {reelLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <FigmaAsset
              source={assets.chevron}
              width={24}
              height={24}
              style={styles.forward}
            />
          )}
        </TouchableOpacity>
        {!!reelCourseId && reelError && (
          <Text accessibilityRole='alert' style={styles.muted}>
            {S.reelLoadError}
          </Text>
        )}
        <View testID='recent-course-section' style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <TouchableOpacity
              accessibilityRole='button'
              onPress={onNavigateToExplore}>
              <Text style={styles.sectionTitle}>{S.recent}</Text>
            </TouchableOpacity>
            {recentCourses.length > 0 && (
              <TouchableOpacity
                accessibilityRole='button'
                onPress={onNavigateToExplore}
                style={styles.allCourses}>
                <Text style={styles.allCoursesText}>{S.allCourses}</Text>
                <FigmaAsset
                  source={assets.chevron}
                  width={24}
                  height={24}
                  style={styles.forward}
                />
              </TouchableOpacity>
            )}
          </View>
          {isLoading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : isError ? (
            <View style={styles.empty}>
              <Text style={styles.muted}>{S.loadError}</Text>
              <TouchableOpacity onPress={() => refetch()}>
                <Text style={styles.retry}>{S.retry}</Text>
              </TouchableOpacity>
            </View>
          ) : recentCourses.length ? (
            <View style={styles.recentCards}>
              {recentCourses.map((item) => (
                <CourseCard
                  key={item.courseId}
                  item={item}
                  onPress={(id) =>
                    onSelectCourse
                      ? onSelectCourse(id)
                      : onNavigateToExplore?.()
                  }
                />
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.muted}>{S.empty}</Text>
            </View>
          )}
        </View>
        <View testID='booking-section' style={styles.bookingSection}>
          <Text style={styles.sectionTitle}>{S.booking}</Text>
          <View style={styles.bookingRow}>
            {(['flight', 'hotel', 'ticket'] as const).map((kind) => (
              <TouchableOpacity
                key={kind}
                testID={`booking-tile-${kind}`}
                accessibilityRole='button'
                accessibilityLabel={S[kind]}
                style={styles.bookingItem}
                onPress={() => onOpenBooking?.(kind, {})}>
                <View style={styles.bookingCircle} accessible={false} />
                <Text style={styles.bookingLabel}>{S[kind]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      {!!reelCourseId && reelCourse && (
        <CourseReelComposer
          course={reelCourse}
          courseSummaries={sortedCourses}
          initialDay={reelCourse.itinerary.days[0]?.day ?? 1}
          initialStep='intro'
          onClose={() => setReelCourseId(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.card },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  header: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  brand: {
    width: 100,
    height: (187.885 / 587.998) * 100,
  },
  brandArtwork: {
    width: 587.998,
    height: 187.885,
    transformOrigin: 'top left',
    transform: [{ scale: 100 / 587.998 }],
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.gray200,
  },
  avatar: { width: 35, height: 35, borderRadius: 18 },
  greeting: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '600',
    letterSpacing: -1,
    marginBottom: 16,
    color: theme.colors.text.primary,
  },
  featureRow: { flexDirection: 'row', gap: 20 },
  featureCard: { flex: 1, height: 207, borderRadius: 16, alignItems: 'center' },
  tasteCard: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 2, height: 3 },
    elevation: 4,
  },
  mapCard: {
    overflow: 'hidden',
    backgroundColor: theme.colors.bg.card,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 2, height: 3 },
    elevation: 4,
  },
  featureCaption: {
    position: 'absolute',
    bottom: 21,
    alignItems: 'center',
    width: '100%',
  },
  tasteLead: {
    fontSize: 16,
    lineHeight: 23,
    letterSpacing: -1,
    color: theme.colors.text.inverse,
  },
  tasteLabel: {
    fontSize: 16,
    lineHeight: 23,
    letterSpacing: -1,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  createLead: {
    fontSize: 16,
    lineHeight: 23,
    letterSpacing: -1,
    color: theme.colors.text.primary,
  },
  createLabel: {
    fontSize: 16,
    lineHeight: 23,
    letterSpacing: -1,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  reelButton: {
    marginTop: 20,
    minHeight: 47,
    borderRadius: 12,
    backgroundColor: theme.colors.bg.card,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 2, height: 3 },
    elevation: 4,
  },
  reelText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -1,
    color: theme.colors.text.primary,
  },
  forward: { transform: [{ rotate: '180deg' }] },
  recentSection: { marginTop: 32 },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -1,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 4,
    marginBottom: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  allCourses: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
    marginRight: -8,
  },
  allCoursesText: { fontSize: 12, fontWeight: '500', color: palette.gray400 },
  recentCards: { gap: 16 },
  empty: {
    minHeight: 107,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  muted: { fontSize: 16, color: theme.colors.text.muted },
  retry: { color: theme.colors.primary, fontSize: 16 },
  bookingSection: { marginTop: 32 },
  bookingRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  bookingItem: { flex: 1, alignItems: 'center', gap: 6 },
  bookingCircle: {
    width: '100%',
    maxWidth: 103,
    aspectRatio: 1,
    borderRadius: 52,
    backgroundColor: palette.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingLabel: { fontSize: 16, color: theme.colors.text.primary },
});
