/**
 * @file TasteProfileScreen.tsx
 * @description Screen component for displaying taste profile analysis results following Figma UI v1 design.
 * @requirements REQ-11
 * @functional FUN-4
 * @api API-FB-8
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTasteProfileStore, fetchTasteProfileApi } from '@yeolo/common';
import { TasteProfileView } from '../components/taste/TasteProfileView';
import { BottomNavBar, NavTab } from '../components/navigation/BottomNavBar';
import { GenerateCourseButton } from '../components/common/GenerateCourseButton';

export interface TasteProfileScreenProps {
  onNavigateToAnalysis?: () => void;
  onNavigateToLogin?: () => void;
  onGenerateCourse?: () => void;
  onTabPress?: (tab: NavTab) => void;
  fetcher?: typeof fetchTasteProfileApi;
}

export const TasteProfileScreen: React.FC<TasteProfileScreenProps> = ({
  onNavigateToAnalysis,
  onNavigateToLogin,
  onGenerateCourse,
  onTabPress,
  fetcher,
}) => {
  const { tasteProfile, isLoading, error, errorCode, fetchTasteProfile } =
    useTasteProfileStore();

  const loadProfile = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    const apiUrl =
      process.env.EXPO_PUBLIC_API_URL || 'https://api.yeolo.com';
    fetchTasteProfile(apiUrl, token || undefined, fetcher);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (errorCode === 401) {
      onNavigateToLogin?.();
    }
  }, [errorCode]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4648D4" />
        <Text style={styles.loadingText}>성향 프로필 정보를 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  // 404 Not Found: Profile missing
  if (errorCode === 404 || (!tasteProfile && !error)) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>저장된 여행 성향 분석 결과가 없습니다.</Text>
        <Text style={styles.emptySubtitle}>
          나에게 꼭 맞는 여행 코스를 추천받으려면 먼저 성향 분석을 진행해 주세요.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => onNavigateToAnalysis?.()}
        >
          <Text style={styles.primaryButtonText}>성향 분석 시작하기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 500 / Network Error State
  if (error || !tasteProfile) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorTitle}>성향 프로필을 불러오지 못했습니다.</Text>
        <Text style={styles.errorSubtitle}>{error || '잠시 후 다시 시도해 주세요.'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadProfile()}
        >
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 200 OK State - Render Figma UI v1 layout
  return (
    <SafeAreaView style={styles.screenContainer} edges={['top', 'left', 'right']}>
      {/* Scrollable Taste Profile View */}
      <TasteProfileView profile={tasteProfile} />

      {/* Standalone Floating Action Button Component */}
      <GenerateCourseButton onPress={onGenerateCourse} />

      {/* Standalone Bottom Navigation Bar Component */}
      <BottomNavBar currentTab="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F6FAFE',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F6FAFE',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#4648D4',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TasteProfileScreen;


