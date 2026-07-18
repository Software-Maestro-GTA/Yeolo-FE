/**
 * @file PhotoAnalysisScreen.tsx
 * @description Photo analysis consent screen matching Figma design specifications.
 * @requirements REQ-8, REQ-11
 * @functional FUN-1
 * @api N/A
 * @author Antigravity Agent
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { BRAND_COLORS } from '../constants/auth';

interface PhotoAnalysisScreenProps {
  /**
   * Callback function triggered when user successfully consents and clicks the action button.
   */
  onNext: () => void;
}

export const PhotoAnalysisScreen: React.FC<PhotoAnalysisScreenProps> = ({ onNext }) => {
  const [isAgreed, setIsAgreed] = useState(false);

  const toggleAgreement = () => {
    setIsAgreed(!isAgreed);
  };

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
                {`사진으로\n취향을 읽어볼까요?`}
              </Text>
              <Text style={styles.subTitle}>
                {`당신의 사진을 분석하여 여행 성향을 파악해요.\n사진은 외부로 전송되지 않아요.`}
              </Text>
            </View>
          </View>

          {/* Consent Checkbox Area */}
          <View style={styles.consentContainer}>
            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.8}
              onPress={toggleAgreement}
              testID="consent-checkbox"
            >
              <View
                style={[
                  styles.checkbox,
                  isAgreed && styles.checkboxChecked,
                ]}
              >
                {isAgreed && (
                  <FontAwesome
                    name="check"
                    size={12}
                    color="#ffffff"
                    testID="checkmark-icon"
                  />
                )}
              </View>
              <Text style={styles.consentText}>
                개인정보 수집 및 사진/위치 정보 분석에 동의합니다.
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom container containing action button */}
          <View style={styles.bottomContainer} testID="bottom-container">
            <TouchableOpacity
              style={[
                styles.primaryButton,
                !isAgreed && styles.disabledButton,
              ]}
              activeOpacity={isAgreed ? 0.8 : 1.0}
              onPress={isAgreed ? onNext : undefined}
              disabled={!isAgreed}
              testID="start-button"
            >
              <Text style={styles.buttonText}>동의하고 시작하기</Text>
              <Feather
                name="shield"
                size={18}
                color="#ffffff"
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
  consentContainer: {
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    borderColor: BRAND_COLORS.PRIMARY,
  },
  consentText: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT_DARK,
    flex: 1,
    lineHeight: 20,
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
  disabledButton: {
    backgroundColor: '#c6c6cc',
    shadowColor: 'transparent',
    elevation: 0,
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  shieldIcon: {
    marginLeft: 8,
  },
});

export default PhotoAnalysisScreen;
