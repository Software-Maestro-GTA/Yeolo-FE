/**
 * @file CourseGeneratingScreen.tsx
 * @description Screen displaying SSE streaming course generation progress with linear gradient progress bar.
 * @requirements REQ-8
 * @functional FUN-6
 * @author Antigravity Agent
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import { useCourseStore } from '@yeolo/common';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick, COURSE_LIST_QUERY_KEY } from '../hooks';

export interface CourseGeneratingScreenProps {
  onComplete?: (courseId: string) => void;
  onRetry?: () => void;
  onNavigateToIntro?: () => void;
}

export const CourseGeneratingScreen: React.FC<CourseGeneratingScreenProps> = ({
  onComplete,
  onRetry,
  onNavigateToIntro,
}) => {
  useGA4ScreenTracking('CourseGeneratingScreen');
  const { trackButtonClick } = useGA4ButtonClick();
  const queryClient = useQueryClient();

  const { createdCourseId, progressMessage, error, resetCourseState } = useCourseStore();

  useEffect(() => {
    if (createdCourseId) {
      queryClient.invalidateQueries({ queryKey: COURSE_LIST_QUERY_KEY });
      onComplete?.(createdCourseId);
    }
  }, [createdCourseId, onComplete, queryClient]);

  const handleRetry = () => {
    trackButtonClick('btn_course_generating_retry', 'Retry Course Generation');
    resetCourseState();
    onRetry?.();
  };

  const handleGoIntro = () => {
    trackButtonClick('btn_course_generating_go_intro', 'Navigate to Intro from Course Error');
    resetCourseState();
    onNavigateToIntro?.();
  };

  if (error) {
    return (
      <View style={styles.screenContainer}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.errorContainer}>
            <View style={styles.errorCard}>
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color="#EF4444"
                style={styles.errorIcon}
              />
              <Text style={styles.errorTitle}>코스 생성 중 오류가 발생했습니다</Text>
              <Text style={styles.errorSubtitle}>{error}</Text>

              <View style={styles.errorButtonContainer}>
                {onNavigateToIntro && (
                  <TouchableOpacity
                    testID="go-intro-btn"
                    style={styles.introButton}
                    onPress={handleGoIntro}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.introButtonText}>시작 화면으로 이동</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  testID="retry-btn"
                  style={styles.retryButton}
                  onPress={handleRetry}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryButtonText}>다시 시도하기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.contentContainer}>
          {/* Main Body Section */}
          <View style={styles.mainBodyContainer} testID="main-content">
            {/* Title Group */}
            <View style={styles.titleGroup} testID="title-group">
              <Text style={styles.mainTitle}>{UI_STRINGS.COURSE_GENERATING.MAIN_TITLE}</Text>
              <Text style={styles.subTitle}>{UI_STRINGS.COURSE_GENERATING.SUB_TITLE}</Text>
            </View>

            {/* Checklist Card */}
            <View style={styles.checklistCard} testID="checklist-card">
              {/* Step 1: 사용자 취향 불러오기 (Completed) */}
              <View style={styles.stepRow} testID="step-1">
                <View style={styles.completedCircle}>
                  <Feather name="check" size={12} color="#FFFFFF" />
                </View>
                <Text style={styles.completedStepText}>
                  {UI_STRINGS.COURSE_GENERATING.STEP_1}
                </Text>
              </View>

              {/* Divider Line */}
              <View style={styles.dividerLine} />

              {/* Step 2: 여행 코스 생성 중 (In Progress) */}
              <View style={styles.stepRow} testID="step-2">
                <View style={styles.loadingCircle}>
                  <ActivityIndicator size="small" color={palette.primary} />
                </View>
                <Text style={styles.activeStepText}>
                  {UI_STRINGS.COURSE_GENERATING.STEP_2}
                </Text>
              </View>
            </View>

            {/* Progress Bar Container */}
            <View style={styles.progressBarContainer} testID="progress-bar-container">
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={[palette.primary, palette.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: '60%' }]}
                />
              </View>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressStatusText} testID="progress-text">
                  {progressMessage || UI_STRINGS.COURSE_GENERATING.PROGRESS_LABEL}
                </Text>
                <Text style={styles.progressPercentageText}>60%</Text>
              </View>
            </View>

            {/* Bottom SubText */}
            <View style={styles.bottomSubTextGroup}>
              <Text style={styles.bottomSubText}>{UI_STRINGS.COURSE_GENERATING.BOTTOM_DESC_1}</Text>
              <Text style={styles.bottomSubText}>{UI_STRINGS.COURSE_GENERATING.BOTTOM_DESC_2}</Text>
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
    backgroundColor: palette.softMint, // #F5FAF8
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
    color: palette.deepNavy, // #0D2137
    textAlign: 'center',
    lineHeight: 28,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#45464C',
    textAlign: 'center',
    lineHeight: 18,
  },
  checklistCard: {
    backgroundColor: palette.white, // #FFFFFF
    borderWidth: 1,
    borderColor: '#E0E8E5',
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
    backgroundColor: palette.accent, // #00C9A7
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedStepText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E0E8E5',
    width: '100%',
  },
  loadingCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStepText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.deepNavy,
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
    backgroundColor: 'rgba(45, 125, 210, 0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
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
    color: palette.primary, // #2D7DD2
  },
  progressPercentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.primary, // #2D7DD2
  },
  bottomSubTextGroup: {
    alignItems: 'center',
    gap: 4,
  },
  bottomSubText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#45464C',
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
    color: '#EF4444',
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
    color: '#FFFFFF',
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
