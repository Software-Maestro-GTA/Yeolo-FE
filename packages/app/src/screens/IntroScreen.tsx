/**
 * @file IntroScreen.tsx
 * @description Application introduction screen matching Figma design specifications.
 * @requirements REQ-11
 * @functional FUN-1
 * @api N/A
 * @author Antigravity Agent
 */
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import { theme } from '../theme';
import { UI_STRINGS } from '../constants';

interface IntroScreenProps {
  onNext: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onNext }) => {
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
                {UI_STRINGS.INTRO.MAIN_TITLE}
              </Text>
              <Text style={styles.subTitle}>
                {UI_STRINGS.INTRO.SUB_TITLE}
              </Text>
            </View>
          </View>

          {/* Bottom container containing action button */}
          <View style={styles.bottomContainer} testID="bottom-container">
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={onNext}
              testID="next-button"
            >
              <Text style={styles.buttonText}>{UI_STRINGS.INTRO.NEXT_BUTTON}</Text>
              <AntDesign
                name="arrow-right"
                size={18}
                color={theme.colors.text.inverse}
                style={styles.arrowIcon}
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
    height: 190,
    width: '100%',
  },
  heroText: {
    gap: 12,
    paddingTop: 24,
    paddingHorizontal: 24,
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
  bottomContainer: {
    paddingHorizontal: 24,
    width: '100%',
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
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  arrowIcon: {
    marginLeft: 8,
  },
});
