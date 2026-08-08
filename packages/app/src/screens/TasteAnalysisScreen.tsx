/**
 * @file TasteAnalysisScreen.tsx
 * @description Taste analysis progress screen with dynamic insights container and step indicators.
 */
import React, { useEffect, useState, useRef, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTasteStore, DEFAULT_API_URL } from '@yeolo/common';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking } from '../hooks';
import { AuthContext } from '../context';
import { fetchPhotosWithExifData } from '../services';

interface TasteAnalysisScreenProps {
  onFinish: (tasteProfileId: string) => void;
  onFail?: () => void;
}

export const TasteAnalysisScreen: React.FC<TasteAnalysisScreenProps> = ({
  onFinish,
  onFail,
}) => {
  useGA4ScreenTracking('TasteAnalysisScreen');
  const auth = useContext(AuthContext);

  // stepIndex: 0 (사진 수집 완료), 1 (여행 성향 분석 중), 2 (맞춤 코스 생성 완료/대기)
  const [stepIndex, setStepIndex] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for live badge
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [pulseAnim]);

  useEffect(() => {
    let isSubscribed = true;
    let completionTimeout: ReturnType<typeof setTimeout>;

    const executeAnalysisPipeline = async () => {
      try {
        if (isSubscribed) {
          setStepIndex(1); // 여행 성향 분석 중
        }

        // 1. Fetch recent photos and parse EXIF metadata
        const exifDataList = await fetchPhotosWithExifData();

        if (!isSubscribed) return;

        // 2. Perform taste analysis via Zustand store & backend API
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;
        const profileId = await useTasteStore
          .getState()
          .analyzeTaste(apiUrl, '', { images: exifDataList });

        if (isSubscribed && profileId) {
          setStepIndex(2); // 맞춤 코스 생성 완료/전환 대기
          completionTimeout = setTimeout(() => {
            if (isSubscribed) {
              onFinish(profileId);
            }
          }, 1200);
        } else if (isSubscribed) {
          // Fallback demo profileId during transition
          const fallbackProfileId = 'taste-profile-v2-demo';
          setStepIndex(2);
          completionTimeout = setTimeout(() => {
            if (isSubscribed) {
              onFinish(fallbackProfileId);
            }
          }, 1200);
        }
      } catch (err: any) {
        if (isSubscribed) {
          setErrorMessage(err.message || '사진 분석 중 오류가 발생했습니다.');
          onFail?.();
        }
      }
    };

    executeAnalysisPipeline();

    return () => {
      isSubscribed = false;
      if (completionTimeout) clearTimeout(completionTimeout);
    };
  }, [onFinish, onFail]);

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.contentContainer}>
          {/* Header Title Section */}
          <View style={styles.headerSection} testID='top-content'>
            <Text style={styles.mainTitle}>
              {UI_STRINGS.TASTE_ANALYSIS.MAIN_TITLE}
            </Text>
            <Text style={styles.subTitle}>
              {UI_STRINGS.TASTE_ANALYSIS.SUB_TITLE}
            </Text>
          </View>

          {/* Main Body Section */}
          <View style={styles.mainBodyContainer} testID='main-content'>
            {/* Checklist Step Container */}
            <View
              style={styles.checklistContainer}
              testID='checklist-container'>
              <Text style={styles.checklistTitle}>
                {UI_STRINGS.TASTE_ANALYSIS.STEP_TITLE}
              </Text>

              <View style={styles.stepsList}>
                {/* Step 1: 사진 데이터 수집 완료 */}
                <View style={styles.stepRow} testID='step-1'>
                  <View style={styles.checkedCircleIcon}>
                    <Feather name='check' size={14} color='#FFFFFF' />
                  </View>
                  <Text style={styles.activeStepText}>
                    {UI_STRINGS.TASTE_ANALYSIS.STEP_1}
                  </Text>
                </View>

                {/* Step 2: 여행 성향 분석 중... */}
                <View style={styles.stepRow} testID='step-2'>
                  {stepIndex >= 2 ? (
                    <View style={styles.checkedCircleIcon}>
                      <Feather name='check' size={14} color='#FFFFFF' />
                    </View>
                  ) : (
                    <View style={styles.loadingCircleIcon}>
                      <ActivityIndicator size='small' color={palette.primary} />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.stepText,
                      stepIndex >= 1 && styles.activeStepText,
                    ]}>
                    {UI_STRINGS.TASTE_ANALYSIS.STEP_2}
                  </Text>
                </View>

                {/* Step 3: 맞춤 코스 생성 대기 */}
                <View style={styles.stepRow} testID='step-3'>
                  <View style={styles.pendingCircleIcon}>
                    <View style={styles.pendingDotInner} />
                  </View>
                  <Text
                    style={[
                      styles.stepText,
                      stepIndex >= 2
                        ? styles.activeStepText
                        : styles.pendingStepText,
                    ]}>
                    {UI_STRINGS.TASTE_ANALYSIS.STEP_3}
                  </Text>
                </View>
              </View>
            </View>

            {/* Insights Live Container */}
            <View style={styles.insightsContainer} testID='insights-container'>
              <View style={styles.insightsHeader}>
                <Text style={styles.insightsTitle}>
                  {UI_STRINGS.TASTE_ANALYSIS.INSIGHTS_TITLE}
                </Text>
                <View style={styles.liveBadge}>
                  <Animated.View
                    style={[styles.liveDot, { opacity: pulseAnim }]}
                  />
                  <Text style={styles.liveBadgeText}>
                    {UI_STRINGS.TASTE_ANALYSIS.INSIGHTS_BADGE}
                  </Text>
                </View>
              </View>
            </View>

            {errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}
          </View>
        </View>
      </SafeAreaView>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerSection: {
    gap: 8,
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
    gap: 24,
    paddingTop: 20,
  },
  checklistContainer: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.deepNavy,
    letterSpacing: -0.16,
  },
  stepsList: {
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkedCircleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCircleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCircleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.mutedText,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeStepText: {
    color: palette.deepNavy,
  },
  pendingStepText: {
    color: palette.mutedText,
  },
  insightsContainer: {
    gap: 12,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.deepNavy,
    letterSpacing: -0.16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.primary,
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.primary,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
});
