/**
 * @file PhotoConsentScreen.tsx
 * @description Photo consent screen with privacy safeguards and start analysis action.
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import {
  requestPhotoAccess,
  type PhotoAccess,
} from '../services/photoPermissionService';
import { Feather, Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import { useSavePhotoConsentMutation } from '../hooks/queries/useAuthMutations';

interface PhotoConsentScreenProps {
  onNext: (access: PhotoAccess) => void;
}

export const PhotoConsentScreen: React.FC<PhotoConsentScreenProps> = ({
  onNext,
}) => {
  useGA4ScreenTracking('PhotoConsentScreen');
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
      <View style={styles.contentContainer}>
        {/* Header Title Section */}
        <View style={styles.headerSection} testID='top-content'>
          <Text style={styles.mainTitle}>
            {UI_STRINGS.PHOTO_CONSENT.MAIN_TITLE}
          </Text>
          <Text style={styles.subTitle}>
            {UI_STRINGS.PHOTO_CONSENT.SUB_TITLE}
          </Text>
        </View>

        {/* Main Body Section */}
        <View style={styles.mainBodyContainer} testID='main-content'>
          {/* Hero Lock Illustration Graphic */}
          <View style={styles.heroIllustration} testID='hero-illustration'>
            <View style={styles.iconCircleBg}>
              <Feather name='lock' size={44} color={palette.accent} />
            </View>
          </View>

          {/* Security & Data Privacy Assurance Cards */}
          <View style={styles.assuranceCardsContainer}>
            {/* Card 1: 메타데이터만 안전하게 가공 */}
            <View style={styles.infoCard} testID='info-card-1'>
              <View style={styles.cardIconWrapper}>
                <Ionicons
                  name='shield-checkmark-outline'
                  size={22}
                  color={palette.accent}
                />
              </View>
              <View style={styles.cardTextGroup}>
                <Text style={styles.cardTitle}>
                  {UI_STRINGS.PHOTO_CONSENT.CARD_1_TITLE}
                </Text>
                <Text style={styles.cardDescription}>
                  {UI_STRINGS.PHOTO_CONSENT.CARD_1_DESC}
                </Text>
              </View>
            </View>

            {/* Card 2: 분석 즉시 데이터 파기 */}
            <View style={styles.infoCard} testID='info-card-2'>
              <View style={styles.cardIconWrapper}>
                <Feather name='trash-2' size={22} color={palette.accent} />
              </View>
              <View style={styles.cardTextGroup}>
                <Text style={styles.cardTitle}>
                  {UI_STRINGS.PHOTO_CONSENT.CARD_2_TITLE}
                </Text>
                <Text style={styles.cardDescription}>
                  {UI_STRINGS.PHOTO_CONSENT.CARD_2_DESC}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Container Action Button */}
        <View style={styles.bottomContainer} testID='bottom-container'>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            disabled={isRequesting}
            onPress={() => {
              void handlePressConsent();
            }}
            testID='consent-start-button'>
            <Text style={styles.primaryButtonText}>
              {UI_STRINGS.PHOTO_CONSENT.START_BUTTON}
            </Text>
            <Ionicons
              name='shield-checkmark'
              size={18}
              color={palette.white}
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: palette.softMint,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerSection: {
    gap: 12,
    width: '100%',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: palette.deepNavy,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: palette.subText,
    lineHeight: 21,
  },
  mainBodyContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
    marginVertical: 16,
  },
  heroIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  iconCircleBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: palette.lightTeal,
    borderWidth: 1.5,
    borderColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assuranceCardsContainer: {
    gap: 12,
    width: '100%',
  },
  infoCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  cardIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardTextGroup: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  cardDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: palette.subText,
    lineHeight: 17,
  },
  bottomContainer: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: palette.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.white,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
