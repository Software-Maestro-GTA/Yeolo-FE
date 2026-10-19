/**
 * @file TasteAnalysisScreen.tsx
 * @description Real photo analysis with a fixed close control, UI v3 content spacing and permission-aware recovery.
 */
import AnalysisExitSvg from '../../assets/ui-v3-onboarding/analysis-exit.svg';
import BackSvg from '../../assets/ui-v3-onboarding/back.svg';
import { Text } from '../components/common/Typography';
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Linking,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addListener, presentPermissionsPicker } from 'expo-media-library';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { ONBOARDING_UI_STRINGS } from '../constants/onboardingUiStrings';
import { OnboardingSvg } from '../components/taste/OnboardingIllustrations';
import { OnboardingButton } from '../components/onboarding/OnboardingButton';
import { getPhotoAccess } from '../services/photoPermissionService';
import { useGA4ScreenTracking, useTasteAnalysisPipeline } from '../hooks';

interface TasteAnalysisScreenProps {
  onFinish: (tasteProfileId: string) => void;
  onFail?: () => void;
  onClose?: () => void;
  mode?: 'full' | 'limited';
  onLimitedFinish?: () => void;
  onFailureBack?: () => void;
  onChooseMbti?: () => void;
  onFailureStateChange?: (failed: boolean) => void;
}

