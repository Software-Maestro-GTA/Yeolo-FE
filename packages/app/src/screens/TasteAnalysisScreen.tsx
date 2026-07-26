/**
 * @file TasteAnalysisScreen.tsx
 * @description Taste analysis progress loading screen integrated with photo service, SSE stream, and stepper component.
 * @requirements REQ-8, REQ-11
 * @functional FUN-1
 * @api API-FB-2
 * @author Antigravity Agent
 */
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeTastePreferenceStream, useTasteStore } from '@yeolo/common';
import { AnalysisProgressStepper } from '../components/taste';
import { fetchPhotosWithExifData } from '../services';
import { theme } from '../theme';
import { APP_CONFIG, ANALYSIS_PHOTO_LIMIT, UI_STRINGS } from '../constants';

export interface TasteAnalysisScreenProps {
  onFinish: (tasteProfileId?: string) => void;
  onFail: () => void;
  fetcher?: typeof analyzeTastePreferenceStream;
}

export const TasteAnalysisScreen: React.FC<TasteAnalysisScreenProps> = ({
  onFinish,
  onFail,
  fetcher,
}) => {
  const [stepIndex, setStepIndex] = useState(0); // 0: Idle, 1: Loading Assets, 2: SSE Request, 3: Completed
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    let isSubscribed = true;
    let completionTimeout: ReturnType<typeof setTimeout>;

    const startStreaming = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          throw new Error(UI_STRINGS.TASTE_ANALYSIS.NO_TOKEN_ERROR);
        }

        const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

        if (isSubscribed) {
          setStepIndex(1); // Fetching Media
        }

        // Delegate photo permission check and EXIF parsing to photoService
        const parsedImages = await fetchPhotosWithExifData(ANALYSIS_PHOTO_LIMIT, 'UTC');

        if (isSubscribed) {
          setStepIndex(2); // Analyzing Preference
        }

        const profileId = await useTasteStore.getState().analyzeTaste(
          apiUrl,
          token,
          { images: parsedImages },
          fetcher || analyzeTastePreferenceStream
        );

        if (isSubscribed && profileId) {
          setStepIndex(3);
          completionTimeout = setTimeout(() => {
            onFinish(profileId);
          }, 1000);
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        if (isSubscribed) {
          Alert.alert(
            UI_STRINGS.TASTE_ANALYSIS.ERROR_TITLE,
            error?.message || UI_STRINGS.TASTE_ANALYSIS.DEFAULT_ERROR,
            [{ text: UI_STRINGS.COMMON.CONFIRM, onPress: onFail }]
          );
        }
      }
    };

    startStreaming();

    return () => {
      isSubscribed = false;
      if (completionTimeout) {
        clearTimeout(completionTimeout);
      }
      pulseLoop.stop();
    };
  }, [onFinish, onFail, fetcher, pulseAnim]);

  return (
    <LinearGradient
      colors={theme.colors.gradient.background}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.contentContainer}>
          {/* Top Header */}
          <View style={styles.topContent} testID="top-content">
            <View style={styles.heroText}>
              <Text style={styles.mainTitle} testID="loading-title">
                {UI_STRINGS.TASTE_ANALYSIS.TITLE}
              </Text>
              <Text style={styles.subTitle}>
                {UI_STRINGS.TASTE_ANALYSIS.SUBTITLE}
              </Text>
            </View>
          </View>

          {/* 3-step Loading Stepper Component */}
          <AnalysisProgressStepper
            stepIndex={stepIndex}
            pulseAnim={pulseAnim}
          />

          <View style={styles.bottomSpacer} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 34,
  },
  topContent: {
    height: 190,
    width: '100%',
  },
  heroText: {
    gap: 12,
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text.primary,
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  bottomSpacer: {
    height: 34,
  },
});
