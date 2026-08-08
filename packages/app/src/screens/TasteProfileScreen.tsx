/**
 * @file TasteProfileScreen.tsx
 * @description Taste profile result screen component.
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
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface TasteProfileScreenProps {
  tasteProfileId?: string;
  onGenerateCourse?: () => void;
  onReanalyze?: () => void;
  onNavigateToIntro?: () => void;
}

export const TasteProfileScreen: React.FC<TasteProfileScreenProps> = ({
  onGenerateCourse,
}) => {
  useGA4ScreenTracking('TasteProfileScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const handlePressGenerateCourse = () => {
    trackButtonClick(
      'btn_taste_profile_generate_course',
      'Generate Course from Taste Profile',
    );
    onGenerateCourse?.();
  };

  return (
    <View style={styles.screenContainer} testID='screen-container'>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerContent} testID='top-content'>
          <Text style={styles.headerTitle}>
            {UI_STRINGS.TASTE_PROFILE.MAIN_TITLE}
          </Text>
        </View>

        <View style={styles.mainBody} testID='main-content'>
          <View style={styles.summaryChipsFrame} testID='summary-chips-row'>
            <View style={styles.chipColumn}>
              <Text style={styles.chipCategory}>
                {UI_STRINGS.TASTE_PROFILE.PACING_LABEL}
              </Text>
              <Text style={styles.chipValueText}>
                {UI_STRINGS.TASTE_PROFILE.PACING_DEFAULT}
              </Text>
            </View>

            <View style={styles.chipColumn}>
              <Text style={styles.chipCategory}>
                {UI_STRINGS.TASTE_PROFILE.ACTIVITY_LABEL}
              </Text>
              <Text style={styles.chipValueText}>
                {UI_STRINGS.TASTE_PROFILE.ACTIVITY_DEFAULT}
              </Text>
            </View>

            <View style={styles.chipColumn}>
              <Text style={styles.chipCategory}>
                {UI_STRINGS.TASTE_PROFILE.SEASON_LABEL}
              </Text>
              <Text style={styles.chipValueText}>
                {UI_STRINGS.TASTE_PROFILE.SEASON_DEFAULT}
              </Text>
            </View>
          </View>

          <View
            style={styles.rankedPurposesSection}
            testID='ranked-purposes-section'>
            <Text style={styles.sectionHeading}>
              {UI_STRINGS.TASTE_PROFILE.PURPOSES_TITLE}
            </Text>

            <View style={styles.rankedPurposesList}>
              <View style={styles.rankedItemRow} testID='purpose-1'>
                <Text style={styles.rankNumberText}>01</Text>
                <View style={styles.rankedTextFrame}>
                  <Text style={styles.rankedItemTitle}>
                    {UI_STRINGS.TASTE_PROFILE.PURPOSE_1_TITLE}
                  </Text>
                  <Text style={styles.rankedItemDesc}>
                    {UI_STRINGS.TASTE_PROFILE.PURPOSE_1_DESC}
                  </Text>
                </View>
                <Text style={styles.dotRatingText}>●●●●●</Text>
              </View>

              <View style={styles.rankedItemRow} testID='purpose-2'>
                <Text style={styles.rankNumberText}>02</Text>
                <View style={styles.rankedTextFrame}>
                  <Text style={styles.rankedItemTitle}>
                    {UI_STRINGS.TASTE_PROFILE.PURPOSE_2_TITLE}
                  </Text>
                  <Text style={styles.rankedItemDesc}>
                    {UI_STRINGS.TASTE_PROFILE.PURPOSE_2_DESC}
                  </Text>
                </View>
                <Text style={styles.dotRatingText}>●●●●○</Text>
              </View>

              <View style={styles.rankedItemRow} testID='purpose-3'>
                <Text style={styles.rankNumberText}>03</Text>
                <View style={styles.rankedTextFrame}>
                  <Text style={styles.rankedItemTitle}>
                    {UI_STRINGS.TASTE_PROFILE.PURPOSE_3_TITLE}
                  </Text>
                  <Text style={styles.rankedItemDesc}>
                    {UI_STRINGS.TASTE_PROFILE.PURPOSE_3_DESC}
                  </Text>
                </View>
                <Text style={styles.dotRatingText}>●●●●○</Text>
              </View>
            </View>
          </View>

          <View style={styles.foodRankingCard} testID='favorite-foods-section'>
            <Text style={styles.sectionHeading}>
              {UI_STRINGS.TASTE_PROFILE.FOODS_TITLE}
            </Text>

            <View style={styles.foodRankingList}>
              <View style={styles.foodItemRow}>
                <Text style={styles.foodItemLabel}>
                  {UI_STRINGS.TASTE_PROFILE.FOOD_1}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '100%' }]} />
                </View>
              </View>

              <View style={styles.foodItemRow}>
                <Text style={styles.foodItemLabel}>
                  {UI_STRINGS.TASTE_PROFILE.FOOD_2}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '100%' }]} />
                </View>
              </View>

              <View style={styles.foodItemRow}>
                <Text style={styles.foodItemLabel}>
                  {UI_STRINGS.TASTE_PROFILE.FOOD_3}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '80%' }]} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bestSpacesSection} testID='best-spaces-section'>
            <Text style={styles.sectionHeading}>
              {UI_STRINGS.TASTE_PROFILE.SPACES_TITLE}
            </Text>

            <View style={styles.bestSpacesGrid}>
              <View style={styles.spaceCardItem} testID='space-card-1'>
                <View
                  style={[
                    styles.spaceIconBox,
                    { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
                  ]}>
                  <Feather name='sun' size={20} color='#F59E0B' />
                </View>
                <Text style={styles.spaceCardLabel}>
                  {UI_STRINGS.TASTE_PROFILE.SPACE_1}
                </Text>
              </View>

              <View style={styles.spaceCardItem} testID='space-card-2'>
                <View
                  style={[
                    styles.spaceIconBox,
                    { backgroundColor: 'rgba(0, 201, 167, 0.1)' },
                  ]}>
                  <Feather name='eye' size={20} color={palette.accent} />
                </View>
                <Text style={styles.spaceCardLabel}>
                  {UI_STRINGS.TASTE_PROFILE.SPACE_2}
                </Text>
              </View>

              <View style={styles.spaceCardItem} testID='space-card-3'>
                <View
                  style={[
                    styles.spaceIconBox,
                    { backgroundColor: 'rgba(45, 125, 210, 0.1)' },
                  ]}>
                  <Feather name='map-pin' size={20} color={palette.primary} />
                </View>
                <Text style={styles.spaceCardLabel}>
                  {UI_STRINGS.TASTE_PROFILE.SPACE_3}
                </Text>
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
                color='#FFFFFF'
                style={styles.ctaIconLeft}
              />
              <Text style={styles.ctaButtonText}>여행 코스 생성하기</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 76,
    gap: 16,
  },
  headerContent: {
    width: '100%',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: palette.deepNavy,
    lineHeight: 32,
  },
  mainBody: {
    width: '100%',
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
    marginTop: 8,
  },
  ctaButton: {
    backgroundColor: palette.primary,
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D7DD2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaIconLeft: {
    marginRight: 8,
  },
});
