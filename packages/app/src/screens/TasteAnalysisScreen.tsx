/**
 * @file TasteAnalysisScreen.tsx
 * @description Taste analysis progress screen with dynamic insights container and step indicators.
 */
import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useTasteAnalysisPipeline } from '../hooks';

interface TasteAnalysisScreenProps {
  onFinish: (tasteProfileId: string) => void;
  onFail?: () => void;
}

export const TasteAnalysisScreen: React.FC<TasteAnalysisScreenProps> = ({
  onFinish,
  onFail,
}) => {
  useGA4ScreenTracking('TasteAnalysisScreen');
  const {
    runPipeline,
    error: errorMessage,
    progress,
  } = useTasteAnalysisPipeline();

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

    const executePipeline = async () => {
      const profileId = await runPipeline();

      if (!isSubscribed) return;

      if (profileId) {
        // 3단계 완료 후 1초(1000ms) 텀을 두고 다음 화면으로 전환
        completionTimeout = setTimeout(() => {
          if (isSubscribed) {
            onFinish(profileId);
          }
        }, 1000);
      }
    };

    executePipeline();

    return () => {
      isSubscribed = false;
      if (completionTimeout) clearTimeout(completionTimeout);
    };
  }, [runPipeline, onFinish]);

  const handleConfirmError = () => {
    onFail?.();
  };

  const renderStepIcon = (status: 'IDLE' | 'IN_PROGRESS' | 'COMPLETED') => {
    if (status === 'COMPLETED') {
      return (
        <View style={styles.checkedCircleIcon}>
          <Feather name='check' size={14} color={palette.white} />
        </View>
      );
    }
    if (status === 'IN_PROGRESS') {
      return (
        <View style={styles.loadingCircleIcon}>
          <ActivityIndicator size='small' color={palette.primary} />
        </View>
      );
    }
    return (
      <View style={styles.pendingCircleIcon}>
        <View style={styles.pendingDotInner} />
      </View>
    );
  };

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
                {/* Step 1: 메타데이터 추출 / 사진 데이터 수집 */}
                <View style={styles.stepRow} testID='step-1'>
                  {renderStepIcon(progress.step1Status)}
                  <Text
                    style={[
                      styles.stepText,
                      progress.step1Status !== 'IDLE' && styles.activeStepText,
                    ]}>
                    {UI_STRINGS.TASTE_ANALYSIS.STEP_1}
                  </Text>
                </View>

                {/* Step 2: 장소 정보 수집 */}
                <View style={styles.stepRow} testID='step-2'>
                  {renderStepIcon(progress.step2Status)}
                  <Text
                    style={[
                      styles.stepText,
                      progress.step2Status !== 'IDLE' && styles.activeStepText,
                    ]}>
                    {UI_STRINGS.TASTE_ANALYSIS.STEP_2}
                  </Text>
                </View>

                {/* Step 3: 사용자 취향 분석 */}
                <View style={styles.stepRow} testID='step-3'>
                  {renderStepIcon(progress.step3Status)}
                  <Text
                    style={[
                      styles.stepText,
                      progress.step3Status !== 'IDLE'
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

              <View style={styles.insightsCard}>
                <Text style={styles.insightsNoticeText}>
                  {progress.currentMessage ||
                    UI_STRINGS.TASTE_ANALYSIS.DEFAULT_INSIGHT_MESSAGE}
                </Text>
              </View>
            </View>

            {errorMessage && (
              <View style={styles.errorCard} testID='error-container'>
                <View style={styles.errorHeader}>
                  <Feather
                    name='alert-circle'
                    size={20}
                    color={palette.red500}
                  />
                  <Text style={styles.errorCardTitle}>
                    {UI_STRINGS.TASTE_ANALYSIS.ERROR_CARD_TITLE}
                  </Text>
                </View>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity
                  style={styles.confirmButton}
                  activeOpacity={0.8}
                  onPress={handleConfirmError}
                  testID='error-confirm-button'>
                  <Text style={styles.confirmButtonText}>
                    {UI_STRINGS.COMMON.CONFIRM}
                  </Text>
                </TouchableOpacity>
              </View>
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
    borderColor: palette.gray200,
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
  insightsCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightsNoticeText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.subText,
  },
  errorCard: {
    backgroundColor: palette.red50,
    borderWidth: 1,
    borderColor: palette.red200,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    alignItems: 'center',
    shadowColor: palette.red500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.red800,
  },
  errorText: {
    fontSize: 14,
    color: palette.red700,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.white,
  },
});