/** Runs the same real metadata analysis for full and selected-photo access. */
export function TasteAnalysisScreen({
  onFinish,
  onFail,
  onClose,
  onLimitedFinish,
  onFailureBack,
  onChooseMbti,
  onFailureStateChange,
  mode,
}: TasteAnalysisScreenProps) {
  useGA4ScreenTracking('TasteAnalysisScreen');
  const insets = useSafeAreaInsets();
  const insetStyles = StyleSheet.create({
    content: { paddingBottom: insets.bottom + 40 },
  });
  const {
    runPipeline,
    error: errorMessage,
    progress,
    needsMorePhotos,
  } = useTasteAnalysisPipeline();
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const [settingsError, setSettingsError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [selecting, setSelecting] = useState(false);
  const [hasFullAccess, setHasFullAccess] = useState(mode !== 'limited');
  const selectingRef = useRef(false);
  const awaitingSelectionChange = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    onFailureStateChange?.(!!errorMessage);
    return () => onFailureStateChange?.(false);
  }, [errorMessage, onFailureStateChange]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    // iOS resolves the picker call on presentation; wait for the selected scope to change.
    const subscription = addListener((event) => {
      if (
        !awaitingSelectionChange.current ||
        event.hasIncrementalChanges !== false
      )
        return;
      awaitingSelectionChange.current = false;
      setSettingsError('');
      setAttempt((value) => value + 1);
    });
    return () => subscription.remove();
  }, []);
  const retryAnalysis = () => {
    setSettingsError('');
    setAttempt((value) => value + 1);
  };
  const selectAgain = async () => {
    if (selectingRef.current) return;
    selectingRef.current = true;
    setSelecting(true);
    setSettingsError('');
    try {
      const access = await getPhotoAccess();
      if (!mounted.current) return;
      setHasFullAccess(access === 'all');
      if (access === 'limited') {
        awaitingSelectionChange.current = Platform.OS === 'ios';
        await presentPermissionsPicker(['photo']);
        if (Platform.OS === 'ios') return;
      }
      if (mounted.current) retryAnalysis();
    } catch {
      awaitingSelectionChange.current = false;
      if (mounted.current)
        setSettingsError(ONBOARDING_UI_STRINGS.SELECT_PHOTOS_ERROR);
    } finally {
      selectingRef.current = false;
      if (mounted.current) setSelecting(false);
    }
  };
  useEffect(() => {
    let subscribed = true;
    let completionTimeout: ReturnType<typeof setTimeout> | undefined;
    void runPipeline().then((profileId) => {
      if (subscribed && profileId)
        completionTimeout = setTimeout(() => {
          if (subscribed) finishRef.current(profileId);
        }, 1000);
    });
    return () => {
      subscribed = false;
      if (completionTimeout) clearTimeout(completionTimeout);
    };
  }, [runPipeline, attempt]);
  const showSelectionFailure =
    needsMorePhotos || (mode === 'limited' && !!errorMessage);
  const closeAnalysis = onClose || (errorMessage ? onFailureBack : undefined);
  const needsPhotoSettings =
    errorMessage === UI_STRINGS.TASTE_ANALYSIS.PERMISSION_ERROR ||
    errorMessage === UI_STRINGS.PHOTO_AUTH.REQUIRED ||
    errorMessage === UI_STRINGS.TASTE_ANALYSIS.LIMITED_PHOTOS_ERROR;
  const openSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      setSettingsError(UI_STRINGS.PHOTO_AUTH.SETTINGS_ERROR);
    }
  };
  return (
    <View style={styles.screen}>
      {showSelectionFailure && onFailureBack && (
        <TouchableOpacity
          onPress={onFailureBack}
          accessibilityRole='button'
          accessibilityLabel={UI_STRINGS.ONBOARDING.BACK}
          style={styles.failureBack}>
          <OnboardingSvg source={BackSvg} />
        </TouchableOpacity>
      )}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          showSelectionFailure ? styles.failureContent : styles.fullContent,
          showSelectionFailure && onFailureBack && styles.contentWithBack,
          insetStyles.content,
        ]}>
        {showSelectionFailure ? (
          <>
            <View style={styles.failureHeading}>
              <Text style={styles.failureTitle}>
                {UI_STRINGS.TASTE_ANALYSIS.FAIL_TITLE}
              </Text>
              <Text style={styles.subTitle} accessibilityLiveRegion='polite'>
                {UI_STRINGS.TASTE_ANALYSIS.FAIL_SUBTITLE}
              </Text>
            </View>
            <View style={styles.failureActions}>
              {!!settingsError && (
                <Text style={styles.message} accessibilityLiveRegion='polite'>
                  {settingsError}
                </Text>
              )}
              {!hasFullAccess && (
                <OnboardingButton
                  label={UI_STRINGS.TASTE_ANALYSIS.ALLOW_ALL_BUTTON}
                  onPress={() =>
                    onLimitedFinish ? onLimitedFinish() : void openSettings()
                  }
                  disabled={selecting}
                  testID='allow-all-photos-button'
                />
              )}
              <OnboardingButton
                label={
                  mode === 'limited'
                    ? UI_STRINGS.TASTE_ANALYSIS.RETRY_SELECT_BUTTON
                    : ONBOARDING_UI_STRINGS.RETRY
                }
                onPress={() => {
                  void selectAgain();
                }}
                disabled={selecting}
                secondary={!hasFullAccess}
                testID='select-photos-again-button'
              />
              {onChooseMbti && (
                <OnboardingButton
                  label={UI_STRINGS.TASTE_ANALYSIS.MBTI_BUTTON}
                  onPress={onChooseMbti}
                  secondary
                />
              )}
              {onClose && (
                <OnboardingButton
                  label={ONBOARDING_UI_STRINGS.CLOSE}
                  onPress={onClose}
                  secondary
                />
              )}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.mainTitle}>
              {UI_STRINGS.TASTE_ANALYSIS.MAIN_TITLE}
            </Text>
            {errorMessage ? (
              <View style={styles.error} testID='error-container'>
                <Text style={styles.errorTitle}>
                  {UI_STRINGS.TASTE_ANALYSIS.ERROR_CARD_TITLE}
                </Text>
                <Text style={styles.errorText} accessibilityLiveRegion='polite'>
                  {errorMessage}
                </Text>
                {!!settingsError && (
                  <Text style={styles.errorText}>{settingsError}</Text>
                )}
                {needsPhotoSettings && (
                  <OnboardingButton
                    label={UI_STRINGS.TASTE_ANALYSIS.OPEN_SETTINGS_BUTTON}
                    onPress={() => {
                      void openSettings();
                    }}
                    testID='error-settings-button'
                  />
                )}
                <OnboardingButton
                  label={ONBOARDING_UI_STRINGS.RETRY}
                  onPress={retryAnalysis}
                  testID='retry-analysis-button'
                />
                <OnboardingButton
                  label={UI_STRINGS.COMMON.CONFIRM}
                  onPress={() => onFail?.()}
                  secondary={needsPhotoSettings}
                  testID='error-confirm-button'
                />
              </View>
            ) : (
              <Text
                style={styles.subTitle}
                accessibilityLiveRegion='polite'
                testID='analysis-progress-message'>
                {progress.currentMessage ||
                  UI_STRINGS.TASTE_ANALYSIS.DEFAULT_INSIGHT_MESSAGE}
              </Text>
            )}
          </>
        )}
      </ScrollView>
      {!showSelectionFailure && closeAnalysis && (
        <TouchableOpacity
          onPress={closeAnalysis}
          accessibilityRole='button'
          accessibilityLabel={ONBOARDING_UI_STRINGS.CLOSE}
          style={styles.close}
          testID='analysis-close-button'>
          <OnboardingSvg source={AnalysisExitSvg} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.white },
  content: {
    flexGrow: 1,
    paddingTop: 35,
    paddingHorizontal: 20,
  },
  // The global shell owns the status bar inset; Figma places the title 164px below it.
  fullContent: { paddingTop: 164 },
  mainTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: palette.deepNavy,
    lineHeight: 37,
    letterSpacing: -1,
    textAlign: 'center',
  },
  close: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitle: {
    fontSize: 16,
    lineHeight: 23,
    letterSpacing: -1,
    color: palette.mutedText,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: palette.subText,
  },
  failureContent: { justifyContent: 'space-between' },
  contentWithBack: { paddingTop: 4 },
  failureHeading: { gap: 8 },
  failureBack: {
    width: 44,
    height: 44,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failureTitle: {
    fontSize: 24,
    lineHeight: 37,
    letterSpacing: -1,
    fontWeight: '600',
    color: palette.deepNavy,
    textAlign: 'center',
  },
  failureActions: { gap: 12, marginTop: 60 },
  error: {
    gap: 12,
    marginTop: 40,
    padding: 16,
    backgroundColor: palette.red50,
    borderRadius: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.red800,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 22,
    color: palette.red700,
    textAlign: 'center',
  },
});
