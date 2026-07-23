/**
 * @file CourseGeneratingScreen.tsx
 * @description Screen displaying SSE streaming loading state and real-time progress feedback following Yeolo UI v1.
 * @requirements REQ-7
 * @functional FUN-6
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCourseStore, DEFAULT_API_URL } from '@yeolo/common';
import type { CourseCreateRequest } from '@yeolo/common';

export interface CourseGeneratingScreenProps {
  requestData?: CourseCreateRequest | null;
  progressMessage?: string | null;
  error?: string | null;
  createdCourseId?: string | null;
  onComplete?: (courseId: string) => void;
  onRetry?: () => void;
}

export const CourseGeneratingScreen: React.FC<CourseGeneratingScreenProps> = ({
  requestData,
  progressMessage: propProgressMessage,
  error: propError,
  createdCourseId: propCreatedCourseId,
  onComplete,
  onRetry,
}) => {
  const store = useCourseStore();

  const activeCreatedCourseId =
    propCreatedCourseId !== undefined ? propCreatedCourseId : store.createdCourseId;
  const activeProgressMessage =
    propProgressMessage !== undefined ? propProgressMessage : store.progressMessage;
  const activeError =
    propError !== undefined ? propError : store.error;

  useEffect(() => {
    if (!requestData) return;

    let isSubscribed = true;
    const startGeneration = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;
      if (isSubscribed) {
        await store.createCourse(apiUrl, requestData, token || undefined);
      }
    };

    startGeneration();

    return () => {
      isSubscribed = false;
    };
  }, [requestData]);

  useEffect(() => {
    if (activeCreatedCourseId) {
      onComplete?.(activeCreatedCourseId);
    }
  }, [activeCreatedCourseId, onComplete]);

  const handleRetry = () => {
    store.resetCourseState();
    onRetry?.();
  };

  if (activeError) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" style={styles.errorIcon} />
          <Text style={styles.errorTitle}>코스 생성 중 오류가 발생했습니다.</Text>
          <Text testID="error-subtitle" style={styles.errorSubtitle}>{activeError}</Text>
          <TouchableOpacity testID="retry-btn" style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
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
          <Ionicons name="sparkles" size={14} color="#4648D4" />
          <Text style={styles.badgeText}>여로 AI 스마트 알고리즘</Text>
        </View>

        {/* Activity Ring Spinner */}
        <View style={styles.spinnerWrapper}>
          <ActivityIndicator size="large" color="#4648D4" style={styles.spinner} />
        </View>

        <Text style={styles.title}>맞춤 여행 코스 생성 중</Text>

        <Text testID="progress-text" style={styles.progressText}>
          {activeProgressMessage || '사용자 성향 프로필을 분석하고 최적의 경로를 생성 중입니다.'}
        </Text>

        <View style={styles.tipBox}>
          <Ionicons name="bulb-outline" size={16} color="#4648D4" style={styles.tipIcon} />
          <Text style={styles.tipText}>
            여로 AI가 성향 데이터, 장소 간 이동 동선, 예산 분포를 종합 분석하고 있습니다.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#F6FAFE',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  glassCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#4648D4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    gap: 6,
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4648D4',
  },
  spinnerWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
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
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4648D4',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    minHeight: 40,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#64748B',
    lineHeight: 17,
  },
  errorCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000000',
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
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CourseGeneratingScreen;
