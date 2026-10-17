/**
 * @file MBTIConsentScreen.tsx
 * @description Offers MBTI onboarding or a return to full photo access guidance after permission denial.
 */
import BackSvg from '../../assets/ui-v3-onboarding/back.svg';
import { Text } from '../components/common/Typography';
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingButton } from '../components/onboarding/OnboardingButton';
import { OnboardingSvg } from '../components/taste/OnboardingIllustrations';
import { UI_STRINGS } from '../constants';
import { theme } from '../theme/colors';
import { useGA4ScreenTracking } from '../hooks';

/** Shows the two alternative paths without triggering permissions or analysis. */
export function MBTIConsentScreen({
  onNext,
  onPhoto,
  onBack,
}: {
  onNext: () => void;
  onPhoto: () => void;
  onBack?: () => void;
}) {
  useGA4ScreenTracking('MBTIConsentScreen');
  const insets = useSafeAreaInsets();
  const insetStyles = StyleSheet.create({
    content: { paddingBottom: insets.bottom + 40 },
  });
  return (
    <View style={styles.screen}>
      {onBack && (
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole='button'
          accessibilityLabel={UI_STRINGS.ONBOARDING.BACK}>
          <OnboardingSvg source={BackSvg} />
        </Pressable>
      )}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          insetStyles.content,
          onBack && styles.contentWithBack,
        ]}>
        <Text style={styles.title}>{UI_STRINGS.MBTI_CONSENT.TITLE}</Text>
        <View style={styles.actions}>
          <OnboardingButton
            label={UI_STRINGS.MBTI_CONSENT.PHOTO}
            onPress={onPhoto}
          />
          <OnboardingButton
            label={UI_STRINGS.MBTI_CONSENT.START}
            onPress={onNext}
            secondary
          />
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg.screen },
  backButton: {
    width: 44,
    height: 44,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 40,
    paddingTop: 51,
    paddingHorizontal: 20,
  },
  contentWithBack: { paddingTop: 7 },
  title: {
    fontSize: 24,
    lineHeight: 37,
    fontWeight: '600',
    letterSpacing: -1,
    textAlign: 'center',
    color: theme.colors.text.primary,
  },
  actions: { gap: 12 },
});
