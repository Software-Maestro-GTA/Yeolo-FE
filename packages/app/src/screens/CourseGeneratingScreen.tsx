/**
 * @file CourseGeneratingScreen.tsx
 * @description 공통 추정 진행률로 코스 생성 게이지를 표시하며 뒤로가기·완료·연결 중단 안내를 처리합니다.
 */
import CompletedRingSvg from '../../assets/images/figma-course/completed-ring.svg';
import BackSvg from '../../assets/images/figma-course/back.svg';
import CompletedCheckSvg from '../../assets/images/figma-course/completed-check.svg';
import LoadingRingSvg from '../../assets/images/figma-course/loading-ring.svg';
import { LoopingVideo } from '../components/common/LoopingVideo';
import { Text } from '../components/common/Typography';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  AppState,
  type AppStateStatus,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import { useCourseStore } from '@yeolo/common';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { FigmaAsset } from '../components/common/FigmaAsset';
import { useCourseGenerationProgress } from '../hooks/useCourseGenerationProgress';
import {
  useGA4ScreenTracking,
  useGA4ButtonClick,
  COURSE_LIST_QUERY_KEY,
} from '../hooks';

export interface CourseGeneratingScreenProps {
  progress?: Animated.Value;
  onBack?: () => void;
  onComplete?: (courseId: string) => void;
  onReturnToCreate?: () => void;
  onReturnHome?: () => void;
}

