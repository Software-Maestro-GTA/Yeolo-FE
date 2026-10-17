/**
 * @file CourseGeneratingScreen.tsx
 * @description Displays SSE course progress and delayed completion, stopping visual animations on failure or unmount.
 */
import CompletedRingSvg from '../../assets/images/figma-course/completed-ring.svg';
import CompletedCheckSvg from '../../assets/images/figma-course/completed-check.svg';
import LoadingRingSvg from '../../assets/images/figma-course/loading-ring.svg';
import LoadingFillSvg from '../../assets/images/figma-course/loading-fill.svg';
import { Text } from '../components/common/Typography';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useCourseStore } from '@yeolo/common';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { FigmaAsset } from '../components/common/FigmaAsset';
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
  const insets = useSafeAreaInsets();
  const safeAreaStyles = StyleSheet.create({
    content: { paddingBottom: insets.bottom + 36 },
  });
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
  const spinnerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (error) return;
    const spinner = Animated.loop(
      Animated.timing(spinnerAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spinner.start();
    return () => spinner.stop();
  }, [spinnerAnim, error]);
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
    if (error) return;
    if (createdCourseId || progressStep === 'COMPLETE') {
      // Smoothly animate from current percentage up to 100% without jump
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 700,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
      return () => progressAnim.stopAnimation();
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
      progressAnim.stopAnimation();
    };
  }, [createdCourseId, progressStep, progressAnim, error]);

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
          edges={['bottom', 'left', 'right']}>
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
          <FigmaAsset source={CompletedRingSvg} width={22} height={22} />
          <FigmaAsset
            source={CompletedCheckSvg}
            width={12}
            height={12}
            style={styles.completedCheck}
          />
        </View>
      );
    }
    if (status === 'loading') {
      return (
        <View style={styles.loadingCircle} testID={`${testIdPrefix}-loading`}>
          <FigmaAsset source={LoadingRingSvg} width={22} height={22} />
          <Animated.View
            style={[
              styles.spinner,
              {
                transform: [
                  {
                    rotate: spinnerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}>
            <FigmaAsset source={LoadingFillSvg} width={22} height={22} />
          </Animated.View>
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
      <View style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.contentContainer,
            safeAreaStyles.content,
          ]}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          showsVerticalScrollIndicator={false}>
          <View style={styles.mainBodyContainer} testID='main-content'>
            <View
              style={styles.illustration}
              testID='course-loading-illustration'
              accessible={false}
            />
            <View
              style={styles.progressBarContainer}
              testID='progress-bar-container'
              accessibilityRole='progressbar'
              accessibilityValue={{ min: 0, max: 100, now: displayPercentage }}>
              <Text style={styles.mainTitle} testID='progress-text'>
                {progressMessage || UI_STRINGS.COURSE_GENERATING.MAIN_TITLE}
              </Text>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[styles.progressFillWrapper, { width: animatedWidth }]}
                />
              </View>
            </View>
            <View style={styles.checklistCard} testID='checklist-card'>
              <View style={styles.stepRow} testID='step-1'>
                {renderStepIndicator(step1Status, 'step-1')}
                {renderStepText(
                  step1Status,
                  UI_STRINGS.COURSE_GENERATING.STEP_1,
                )}
              </View>
              <View style={styles.stepRow} testID='step-2'>
                {renderStepIndicator(step2Status, 'step-2')}
                {renderStepText(
                  step2Status,
                  UI_STRINGS.COURSE_GENERATING.STEP_2,
                )}
              </View>
              <View style={styles.stepRow} testID='step-3'>
                {renderStepIndicator(step2Status, 'step-3')}
                {renderStepText(
                  step2Status,
                  UI_STRINGS.COURSE_GENERATING.STEP_3,
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: palette.white },
  safeArea: { flex: 1 },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 36,
  },
  mainBodyContainer: { alignItems: 'center', width: '100%' },
  illustration: {
    width: '100%',
    maxWidth: 390,
    aspectRatio: 390 / 300,
    overflow: 'hidden',
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.legacyCaption,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: -0.7,
  },
  checklistCard: {
    marginTop: 46,
    gap: 22,
    alignSelf: 'center',
    paddingHorizontal: 32,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 28,
  },
  completedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.transparent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCheck: { position: 'absolute', top: 5, left: 5 },
  spinner: { position: 'absolute', width: 22, height: 22 },
  completedStepText: {
    fontSize: 20,
    fontWeight: '500',
    color: palette.legacyText,
    letterSpacing: -0.7,
    flexShrink: 1,
  },
  loadingCircle: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: palette.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerPendingDot: { width: 0, height: 0 },
  activeStepText: {
    fontSize: 20,
    fontWeight: '500',
    color: palette.legacyText,
    letterSpacing: -0.7,
    flexShrink: 1,
  },
  pendingStepText: {
    fontSize: 20,
    fontWeight: '500',
    color: palette.legacyText,
    letterSpacing: -0.7,
    flexShrink: 1,
  },
  progressBarContainer: { width: '64%', maxWidth: 300, gap: 18 },
  progressTrack: {
    width: '100%',
    height: 9,
    borderRadius: 5,
    backgroundColor: palette.gray200,
    overflow: 'hidden',
  },
  progressFillWrapper: { height: '100%', backgroundColor: palette.primary },
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
