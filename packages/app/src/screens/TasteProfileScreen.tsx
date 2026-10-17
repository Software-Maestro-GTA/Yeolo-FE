/**
 * @file TasteProfileScreen.tsx
 * @description API-backed blue UI v3 photo taste ticket, recommendation and reanalysis actions (1196:342).
 */
import BackSvg from '../../assets/ui-v3-onboarding/back.svg';
import { Text } from '../components/common/Typography';
import React from 'react';
import type { TasteProfile } from '@yeolo/common';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { ONBOARDING_UI_STRINGS } from '../constants/onboardingUiStrings';
import { OnboardingSvg } from '../components/taste/OnboardingIllustrations';
import { TasteTicket } from '../components/taste/TasteTicket';
import { OnboardingButton } from '../components/onboarding/OnboardingButton';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import { useTasteProfileQuery } from '../hooks/queries/useTasteProfileQuery';

export interface TasteProfileScreenProps {
  onBack?: () => void;
  tasteProfileId?: string;
  onGenerateCourse?: (destination: TasteProfile['recommendCity']) => void;
  onReanalyze?: () => void;
  onNavigateToIntro?: () => void;
}

/** Loads the active API profile and keeps generation unavailable until real result data is available. */
export const TasteProfileScreen: React.FC<TasteProfileScreenProps> = ({
  tasteProfileId,
  onGenerateCourse,
  onReanalyze,
  onBack,
}) => {
  useGA4ScreenTracking('TasteProfileScreen');
  const insets = useSafeAreaInsets();
  const insetStyles = StyleSheet.create({
    content: { paddingBottom: insets.bottom + 2 },
  });
  const { trackButtonClick } = useGA4ButtonClick();
  const {
    data: profile,
    isPending,
    isError,
    refetch,
  } = useTasteProfileQuery({ tasteProfileId });
  const generate = () => {
    trackButtonClick(
      'btn_taste_profile_generate_course',
      'Generate Course from Taste Profile',
    );
    if (profile) onGenerateCourse?.(profile.recommendCity);
  };
  const reanalyze = () => {
    trackButtonClick('btn_taste_profile_reanalyze', 'Reanalyze Taste Profile');
    onReanalyze?.();
  };
  return (
    <View style={styles.screen} testID='screen-container'>
      <ScrollView
        contentContainerStyle={[styles.content, insetStyles.content]}
        showsVerticalScrollIndicator={false}>
        {onBack && (
          <TouchableOpacity
            style={styles.back}
            onPress={onBack}
            accessibilityRole='button'
            accessibilityLabel={UI_STRINGS.ONBOARDING.BACK}>
            <OnboardingSvg source={BackSvg} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{UI_STRINGS.TASTE_PROFILE.MAIN_TITLE}</Text>
        {isPending ? (
          <View style={styles.status}>
            <ActivityIndicator color={palette.primary} />
            <Text style={styles.statusText}>
              {ONBOARDING_UI_STRINGS.LOADING_PROFILE}
            </Text>
          </View>
        ) : isError || !profile ? (
          <View style={styles.status}>
            <Text style={styles.statusText}>
              {UI_STRINGS.TASTE_PROFILE.ERROR_LOAD_FAILED}
            </Text>
            <OnboardingButton
              label={ONBOARDING_UI_STRINGS.RETRY}
              onPress={() => {
                void refetch();
              }}
            />
          </View>
        ) : (
          <TasteTicket
            intro={profile.intro}
            hashtags={profile.hashtags}
            types={profile.types}
            recommendCity={profile.recommendCity}
            testID='taste-ticket-card'
            footer={
              <>
                <OnboardingButton
                  label={UI_STRINGS.TASTE_PROFILE.GENERATE_COURSE_BUTTON}
                  onPress={generate}
                  ticket
                  testID='generate-course-button'
                />
                {onReanalyze && (
                  <TouchableOpacity
                    style={styles.reanalyze}
                    onPress={reanalyze}
                    accessibilityRole='button'
                    testID='reanalyze-button'>
                    <Text style={styles.reanalyzeLabel}>
                      {UI_STRINGS.TASTE_PROFILE.REANALYZE_BUTTON}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            }
          />
        )}
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.white },
  content: {
    flexGrow: 1,
    paddingTop: 35,
    paddingHorizontal: 20,
    gap: 14,
  },
  back: {
    position: 'absolute',
    top: -2,
    left: 10,
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    paddingHorizontal: 12,
    fontSize: 24,
    lineHeight: 37,
    letterSpacing: -1,
    fontWeight: '600',
    color: palette.deepNavy,
  },
  status: { flex: 1, paddingVertical: 40, gap: 16, justifyContent: 'center' },
  statusText: { color: palette.subText, textAlign: 'center', fontSize: 16 },
  reanalyze: { minHeight: 30, alignItems: 'center', justifyContent: 'center' },
  reanalyzeLabel: { fontSize: 14, color: palette.subText },
});
