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
import { TasteProfileView } from '../components/taste';
import { GenerateCourseButton } from '../components/common';
import type { NavTab } from '../components/navigation';
import { theme } from '../theme';
import { UI_STRINGS } from '../constants';

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
          ? UI_STRINGS.TASTE_PROFILE.ERROR_NOT_FOUND
          : errorObj?.message || UI_STRINGS.TASTE_PROFILE.ERROR_LOAD_FAILED;
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{UI_STRINGS.COMMON.LOADING}</Text>
      </SafeAreaView>
    );
  }

  if (error || !tasteProfile) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorTitle}>{UI_STRINGS.TASTE_PROFILE.ERROR_LOAD_FAILED}</Text>
        <Text style={styles.errorSubtitle}>
          {error || UI_STRINGS.TASTE_PROFILE.ERROR_NOT_FOUND}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>{UI_STRINGS.COURSE_DETAIL.RETRY_BUTTON}</Text>
        </TouchableOpacity>
        {onNavigateToAnalysis && (
          <TouchableOpacity
            style={styles.analysisButton}
            onPress={onNavigateToAnalysis}
          >
            <Text style={styles.analysisButtonText}>{UI_STRINGS.TASTE_PROFILE.START_ANALYSIS}</Text>
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
        label={UI_STRINGS.COMPONENTS.GENERATE_BUTTON_DEFAULT}
        isFloating={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.screen,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg.screen,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: theme.colors.text.subtle,
    fontWeight: '500',
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
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 15,
    fontWeight: '600',
  },
  analysisButton: {
    backgroundColor: theme.colors.bg.card,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  analysisButtonText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
