/**
 * @file MBTIResultScreen.tsx
 * @description Shows fixed, display-only MBTI travel traits and course/photo entry actions.
 */
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { MBTI_PROFILES, type MbtiType } from '../constants/mbtiProfiles';
import { UI_STRINGS } from '../constants';
import { OnboardingButton } from '../components/onboarding/OnboardingButton';
import { theme } from '../theme/colors';
import { useGA4ScreenTracking } from '../hooks';

/** Renders the selected type's fixed result without requesting a taste profile API. */
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
  const profile = MBTI_PROFILES[mbti];
  const traits = [
    [UI_STRINGS.MBTI_RESULT.PACE, profile.pace],
    [UI_STRINGS.MBTI_RESULT.PHOTO, profile.photo],
    [UI_STRINGS.MBTI_RESULT.WEATHER, profile.weather],
  ];
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <OnboardingButton
        label={UI_STRINGS.ONBOARDING.BACK}
        onPress={onBack}
        secondary
      />
      <Text style={styles.title}>
        {mbti} {UI_STRINGS.MBTI_RESULT.TITLE}
      </Text>
      <View style={styles.card}>
        <Text style={styles.summary}>{profile.summary}</Text>
        <Text style={styles.description}>{profile.tags}</Text>
        <View style={styles.traits}>
          {traits.map(([label, value]) => (
            <View key={label} style={styles.trait}>
              <Text style={styles.description}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.description}>{UI_STRINGS.MBTI_RESULT.SOURCE}</Text>
        <OnboardingButton
          label={UI_STRINGS.MBTI_RESULT.COURSE}
          onPress={onGenerateCourse}
        />
        <OnboardingButton
          label={UI_STRINGS.MBTI_RESULT.PHOTO_ACTION}
          onPress={onPhoto}
          secondary
        />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: 20, paddingVertical: 12 },
  title: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: theme.colors.bg.tint,
    padding: 16,
    gap: 20,
  },
  summary: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 29,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text.secondary,
  },
  traits: {
    borderRadius: 20,
    backgroundColor: theme.colors.bg.card,
    padding: 20,
    gap: 24,
  },
  trait: { gap: 8 },
  value: { fontSize: 20, fontWeight: '600', color: theme.colors.text.primary },
});