type StepStatus = 'pending' | 'loading' | 'completed';
const GENERATION_STAGE_COUNT = 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * 9;
// Rounded 4pt caps cover 4pt of the gap. Keep another 4pt visibly open
// throughout generation; only a saved course replaces the arc with a check.
const RING_WORKING_GAP = 8;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CourseGeneratingScreen: React.FC<CourseGeneratingScreenProps> = ({
  progress: sharedProgress,
  onBack,
  onComplete,
  onReturnToCreate,
  onReturnHome,
}) => {
  useGA4ScreenTracking('CourseGeneratingScreen');
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const safeAreaStyles = StyleSheet.create({
    // The video starts at y=145; the caption remains at y=456 on the 844pt canvas.
    // BackgroundImageLayout already reserves the top safe area.
    content: {
      paddingTop: Math.max(24, windowHeight * (145 / 844) - insets.top),
      paddingBottom: insets.bottom + 36,
    },
  });
  const { trackButtonClick } = useGA4ButtonClick();
  const queryClient = useQueryClient();

  const {
    createdCourseId,
    progressStep,
    progressMessage,
    error,
    errorReason,
    resetCourseState,
  } = useCourseStore();

  const strings = UI_STRINGS.COURSE_GENERATING;
  const interruptionHandled = useRef(false);
  useEffect(() => {
    if (!error || errorReason !== 'background_interrupted') {
      interruptionHandled.current = false;
      return;
    }
    const returnHome = (state: AppStateStatus) => {
      if (state !== 'active' || interruptionHandled.current || !onReturnHome)
        return;
      interruptionHandled.current = true;
      resetCourseState();
      onReturnHome();
    };
    const subscription = AppState.addEventListener('change', returnHome);
    returnHome(AppState.currentState);
    return () => subscription.remove();
  }, [error, errorReason, onReturnHome, resetCourseState]);
  const completed = Boolean(createdCourseId);
  const progressAnim = useCourseGenerationProgress({
    active: true,
    completed,
    error,
    sharedProgress,
  });
  const [displayPercentage, setDisplayPercentage] = useState(
    createdCourseId ? 100 : 5,
  );
  const animatedWidth = useMemo(
    () =>
      progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
      }),
    [progressAnim],
  );
  const animatedRingOffset = useMemo(
    () =>
      progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [RING_CIRCUMFERENCE, RING_WORKING_GAP],
        extrapolate: 'clamp',
      }),
    [progressAnim],
  );

  useEffect(() => {
    // Only accessibility text needs React state; both shapes consume the same
    // animated value directly, without waiting for rounded percentage updates.
    const listener = progressAnim.addListener(({ value }) => {
      setDisplayPercentage(Math.max(0, Math.min(100, Math.round(value))));
    });
    return () => progressAnim.removeListener(listener);
  }, [progressAnim]);

  // Public SSE exposes taste loading and combined course generation only.
  // Internal place/route validation can repeat and is not forwarded by BE.
  // Only a persisted course ID confirms completion; step/message strings cannot.
  const step1Status: StepStatus =
    completed || progressStep === 'GENERATING_COURSE'
      ? 'completed'
      : progressStep === 'LOADING_TASTE_PREFERENCE'
        ? 'loading'
        : 'pending';
  const step2Status: StepStatus = completed
    ? 'completed'
    : progressStep === 'GENERATING_COURSE'
      ? 'loading'
      : 'pending';
  const completedStages = completed
    ? GENERATION_STAGE_COUNT
    : step1Status === 'completed'
      ? 1
      : 0;
  const progressLabel = strings.COMPLETED_STAGES(
    completedStages,
    GENERATION_STAGE_COUNT,
  );
  const progressTitle = completed
    ? strings.COMPLETE_TITLE
    : progressMessage || strings.MAIN_TITLE;

  // 1-second delay before navigating to Course Detail screen upon completion
  useEffect(() => {
    if (!createdCourseId || error) return;

    queryClient.invalidateQueries({ queryKey: COURSE_LIST_QUERY_KEY });

    const timer = setTimeout(() => {
      onComplete?.(createdCourseId);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [createdCourseId, error, onComplete, queryClient]);

  const handleReturnToCreate = () => {
    trackButtonClick(
      'btn_course_generating_return_to_create',
      'Return to Course Create from Course Error',
    );
    resetCourseState();
    onReturnToCreate?.();
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
                <TouchableOpacity
                  testID='return-to-create-btn'
                  accessibilityRole='button'
                  style={styles.returnButton}
                  onPress={handleReturnToCreate}
                  activeOpacity={0.8}>
                  <Text style={styles.returnButtonText}>
                    {UI_STRINGS.COURSE_GENERATING.RETURN_TO_CREATE_BTN}
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
          <Svg
            width={22}
            height={22}
            viewBox='0 0 22 22'
            style={styles.loadingArc}
            accessible={false}>
            <AnimatedCircle
              testID={`${testIdPrefix}-progress-arc`}
              cx={11}
              cy={11}
              r={9}
              fill='none'
              stroke={palette.primary}
              strokeWidth={4}
              strokeLinecap='round'
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={animatedRingOffset}
              transform='rotate(-90 11 11)'
            />
          </Svg>
        </View>
      );
    }
    return (
      <View style={styles.indicator} testID={`${testIdPrefix}-pending`}>
        <FigmaAsset source={LoadingRingSvg} width={22} height={22} />
      </View>
    );
  };

  const renderStep = (
    status: StepStatus,
    label: string,
    testId: string,
    description?: string,
  ) => {
    const statusLabel =
      status === 'completed'
        ? strings.STATUS_COMPLETED
        : status === 'loading'
          ? strings.STATUS_LOADING
          : strings.STATUS_PENDING;
    return (
      <View
        testID={testId}
        accessible
        accessibilityLabel={`${label}, ${statusLabel}${status === 'loading' && description ? `. ${description}` : ''}`}
        accessibilityState={{ busy: status === 'loading' }}>
        <View style={styles.stepRow}>
          {renderStepIndicator(status, testId)}
          <Text style={styles.stepText} numberOfLines={1} adjustsFontSizeToFit>
            {label}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.safeArea}>
        {onBack && (
          <TouchableOpacity
            testID='course-generating-back'
            accessibilityRole='button'
            accessibilityLabel={strings.BACK}
            accessibilityHint={strings.CONTINUE_ELSEWHERE}
            style={styles.backButton}
            onPress={onBack}>
            <FigmaAsset source={BackSvg} width={24} height={24} />
          </TouchableOpacity>
        )}
        <ScrollView
          contentContainerStyle={[
            styles.contentContainer,
            safeAreaStyles.content,
          ]}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          showsVerticalScrollIndicator={false}>
          <View style={styles.mainBodyContainer} testID='main-content'>
            <LoopingVideo
              source={require('../../assets/figma-v3/screen-media/course-generation.mp4')}
              poster={require('../../assets/figma-v3/screen-media/course-generation-poster.png')}
              style={styles.generationVideo}
              testID='course-generation-video'
            />
            <View
              style={styles.progressBarContainer}
              testID='progress-bar-container'
              accessible
              accessibilityRole='progressbar'
              accessibilityLabel={`${progressTitle}. ${strings.PROGRESS_LABEL}`}
              accessibilityValue={{
                min: 0,
                max: 100,
                now: displayPercentage,
                text: completed
                  ? progressLabel
                  : `${strings.ESTIMATED_PROGRESS(displayPercentage)}. ${progressLabel}`,
              }}>
              <Text style={styles.mainTitle} testID='progress-text'>
                {progressTitle}
              </Text>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[styles.progressFillWrapper, { width: animatedWidth }]}
                />
              </View>
            </View>
            <View style={styles.checklistCard} testID='checklist-card'>
              {renderStep(
                step1Status,
                strings.STEP_1,
                'step-1',
                strings.TASTE_DESCRIPTION,
              )}
              {renderStep(
                step2Status,
                strings.STEP_2,
                'step-2',
                strings.GENERATION_DESCRIPTION,
              )}
              {renderStep(
                completed ? 'completed' : 'pending',
                strings.COMPLETE_NOTICE,
                'step-3',
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 0,
    left: 14,
    zIndex: 1,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenContainer: { flex: 1, backgroundColor: palette.white },
  safeArea: { flex: 1 },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  generationVideo: {
    width: 320,
    maxWidth: '100%',
    aspectRatio: 320 / 280,
    marginBottom: 31,
  },
  mainBodyContainer: { alignItems: 'center', width: '100%' },
  mainTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.legacyCaption,
    textAlign: 'center',
    lineHeight: 19,
    letterSpacing: -1,
  },
  checklistCard: {
    marginTop: 50,
    gap: 13,
    width: 249,
    maxWidth: '100%',
    alignSelf: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 37,
  },
  stepText: {
    fontSize: 20,
    lineHeight: 37,
    fontWeight: '500',
    color: palette.legacyText,
    letterSpacing: -1,
    flexShrink: 1,
  },
  indicator: { width: 22, height: 22 },
  completedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.transparent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCheck: { position: 'absolute', top: 5, left: 5 },
  loadingCircle: { width: 22, height: 22 },
  loadingArc: { position: 'absolute', width: 22, height: 22 },
  progressBarContainer: { width: '100%', alignItems: 'center', gap: 16 },
  progressTrack: {
    width: 249,
    maxWidth: '100%',
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
  returnButton: {
    backgroundColor: palette.primary,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  returnButtonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
