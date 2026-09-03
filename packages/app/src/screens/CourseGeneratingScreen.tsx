/**
 * @file CourseGeneratingScreen.tsx
 * @description Screen displaying SSE streaming course generation progress using design tokens (palette, hexToRgba) and string constants (UI_STRINGS).
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import { useCourseStore } from '@yeolo/common';
import { palette, hexToRgba } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import {
  useGA4ScreenTracking,
  useGA4ButtonClick,
  COURSE_LIST_QUERY_KEY,
} from '../hooks';

export interface CourseGeneratingScreenProps {
  onComplete?: (courseId: string) => void;
  onRetry?: () => void;
  onNavigateToIntro?: () => void;
}

type StepStatus = 'pending' | 'loading' | 'completed';

export const CourseGeneratingScreen: React.FC<CourseGeneratingScreenProps> = ({
  onComplete,
  onRetry,
  onNavigateToIntro,
}) => {
  useGA4ScreenTracking('CourseGeneratingScreen');
  const { trackButtonClick } = useGA4ButtonClick();
  const queryClient = useQueryClient();

  const {
    createdCourseId,
    progressStep,
    progressMessage,
    error,
    resetCourseState,
  } = useCourseStore();

  // Progress Bar Animation Value (0 ~ 100)
  const progressAnim = useRef(new Animated.Value(5)).current;
  const [displayPercentage, setDisplayPercentage] = useState<number>(5);

  // Sync listener to update percentage text
  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {
      setDisplayPercentage(Math.min(100, Math.round(value)));
    });
    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, [progressAnim]);

  // Compute Checklist Card statuses
  let step1Status: StepStatus = 'pending';
  let step2Status: StepStatus = 'pending';

  if (createdCourseId || progressStep === 'COMPLETE') {
    step1Status = 'completed';
    step2Status = 'completed';
  } else if (progressStep === 'GENERATING_COURSE') {
    step1Status = 'completed';
    step2Status = 'loading';
  } else if (progressStep === 'LOADING_TASTE_PREFERENCE') {
    step1Status = 'loading';
    step2Status = 'pending';
  }

  // Handle Continuous Logarithmic Progress Animation
  useEffect(() => {
    if (createdCourseId || progressStep === 'COMPLETE') {
      // Smoothly animate from current percentage up to 100% without jump
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 700,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
      return;
    }

    let targetValue = 65;
    let animDuration = 1800;

    if (progressStep === 'GENERATING_COURSE') {
      targetValue = 92;
      animDuration = 2200;
    } else if (progressStep === 'LOADING_TASTE_PREFERENCE') {
      targetValue = 65;
      animDuration = 1600;
    }

    // Logarithmic Easing curve (fast initial boost from current value to target)
    Animated.timing(progressAnim, {
      toValue: targetValue,
      duration: animDuration,
      easing: Easing.out(Easing.poly(3)),
      useNativeDriver: false,
    }).start();

    // Smooth creeping effect up to 96% while waiting for completion
    const creepingInterval = setInterval(() => {
      progressAnim.stopAnimation((currentVal) => {
        if (currentVal < 96) {
          const nextVal = Math.min(96, currentVal + 0.25);
          Animated.timing(progressAnim, {
            toValue: nextVal,
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: false,
          }).start();
        }
      });
    }, 300);

    return () => {
      clearInterval(creepingInterval);
    };
  }, [createdCourseId, progressStep, progressAnim]);

  // 1-second delay before navigating to Course Detail screen upon completion
  useEffect(() => {
    if (!createdCourseId) return;

    queryClient.invalidateQueries({ queryKey: COURSE_LIST_QUERY_KEY });

    const timer = setTimeout(() => {
      onComplete?.(createdCourseId);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [createdCourseId, onComplete, queryClient]);

  const handleRetry = () => {
    trackButtonClick('btn_course_generating_retry', 'Retry Course Generation');
    resetCourseState();
    onRetry?.();
  };

  const handleGoIntro = () => {
    trackButtonClick(
      'btn_course_generating_go_intro',
      'Navigate to Intro from Course Error',
    );
    resetCourseState();
    onNavigateToIntro?.();
  };

  if (error) {
    return (
      <View style={styles.screenContainer}>
        <SafeAreaView
          style={styles.safeArea}
          edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.errorContainer}>
            <View style={styles.errorCard}>
              <Ionicons
                name='alert-circle-outline'
                size={48}
                color={palette.red500}
                style={styles.errorIcon}
              />
              <Text style={styles.errorTitle}>
                {UI_STRINGS.COURSE_GENERATING.ERROR_TITLE}
              </Text>
              <Text style={styles.errorSubtitle}>{error}</Text>

              <View style={styles.errorButtonContainer}>
                {onNavigateToIntro && (
                  <TouchableOpacity
                    testID='go-intro-btn'
                    style={styles.introButton}
                    onPress={handleGoIntro}
                    activeOpacity={0.8}>
                    <Text style={styles.introButtonText}>
                      {UI_STRINGS.COURSE_GENERATING.GO_INTRO_BTN}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  testID='retry-btn'
                  style={styles.retryButton}
                  onPress={handleRetry}
                  activeOpacity={0.8}>
                  <Text style={styles.retryButtonText}>
                    {UI_STRINGS.COURSE_GENERATING.RETRY_BTN}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const renderStepIndicator = (status: StepStatus, testIdPrefix: string) => {
    if (status === 'completed') {
      return (
        <View
          style={styles.completedCircle}
          testID={`${testIdPrefix}-completed`}>
          <Feather name='check' size={12} color={palette.white} />
        </View>
      );
    }
    if (status === 'loading') {
      return (
        <View style={styles.loadingCircle} testID={`${testIdPrefix}-loading`}>
          <ActivityIndicator size='small' color={palette.primary} />
        </View>
      );
    }
    return (
      <View style={styles.pendingCircle} testID={`${testIdPrefix}-pending`}>
        <View style={styles.innerPendingDot} />
      </View>
    );
  };

  const renderStepText = (status: StepStatus, label: string) => {
    if (status === 'completed') {
      return <Text style={styles.completedStepText}>{label}</Text>;
    }
    if (status === 'loading') {
      return <Text style={styles.activeStepText}>{label}</Text>;
    }
    return <Text style={styles.pendingStepText}>{label}</Text>;
  };

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.contentContainer}>
          {/* Main Body Section */}
          <View style={styles.mainBodyContainer} testID='main-content'>
            {/* Title Group */}
            <View style={styles.titleGroup} testID='title-group'>
              <Text style={styles.mainTitle}>
                {UI_STRINGS.COURSE_GENERATING.MAIN_TITLE}
              </Text>
              <Text style={styles.subTitle}>
                {UI_STRINGS.COURSE_GENERATING.SUB_TITLE}
              </Text>
            </View>

            {/* Checklist Card */}
            <View style={styles.checklistCard} testID='checklist-card'>
              {/* Step 1: 사용자 취향 불러오기 */}
              <View style={styles.stepRow} testID='step-1'>
                {renderStepIndicator(step1Status, 'step-1')}
                {renderStepText(
                  step1Status,
                  UI_STRINGS.COURSE_GENERATING.STEP_1,
                )}
              </View>

              {/* Divider Line */}
              <View style={styles.dividerLine} />

              {/* Step 2: 여행 코스 생성 중 */}
              <View style={styles.stepRow} testID='step-2'>
                {renderStepIndicator(step2Status, 'step-2')}
                {renderStepText(
                  step2Status,
                  UI_STRINGS.COURSE_GENERATING.STEP_2,
                )}
              </View>
            </View>

            {/* Progress Bar Container */}
            <View
              style={styles.progressBarContainer}
              testID='progress-bar-container'>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFillWrapper,
                    { width: animatedWidth },
                  ]}>
                  <LinearGradient
                    colors={[palette.primary, palette.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressFillGradient}
                  />
                </Animated.View>
              </View>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressStatusText} testID='progress-text'>
                  {progressMessage ||
                    UI_STRINGS.COURSE_GENERATING.PROGRESS_LABEL}
                </Text>
                <Text style={styles.progressPercentageText}>
                  {displayPercentage}%
                </Text>
              </View>
            </View>

            {/* Bottom SubText */}
            <View style={styles.bottomSubTextGroup}>
              <Text style={styles.bottomSubText}>
                {UI_STRINGS.COURSE_GENERATING.BOTTOM_DESC_1}
              </Text>
              <Text style={styles.bottomSubText}>
                {UI_STRINGS.COURSE_GENERATING.BOTTOM_DESC_2}
              </Text>
            </View>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mainBodyContainer: {
    gap: 28,
    alignItems: 'center',
    width: '100%',
  },
  titleGroup: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.deepNavy,
    textAlign: 'center',
    lineHeight: 28,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: palette.subText,
    textAlign: 'center',
    lineHeight: 18,
  },
  checklistCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    width: '100%',
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedStepText: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.mutedText,
    textDecorationLine: 'line-through',
  },
  dividerLine: {
    height: 1,
    backgroundColor: palette.gray200,
    width: '100%',
  },
  loadingCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: palette.gray400,
    backgroundColor: palette.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerPendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.gray400,
  },
  activeStepText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  pendingStepText: {
    fontSize: 15,
    fontWeight: '400',
    color: palette.mutedText,
  },
  progressBarContainer: {
    width: '100%',
    paddingHorizontal: 10,
    gap: 8,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: hexToRgba(palette.primary, 0.12),
    overflow: 'hidden',
  },
  progressFillWrapper: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFillGradient: {
    flex: 1,
    height: '100%',
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  progressStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.primary,
  },
  progressPercentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.primary,
  },
  bottomSubTextGroup: {
    alignItems: 'center',
    gap: 4,
  },
  bottomSubText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.subText,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorCard: {
    width: '100%',
    backgroundColor: palette.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.red500,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: palette.subText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorButtonContainer: {
    width: '100%',
    gap: 10,
  },
  introButton: {
    backgroundColor: palette.primary,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  introButtonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: palette.softMint,
    borderWidth: 1,
    borderColor: palette.gray200,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: palette.deepNavy,
    fontSize: 15,
    fontWeight: '600',
  },
});
