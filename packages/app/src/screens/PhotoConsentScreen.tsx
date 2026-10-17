/**
 * @file PhotoConsentScreen.tsx
 * @description Photo consent and native permission request with the current UI v3 assurance list and blue action (1196:175).
 */
import { Text } from '../components/common/Typography';
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import {
  requestPhotoAccess,
  type PhotoAccess,
} from '../services/photoPermissionService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingSvg } from '../components/taste/OnboardingIllustrations';
import { ONBOARDING_UI_STRINGS } from '../constants/onboardingUiStrings';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import { useSavePhotoConsentMutation } from '../hooks/queries/useAuthMutations';

interface PhotoConsentScreenProps {
  onNext: (access: PhotoAccess) => void;
  onBack?: () => void;
}

/** Requests consent and access; returning users may leave through their supplied entry route. */
export const PhotoConsentScreen: React.FC<PhotoConsentScreenProps> = ({
  onNext,
  onBack,
}) => {
  useGA4ScreenTracking('PhotoConsentScreen');
  const insets = useSafeAreaInsets();
  const insetStyles = StyleSheet.create({
    content: { paddingBottom: insets.bottom + 43 },
  });
  const { trackButtonClick } = useGA4ButtonClick();
  const saveConsentMutation = useSavePhotoConsentMutation();

  const [isRequesting, setIsRequesting] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handlePressConsent = async () => {
    if (pending.current) return;
    pending.current = true;
    setIsRequesting(true);
    trackButtonClick(
      'btn_photo_consent_start',
      'Photo Analysis Consent & Start',
    );
    try {
      await saveConsentMutation.mutateAsync({
        agreed: true,
        consentVersion: 'v1.0',
      });
    } catch {
      if (!mounted.current) return;
      Alert.alert(
        UI_STRINGS.ONBOARDING.ERROR_TITLE,
        UI_STRINGS.PHOTO_CONSENT.SAVE_ERROR,
      );
      pending.current = false;
      setIsRequesting(false);
      return;
    }
    if (!mounted.current) return;
    try {
      const access = await requestPhotoAccess();
      if (mounted.current) onNext(access);
    } catch {
      if (mounted.current)
        Alert.alert(
          UI_STRINGS.ONBOARDING.ERROR_TITLE,
          UI_STRINGS.PHOTO_AUTH.PERMISSION_CHECK_ERROR,
        );
    } finally {
      pending.current = false;
      if (mounted.current) setIsRequesting(false);
    }
  };

  return (
    <View style={styles.screenContainer}>
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole='button'
          accessibilityLabel={UI_STRINGS.ONBOARDING.BACK}>
          <OnboardingSvg
            source={require('../../assets/ui-v3-onboarding/back.svg')}
          />
        </TouchableOpacity>
      )}
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          insetStyles.content,
          onBack && styles.contentWithBack,
        ]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.mainTitle}>
          {UI_STRINGS.PHOTO_CONSENT.MAIN_TITLE}
        </Text>
        <View style={styles.heroContainer} />
        <View style={styles.assuranceCard} testID='assurance-card'>
          <Text style={styles.assuranceTitle}>
            {UI_STRINGS.PHOTO_CONSENT.ASSURANCE_TITLE}
          </Text>
          <View style={styles.bulletList}>
            {UI_STRINGS.PHOTO_CONSENT.ASSURANCE_BULLETS.map((bullet, idx) => (
              <View
                key={bullet}
                style={styles.bulletRow}
                testID={`info-card-${idx + 1}`}>
                <Text style={styles.bulletMark}>
                  {ONBOARDING_UI_STRINGS.PRIVACY_BULLET}
                </Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        </View>
        <TouchableOpacity
          accessibilityRole='button'
          accessibilityState={{ disabled: isRequesting, busy: isRequesting }}
          style={[styles.primaryButton, isRequesting && styles.disabledButton]}
          activeOpacity={0.8}
          disabled={isRequesting}
          onPress={() => {
            void handlePressConsent();
          }}
          testID='consent-start-button'>
          <Text style={styles.primaryButtonText}>
            {UI_STRINGS.PHOTO_CONSENT.START_BUTTON}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: palette.white },
  backButton: {
    width: 44,
    height: 44,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 46,
    paddingHorizontal: 20,
  },
  contentWithBack: { paddingTop: 2 },
  mainTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: palette.deepNavy,
    lineHeight: 37,
    letterSpacing: -1,
    textAlign: 'center',
  },
  heroContainer: {
    flexGrow: 1,
    minHeight: 350,
  },
  assuranceCard: { gap: 12, marginBottom: 32 },
  assuranceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.deepNavy,
    letterSpacing: -1,
  },
  bulletList: { gap: 0 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletMark: {
    fontSize: 20,
    fontWeight: '500',
    color: palette.privacyRed,
    lineHeight: 37,
  },
  bulletText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '500',
    color: palette.deepNavy,
    lineHeight: 37,
    letterSpacing: -1,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: palette.primary,
    minHeight: 62,
    borderRadius: 16,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 20,
    lineHeight: 37,
    fontWeight: '500',
    letterSpacing: -0.6,
    color: palette.white,
    textAlign: 'center',
  },
  disabledButton: { opacity: 0.6 },
});
