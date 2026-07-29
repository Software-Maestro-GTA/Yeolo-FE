/**
 * @file PhotoAnalysisScreen.tsx
 * @description Photo analysis consent screen matching Figma design specifications.
 * @requirements REQ-8, REQ-11, REQ-22
 * @functional FUN-1, FUN-GA4
 * @api N/A
 * @author Antigravity Agent
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { theme } from '../theme';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

interface PhotoAnalysisScreenProps {
  onNext: () => void;
}

export const PhotoAnalysisScreen: React.FC<PhotoAnalysisScreenProps> = ({ onNext }) => {
  useGA4ScreenTracking('PhotoAnalysisScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const [isConsented, setIsConsented] = useState(false);

  const handleConsentToggle = () => {
    const nextConsented = !isConsented;
    trackButtonClick('btn_photo_consent_toggle', 'Toggle Photo Consent', { consented: nextConsented });
    setIsConsented(nextConsented);
  };

  const handleAnalyzeClick = () => {
    if (isConsented) {
      trackButtonClick('btn_photo_analysis_start', 'Start Photo Analysis');
      onNext();
    }
  };

  return (
    <LinearGradient
      colors={theme.colors.gradient.background}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.contentContainer}>
          {/* Top content area containing titles */}
          <View style={styles.topContent} testID="top-content">
            <View style={styles.heroText}>
              <Text style={styles.mainTitle}>
                {UI_STRINGS.PHOTO_ANALYSIS.MAIN_TITLE}
              </Text>
              <Text style={styles.subTitle}>
                {UI_STRINGS.PHOTO_ANALYSIS.SUB_TITLE}
              </Text>
            </View>
          </View>

          {/* Bottom container containing consent card and action button */}
          <View style={styles.bottomContainer} testID="bottom-container">
            {/* Consent Card Container - positioned directly above analyze button */}
            <TouchableOpacity
              style={styles.consentCard}
              activeOpacity={0.8}
              onPress={handleConsentToggle}
              testID="consent-checkbox-container"
            >
              <View style={[styles.checkbox, isConsented && styles.checkboxSelected]} testID="consent-checkbox">
                {isConsented && <Feather name="check" size={14} color={theme.colors.text.inverse} />}
              </View>
              <Text style={styles.consentText}>
                {UI_STRINGS.PHOTO_ANALYSIS.CONSENT_TEXT}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, !isConsented && styles.disabledButton]}
              activeOpacity={0.8}
              onPress={handleAnalyzeClick}
              disabled={!isConsented}
              testID="analyze-button"
            >
              <Text style={styles.buttonText}>{UI_STRINGS.PHOTO_ANALYSIS.START_BUTTON}</Text>
              <FontAwesome
                name="shield"
                size={16}
                color={theme.colors.text.inverse}
                style={styles.shieldIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 34,
  },
  topContent: {
    width: '100%',
  },
  heroText: {
    gap: 12,
    paddingTop: 24,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text.primary,
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  consentCard: {
    marginHorizontal: 0,
    backgroundColor: theme.colors.bg.card,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  consentText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    flex: 1,
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: theme.colors.border.light,
    shadowColor: 'transparent',
    elevation: 0,
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  shieldIcon: {
    marginLeft: 8,
  },
});
