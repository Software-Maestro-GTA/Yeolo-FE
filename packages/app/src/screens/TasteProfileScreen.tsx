/**
 * @file TasteProfileScreen.tsx
 * @description Taste profile result screen component matching Figma UI and DOM-2 specifications.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  TRAVEL_PACE_DENSITY_MAP,
  ACTIVITY_PREFERENCE_MAP,
  SEASONAL_ENVIRONMENT_MAP,
  TRAVEL_PURPOSE_MAP,
  FOOD_PREFERENCE_MAP,
  PREFERRED_LOCATION_TYPE_MAP,
  getTopScoredItems,
} from '@yeolo/common';
import { palette, hexToRgba } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import { useTasteProfileQuery } from '../hooks/queries/useTasteProfileQuery';

export interface TasteProfileScreenProps {
  tasteProfileId?: string;
  onGenerateCourse?: () => void;
  onReanalyze?: () => void;
  onNavigateToIntro?: () => void;
}

export const TasteProfileScreen: React.FC<TasteProfileScreenProps> = ({
  tasteProfileId,
  onGenerateCourse,
}) => {
  useGA4ScreenTracking('TasteProfileScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  // Query taste profile via React Query hook
  const { data: fetchedProfile } = useTasteProfileQuery({
    tasteProfileId,
  });

  const activeProfile = fetchedProfile;

  // 1. PACING (travelPaceDensity)
  const pacingKey = activeProfile?.travelPaceDensity;
  const pacingLabel = pacingKey
    ? TRAVEL_PACE_DENSITY_MAP[pacingKey]?.label || pacingKey
    : '';

  // 2. ACTIVITY (highest score in activityPreference)
  const topActivityItem = getTopScoredItems(
    activeProfile?.activityPreference,
    1,
  )[0];
  const activityLabel = topActivityItem
    ? ACTIVITY_PREFERENCE_MAP[topActivityItem.key]?.label || topActivityItem.key
    : '';

  // 3. SEASON (first index in seasonalEnvironmentPreference)
  const firstSeasonKey = activeProfile?.seasonalEnvironmentPreference?.[0];
  const seasonLabel = firstSeasonKey
    ? SEASONAL_ENVIRONMENT_MAP[firstSeasonKey]?.label || firstSeasonKey
    : '';

  // 4. RANKED PURPOSES (top 3 in travelPurpose)
  const topPurposes = getTopScoredItems(activeProfile?.travelPurpose, 3);

  // 5. FAVORITE FOODS (top 3 in foodPreference)
  const topFoods = getTopScoredItems(activeProfile?.foodPreference, 3);

  // 6. BEST SPACES (top 3 in preferredLocationType with icons)
  const topSpaces = getTopScoredItems(activeProfile?.preferredLocationType, 3);

  const handlePressGenerateCourse = () => {
    trackButtonClick(
      'btn_taste_profile_generate_course',
      'Generate Course from Taste Profile',
    );
    onGenerateCourse?.();
  };

  const getDotRating = (score: number = 3) => {
    const filled = Math.min(Math.max(Math.round(score), 1), 5);
    return '●'.repeat(filled) + '○'.repeat(5 - filled);
  };

  return (
    <View style={styles.screenContainer} testID='screen-container'>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.mainBody} testID='main-content'>
          <View style={styles.headerContent} testID='top-content'>
            <Text style={styles.headerTitle}>
              {UI_STRINGS.TASTE_PROFILE.MAIN_TITLE}
            </Text>
          </View>

          {/* 6 Key Trait Summary Chips */}
          <View style={styles.summaryChipsFrame} testID='summary-chips-row'>
            <View style={styles.chipColumn}>
              <Text style={styles.chipCategory}>
                {UI_STRINGS.TASTE_PROFILE.PACING_LABEL}
              </Text>
              <Text style={styles.chipValueText}>{pacingLabel}</Text>
            </View>

            <View style={styles.chipColumn}>
              <Text style={styles.chipCategory}>
                {UI_STRINGS.TASTE_PROFILE.ACTIVITY_LABEL}
              </Text>
              <Text style={styles.chipValueText}>{activityLabel}</Text>
            </View>

            <View style={styles.chipColumn}>
              <Text style={styles.chipCategory}>
                {UI_STRINGS.TASTE_PROFILE.SEASON_LABEL}
              </Text>
              <Text style={styles.chipValueText}>{seasonLabel}</Text>
            </View>
          </View>

          {/* RANKED PURPOSES Section */}
          <View
            style={styles.rankedPurposesSection}
            testID='ranked-purposes-section'>
            <Text style={styles.sectionHeading}>
              {UI_STRINGS.TASTE_PROFILE.PURPOSES_TITLE}
            </Text>

            <View style={styles.rankedPurposesList}>
              {topPurposes.length > 0 ? (
                topPurposes.map((item, idx) => {
                  const meta = TRAVEL_PURPOSE_MAP[item.key];
                  const title = meta?.label || item.key;
                  const desc = meta?.description || '';

                  return (
                    <View
                      key={item.key}
                      style={styles.rankedItemRow}
                      testID={`purpose-${idx + 1}`}>
                      <Text style={styles.rankNumberText}>{`0${idx + 1}`}</Text>
                      <View style={styles.rankedTextFrame}>
                        <Text style={styles.rankedItemTitle}>{title}</Text>
                        {desc ? (
                          <Text style={styles.rankedItemDesc}>{desc}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.dotRatingText}>
                        {getDotRating(item.score)}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>
                  {UI_STRINGS.TASTE_PROFILE.EMPTY_PURPOSES}
                </Text>
              )}
            </View>
          </View>

          {/* FAVORITE FOODS Section */}
          <View style={styles.foodRankingCard} testID='favorite-foods-section'>
            <Text style={styles.sectionHeading}>
              {UI_STRINGS.TASTE_PROFILE.FOODS_TITLE}
            </Text>

            <View style={styles.foodRankingList}>
              {topFoods.length > 0 ? (
                topFoods.map((item) => {
                  const meta = FOOD_PREFERENCE_MAP[item.key];
                  const label = meta?.label || item.key;
                  const fillPercent = Math.min(
                    Math.max((item.score / 5) * 100, 20),
                    100,
                  );

                  return (
                    <View key={item.key} style={styles.foodItemRow}>
                      <Text style={styles.foodItemLabel}>{label}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[styles.barFill, { width: `${fillPercent}%` }]}
                        />
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>
                  {UI_STRINGS.TASTE_PROFILE.EMPTY_FOODS}
                </Text>
              )}
            </View>
          </View>

          {/* BEST SPACES Section */}
          <View style={styles.bestSpacesSection} testID='best-spaces-section'>
            <Text style={styles.sectionHeading}>
              {UI_STRINGS.TASTE_PROFILE.SPACES_TITLE}
            </Text>

            <View style={styles.bestSpacesGrid}>
              {topSpaces.length > 0 ? (
                topSpaces.map((item, idx) => {
                  const meta = PREFERRED_LOCATION_TYPE_MAP[item.key];
                  const label = meta?.label || item.key;
                  const iconName = (meta?.icon || 'sun') as any;

                  const bgColors = [
                    hexToRgba(palette.warning, 0.1),
                    hexToRgba(palette.accent, 0.1),
                    hexToRgba(palette.primary, 0.1),
                  ];
                  const iconColors = [
                    palette.warning,
                    palette.accent,
                    palette.primary,
                  ];

                  return (
                    <View
                      key={item.key}
                      style={styles.spaceCardItem}
                      testID={`space-card-${idx + 1}`}>
                      <View
                        style={[
                          styles.spaceIconBox,
                          { backgroundColor: bgColors[idx % 3] },
                        ]}
                        testID='space-icon-box'>
                        <Feather
                          name={iconName}
                          size={20}
                          color={iconColors[idx % 3]}
                        />
                      </View>
                      <Text style={styles.spaceCardLabel}>{label}</Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>
                  {UI_STRINGS.TASTE_PROFILE.EMPTY_SPACES}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomContainer} testID='bottom-container'>
          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.8}
            onPress={handlePressGenerateCourse}
            testID='generate-course-button'>
            <Ionicons
              name='sparkles'
              size={18}
              color={palette.white}
              style={styles.ctaIconLeft}
            />
            <Text style={styles.ctaButtonText}>
              {UI_STRINGS.TASTE_PROFILE.GENERATE_COURSE_BUTTON}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: palette.softMint,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 18,
  },
  headerContent: {
    width: '100%',
    gap: 4,
    paddingBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: palette.deepNavy,
    lineHeight: 34,
    letterSpacing: -0.6,
    includeFontPadding: false,
  },
  mainBody: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    gap: 16,
  },
  summaryChipsFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: 16,
  },
  chipColumn: {
    flex: 1,
    gap: 2,
  },
  chipCategory: {
    fontSize: 11,
    fontWeight: '400',
    color: palette.subText,
    textTransform: 'uppercase',
  },
  chipValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  rankedPurposesSection: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.accent,
    letterSpacing: 0.14,
  },
  rankedPurposesList: {
    gap: 12,
  },
  rankedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rankNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.accent,
  },
  rankedTextFrame: {
    flex: 1,
    gap: 2,
  },
  rankedItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  rankedItemDesc: {
    fontSize: 12,
    fontWeight: '400',
    color: palette.subText,
  },
  dotRatingText: {
    fontSize: 12,
    color: palette.accent,
    letterSpacing: 1,
  },
  foodRankingCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 16,
    padding: 20,
    gap: 14,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  foodRankingList: {
    gap: 12,
  },
  foodItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  foodItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  barTrack: {
    width: 120,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.gray200,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: palette.accent,
    borderRadius: 4,
  },
  bestSpacesSection: {
    gap: 12,
  },
  bestSpacesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  spaceCardItem: {
    flex: 1,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  spaceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.deepNavy,
    textAlign: 'center',
  },
  bottomContainer: {
    width: '100%',
  },
  ctaButton: {
    backgroundColor: palette.primary,
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.white,
  },
  ctaIconLeft: {
    marginRight: 8,
  },
  emptyText: {
    fontSize: 13,
    color: palette.subText,
    paddingVertical: 12,
    textAlign: 'center',
  },
});
