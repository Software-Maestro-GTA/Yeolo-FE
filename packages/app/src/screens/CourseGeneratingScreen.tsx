/**
 * @file CourseGeneratingScreen.tsx
 * @description Screen displaying SSE streaming loading state and real-time progress feedback following Yeolo UI v1.
 * @requirements REQ-7, REQ-22
 * @functional FUN-6, FUN-GA4
 * @api API-FB-4
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
import { Ionicons } from '@expo/vector-icons';
import { useCourseStore } from '@yeolo/common';
import { theme } from '../theme';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface CourseGeneratingScreenProps {
  onComplete?: (courseId: string) => void;
  onRetry?: () => void;
}

export const CourseGeneratingScreen: React.FC<CourseGeneratingScreenProps> = ({
  onComplete,
  onRetry,
}) => {
  useGA4ScreenTracking('CourseGeneratingScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const { createdCourseId, progressMessage, error, resetCourseState } = useCourseStore();

  useEffect(() => {
    if (createdCourseId) {
      onComplete?.(createdCourseId);
    }
  }, [createdCourseId, onComplete]);

  const handleRetry = () => {
    trackButtonClick('btn_course_generating_retry', 'Retry Course Generation');
    resetCourseState();
    onRetry?.();
  };

  if (error) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.status.error} style={styles.errorIcon} />
          <Text style={styles.errorTitle}>{UI_STRINGS.COURSE_GENERATING.ERROR_TITLE}</Text>
          <Text testID="error-subtitle" style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity testID="retry-btn" style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>{UI_STRINGS.COURSE_DETAIL.RETRY_BUTTON}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.centerContainer}>
      <View style={styles.glassCard}>
        {/* Sparkle Badge */}
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={14} color={theme.colors.primary} />
          <Text style={styles.badgeText}>{UI_STRINGS.COURSE_GENERATING.BADGE_TEXT}</Text>
        </View>

        {/* Activity Ring Spinner */}
        <View style={styles.spinnerWrapper}>
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
        </View>

        <Text style={styles.title}>{UI_STRINGS.COURSE_GENERATING.TITLE}</Text>

        <Text testID="progress-text" style={styles.progressText}>
          {progressMessage || UI_STRINGS.COURSE_GENERATING.DEFAULT_PROGRESS}
        </Text>

        <View style={styles.tipBox}>
          <Ionicons name="bulb-outline" size={16} color={theme.colors.primary} style={styles.tipIcon} />
          <Text style={styles.tipText}>
            {UI_STRINGS.COURSE_GENERATING.TIP_TEXT}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg.screen,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  glassCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.bg.card,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    gap: 6,
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  spinnerWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  spinner: {
    transform: [{ scale: 1.2 }],
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    minHeight: 40,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.bg.input,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: 14,
    borderRadius: 14,
    gap: 8,
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.subtle,
    lineHeight: 17,
  },
  errorCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.bg.card,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
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
    color: theme.colors.status.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: theme.colors.text.subtle,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.text.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
