/**
 * @file TasteProfileScreen.tsx
 * @description Screen component for displaying taste profile analysis results using component-local useState and tasteProfileId request parameter.
 * @requirements REQ-11, REQ-22
 * @functional FUN-4, FUN-GA4
 * @api API-FB-8
 * @author Antigravity Agent
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TasteProfileView } from '../components/taste';
import { GenerateCourseButton, PhotoAnalysisModal } from '../components/common';
import { useTasteProfileQuery } from '../hooks/queries';
import type { NavTab } from '../components/navigation';
import { theme } from '../theme';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

export interface TasteProfileScreenProps {
  tasteProfileId?: string;
  onGenerateCourse?: () => void;
  onReanalyze?: () => void;
  onNavigateToIntro?: () => void;
  onTabPress?: (tab: NavTab) => void;
}

export const TasteProfileScreen: React.FC<TasteProfileScreenProps> = ({
  tasteProfileId,
  onGenerateCourse,
  onReanalyze,
  onNavigateToIntro,
}) => {
  useGA4ScreenTracking('TasteProfileScreen');
  const { trackButtonClick } = useGA4ButtonClick();
  const [isConsentModalVisible, setIsConsentModalVisible] = useState(false);

  const { data: tasteProfile, isLoading, error, refetch } = useTasteProfileQuery({
    tasteProfileId,
  });

  const errorCode = error?.status ?? null;
  const isNotFound = errorCode === 404;
  const errorMessage =
    isNotFound
      ? UI_STRINGS.TASTE_PROFILE.ERROR_NOT_FOUND
      : error?.message || UI_STRINGS.TASTE_PROFILE.ERROR_LOAD_FAILED;

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{UI_STRINGS.COMMON.LOADING}</Text>
      </View>
    );
  }

  if (error || !tasteProfile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>{UI_STRINGS.TASTE_PROFILE.ERROR_LOAD_FAILED}</Text>
        <Text style={styles.errorSubtitle}>
          {errorMessage}
        </Text>
        {isNotFound && onNavigateToIntro ? (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              trackButtonClick('btn_taste_profile_go_intro', 'Navigate to Intro Screen');
              onNavigateToIntro();
            }}
          >
            <Text style={styles.retryButtonText}>{UI_STRINGS.TASTE_PROFILE.START_ANALYSIS}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              trackButtonClick('btn_taste_profile_retry', 'Retry Fetch Taste Profile');
              refetch();
            }}
          >
            <Text style={styles.retryButtonText}>{UI_STRINGS.COURSE_DETAIL.RETRY_BUTTON}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Scrollable Taste Profile View matching Figma UI v1 */}
      <TasteProfileView
        profile={tasteProfile}
        onReanalyze={() => {
          trackButtonClick('btn_taste_profile_reanalyze', 'Reanalyze Taste Profile');
          setIsConsentModalVisible(true);
        }}
      />

      {/* Photo Consent Modal before proceeding to TasteAnalysisScreen */}
      <PhotoAnalysisModal
        visible={isConsentModalVisible}
        onClose={() => setIsConsentModalVisible(false)}
        onConfirm={() => {
          setIsConsentModalVisible(false);
          onReanalyze?.();
        }}
      />

      {/* Floating AI Course Generation Button */}
      <GenerateCourseButton
        onPress={() => {
          trackButtonClick('btn_taste_profile_generate_course', 'Generate Course from Taste Profile');
          onGenerateCourse?.();
        }}
        label={UI_STRINGS.COMPONENTS.GENERATE_BUTTON_DEFAULT}
        isFloating={true}
      />
    </View>
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
