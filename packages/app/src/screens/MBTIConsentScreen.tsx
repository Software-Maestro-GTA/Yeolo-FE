/**
 * @file MBTIConsentScreen.tsx
 * @description Offers MBTI onboarding or a return to full photo access guidance after permission denial.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { OnboardingButton } from '../components/onboarding/OnboardingButton';
import { UI_STRINGS } from '../constants';
import { theme } from '../theme/colors';
import { useGA4ScreenTracking } from '../hooks';

/** Shows the two alternative paths without triggering permissions or analysis. */
export function MBTIConsentScreen({
  onNext,
  onPhoto,
}: {
  onNext: () => void;
  onPhoto: () => void;
}) {
  useGA4ScreenTracking('MBTIConsentScreen');
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{UI_STRINGS.MBTI_CONSENT.TITLE}</Text>
      <View style={styles.actions}>
        <OnboardingButton
          label={UI_STRINGS.MBTI_CONSENT.START}
          onPress={onNext}
        />
        <OnboardingButton
          label={UI_STRINGS.MBTI_CONSENT.PHOTO}
          onPress={onPhoto}
          secondary
        />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 40,
    paddingVertical: 24,
  },
  title: {
    fontSize: 24,
    lineHeight: 37,
    fontWeight: '600',
    textAlign: 'center',
    color: theme.colors.text.primary,
  },
  actions: { gap: 16 },
});
