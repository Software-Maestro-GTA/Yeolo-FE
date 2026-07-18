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
import { BRAND_COLORS } from '../constants/auth';

interface IntroScreenProps {
  /**
   * Callback function triggered when user clicks the 'Next' button.
   */
  onNext: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onNext }) => {
  return (
    <LinearGradient
      colors={BRAND_COLORS.BACKGROUND_GRADIENT}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.contentContainer}>
          {/* Top content area containing titles */}
          <View style={styles.topContent} testID="top-content">
            <View style={styles.heroText}>
              <Text style={styles.mainTitle}>
                {`여로가 당신의\n여행을 설계합니다`}
              </Text>
              <Text style={styles.subTitle}>
                {`AI가 당신의 취향을 분석하고,\n세상에 단 하나뿐인 여행 코스를 만들어요.`}
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
              <Text style={styles.buttonText}>다음으로</Text>
              <AntDesign
                name="arrow-right"
                size={18}
                color="#ffffff"
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
    color: BRAND_COLORS.TEXT_DARK,
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#45464c',
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  arrowIcon: {
    marginLeft: 8,
  },
});

export default IntroScreen;
