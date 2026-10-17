/**
 * @file MBTIResultScreen.tsx
 * @description 유형별 예시 데이터로 계획 방식·일정 밀도·여행 분위기를 막대에 표시하고 코스·사진 추천을 연결합니다.
 */
import BackSvg from '../../assets/ui-v3-onboarding/back.svg';
import { Text } from '../components/common/Typography';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MBTI_PROFILES, type MbtiType } from '../constants/mbtiProfiles';
import { UI_STRINGS } from '../constants';
import { TasteTicket } from '../components/taste/TasteTicket';
import { OnboardingSvg } from '../components/taste/OnboardingIllustrations';
import { OnboardingButton } from '../components/onboarding/OnboardingButton';
import { theme } from '../theme/colors';
import { useGA4ScreenTracking } from '../hooks';

/** Uses the existing fixed MBTI mapping without requesting the photo-analysis API. */
export function MBTIResultScreen({
  mbti,
  onGenerateCourse,
  onPhoto,
  onBack,
}: {
  mbti: MbtiType;
  onGenerateCourse: () => void;
  onPhoto: () => void;
  onBack: () => void;
}) {
  useGA4ScreenTracking('MBTIResultScreen');
  const insets = useSafeAreaInsets();
  const insetStyles = StyleSheet.create({
    content: { paddingBottom: insets.bottom + 8 },
  });
  const profile = MBTI_PROFILES[mbti];
  const types = [
    {
      typeCode: 'MBTI_PLANNING_STYLE',
      typeName: UI_STRINGS.MBTI_RESULT.PLANNING,
      lowName: UI_STRINGS.MBTI_RESULT.PLANNING_LOW,
      highName: UI_STRINGS.MBTI_RESULT.PLANNING_HIGH,
      score: profile.spectra.planningStyle,
    },
    {
      typeCode: 'MBTI_ITINERARY_DENSITY',
      typeName: UI_STRINGS.MBTI_RESULT.DENSITY,
      lowName: UI_STRINGS.MBTI_RESULT.DENSITY_LOW,
      highName: UI_STRINGS.MBTI_RESULT.DENSITY_HIGH,
      score: profile.spectra.itineraryDensity,
    },
    {
      typeCode: 'MBTI_TRAVEL_ATMOSPHERE',
      typeName: UI_STRINGS.MBTI_RESULT.ATMOSPHERE,
      lowName: UI_STRINGS.MBTI_RESULT.ATMOSPHERE_LOW,
      highName: UI_STRINGS.MBTI_RESULT.ATMOSPHERE_HIGH,
      score: profile.spectra.travelAtmosphere,
    },
  ];
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, insetStyles.content]}
        bounces={false}
        overScrollMode='never'
        showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.back}
          onPress={onBack}
          accessibilityRole='button'
          accessibilityLabel={UI_STRINGS.ONBOARDING.BACK}>
          <OnboardingSvg source={BackSvg} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {mbti} {UI_STRINGS.MBTI_RESULT.TITLE}
        </Text>
        <TasteTicket
          intro={profile.summary}
          hashtags={profile.tags.split(/\s+/)}
          types={types}
          testID='mbti-ticket-card'
          footerStyle={styles.ticketFooter}
          footer={
            <>
              <OnboardingButton
                label={UI_STRINGS.MBTI_RESULT.COURSE_CTA}
                onPress={onGenerateCourse}
                ticket
              />
              <View style={styles.photoAction}>
                <OnboardingButton
                  label={UI_STRINGS.MBTI_RESULT.PHOTO_ACTION}
                  onPress={onPhoto}
                  secondary
                  ticket
                />
                <Text style={styles.source}>
                  {UI_STRINGS.MBTI_RESULT.SOURCE}
                </Text>
              </View>
            </>
          }
        />
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg.screen },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 8,
  },
  back: {
    width: 44,
    height: 36,
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    paddingHorizontal: 12,
    fontSize: 24,
    lineHeight: 37,
    letterSpacing: -1,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  ticketFooter: { paddingBottom: 17 },
  photoAction: { gap: 6 },
  source: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: theme.colors.text.secondary,
  },
});
