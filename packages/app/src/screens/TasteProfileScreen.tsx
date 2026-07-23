/**
 * @file TasteProfileScreen.tsx
 * @description Screen component for displaying taste profile analysis results using component-local useState and tasteProfileId request parameter.
 * @requirements REQ-11
 * @functional FUN-4
 * @api API-FB-8
 * @author Antigravity Agent
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTasteProfileApi, ApiError, DEFAULT_API_URL } from '@yeolo/common';
import type { TasteProfile } from '@yeolo/common';
import { TasteProfileView } from '../components/taste/TasteProfileView';
import { GenerateCourseButton } from '../components/common/GenerateCourseButton';
import type { NavTab } from '../components/navigation/BottomNavBar';

export interface TasteProfileScreenProps {
  tasteProfileId?: string;
  onNavigateToAnalysis?: () => void;
  onNavigateToLogin?: () => void;
  onGenerateCourse?: () => void;
  onTabPress?: (tab: NavTab) => void;
  fetcher?: typeof fetchTasteProfileApi;
}

export const TasteProfileScreen: React.FC<TasteProfileScreenProps> = ({
  tasteProfileId,
  onNavigateToAnalysis,
  onNavigateToLogin,
  onGenerateCourse,
  fetcher = fetchTasteProfileApi,
}) => {
  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;
      const profile = await fetcher(apiUrl, token || undefined, tasteProfileId);
      setTasteProfile(profile);
      setIsLoading(false);
      setErrorCode(200);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      const status = err instanceof ApiError ? err.status : 500;
      const message =
        status === 404
          ? '저장된 여행 성향 분석 결과가 없습니다.'
          : errorObj?.message || '성향 프로필을 불러오지 못했습니다.';
      setTasteProfile(null);
      setIsLoading(false);
      setError(message);
      setErrorCode(status);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [tasteProfileId]);

  useEffect(() => {
    if (errorCode === 401) {
      onNavigateToLogin?.();
    }
  }, [errorCode]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4648D4" />
        <Text style={styles.loadingText}>취향 프로필을 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  if (error || !tasteProfile) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorTitle}>성향 프로필을 불러오지 못했습니다.</Text>
        <Text style={styles.errorSubtitle}>
          {error || '저장된 여행 성향 분석 결과가 없습니다.'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
        {onNavigateToAnalysis && (
          <TouchableOpacity
            style={styles.analysisButton}
            onPress={onNavigateToAnalysis}
          >
            <Text style={styles.analysisButtonText}>성향 분석 시작하기</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Scrollable Taste Profile View matching Figma UI v1 */}
      <TasteProfileView profile={tasteProfile} />

      {/* Floating AI Course Generation Button */}
      <GenerateCourseButton
        onPress={onGenerateCourse}
        label="AI 경로 생성하기"
        isFloating={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FAFE',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F6FAFE',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
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
  },
  retryButton: {
    backgroundColor: '#4648D4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  analysisButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4648D4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  analysisButtonText: {
    color: '#4648D4',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default TasteProfileScreen;
