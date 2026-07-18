/**
 * @file TasteAnalysisScreen.tsx
 * @description Taste analysis progress loading screen integrated with local EXIF parser and SSE stream.
 * @requirements REQ-8, REQ-11
 * @functional FUN-1
 * @api API-FB-2
 * @author Antigravity Agent
 */
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestPermissionsAsync, Query, AssetField, MediaType } from 'expo-media-library';
import { analyzeTastePreferenceStream, ImageMetadata, useTasteStore } from '@yeolo/common';
import { BRAND_COLORS, AUTH_CONSTANTS } from '../constants/auth';

interface TasteAnalysisScreenProps {
  /**
   * Callback function triggered when onboarding analysis finishes.
   */
  onFinish: () => void;
  /**
   * Callback function triggered when the preference analysis fails.
   */
  onFail: () => void;
}

export const TasteAnalysisScreen: React.FC<TasteAnalysisScreenProps> = ({
  onFinish,
  onFail,
}) => {
  const [stepIndex, setStepIndex] = useState(0); // 0: Idle, 1: Loading Assets, 2: SSE Request, 3: Completed
  const setTasteProfileId = useTasteStore((state) => state.setTasteProfileId);

  // Pulse animation for the currently active loading step
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Animation values for transition states
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation loop
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
    let completionTimeout: NodeJS.Timeout;

    // Default timezone set to UTC (baseline coordinate timezone)
    const resolvedTimezone = 'UTC';

    const startStreaming = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          throw new Error('인증 토큰이 없습니다. 다시 로그인해 주세요.');
        }

        const apiUrl = process.env.EXPO_PUBLIC_API_URL || AUTH_CONSTANTS.DEFAULT_API_URL;

        if (isSubscribed) {
          setStepIndex(1); // Fetching Media
        }

        // 1. Request permission to access the local photo library using the modern SDK helper
        const { status } = await requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('성향 분석을 위해 기기 사진 라이브러리 접근 권한 동의가 필요합니다.');
        }

        // 2. Query recent photo assets in descending order (newest first)
        const assets = await new Query()
          .eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
          .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
          .limit(10)
          .exe();

        if (!assets || assets.length === 0) {
          throw new Error('기기에 성향을 분석할 사진이 존재하지 않습니다.');
        }

        const parsedImages: ImageMetadata[] = [];
        for (const asset of assets) {
          try {
            // Retrieve location and creationTime using class methods on the returned Asset instances
            const location = await asset.getLocation();
            const creationTime = await asset.getCreationTime();

            // Skip assets that do not have valid location (coordinates) or creation time
            if (
              !location ||
              location.latitude === undefined ||
              location.longitude === undefined ||
              location.latitude === null ||
              location.longitude === null
            ) {
              continue;
            }

            if (!creationTime) {
              continue;
            }

            parsedImages.push({
              sourceImageId: asset.id,
              capturedAt: new Date(creationTime).toISOString(),
              latitude: location.latitude,
              longitude: location.longitude,
              timezone: resolvedTimezone,
            });
          } catch (err) {
            console.warn(`Failed to fetch location metadata for asset ${asset.id}:`, err);
          }
        }

        if (parsedImages.length === 0) {
          throw new Error('기기에 성향을 분석할 만한 위치 정보(위도, 경도) 및 시간 정보가 포함된 사진이 존재하지 않습니다.');
        }

        if (isSubscribed) {
          setStepIndex(2); // Analyzing Preference
        }

        // 4. Initiate backend preference analysis stream with extracted image metadata
        const profileId = await analyzeTastePreferenceStream(
          apiUrl,
          token,
          { images: parsedImages },
          {
            onProgress: (progress) => {
              if (!isSubscribed) return;
              if (progress.step === 'PREPROCESSING_IMAGE_METADATA') {
                setStepIndex(1);
              } else if (progress.step === 'ANALYZING_PREFERENCE') {
                setStepIndex(2);
              }
            },
            onComplete: (complete) => {
              console.log('SSE Stream analysis completed successfully:', complete.data?.tasteProfileId);
            },
            onError: (err) => {
              console.error('SSE Stream callback error:', err.message);
            },
          }
        );

        if (isSubscribed) {
          setTasteProfileId(profileId);
          setStepIndex(3);
          completionTimeout = setTimeout(() => {
            onFinish(); // Onboarding complete, navigate to HomeScreen after 1 second
          }, 1000);
        }
      } catch (error: any) {
        if (isSubscribed) {
          Alert.alert(
            '분석 오류',
            error.message || '성향 분석 도중 오류가 발생했습니다.',
            [
              {
                text: '확인',
                onPress: onFail,
              },
            ]
          );
        }
      }
    };

    startStreaming();

    return () => {
      isSubscribed = false;
      pulseLoop.stop();
      if (completionTimeout) {
        clearTimeout(completionTimeout);
      }
      pulseAnim.setValue(1);
    };
  }, [onFinish, onFail, pulseAnim]);

  return (
    <LinearGradient
      colors={BRAND_COLORS.BACKGROUND_GRADIENT}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.contentContainer}>
          {/* Top Header */}
          <View style={styles.topContent} testID="top-content">
            <View style={styles.heroText}>
              <Text style={styles.mainTitle} testID="loading-title">
                취향 분석 중
              </Text>
              <Text style={styles.subTitle}>
                당신의 성향을 파악하고 있어요.
              </Text>
            </View>
          </View>

          {/* 3-step Loading Stepper */}
          <View style={styles.stepperContainer} testID="stepper">
            {[
              { id: 1, text: '당신을 알아가고 있어요' },
              { id: 2, text: '여행 성향을 찾고 있어요' },
              { id: 3, text: '여행 성향 분석 완료!' },
            ].map((step) => {
              const isCompleted = stepIndex > step.id;
              const isActive = stepIndex === step.id;
              const isInactive = stepIndex < step.id;

              return (
                <View key={step.id} style={styles.stepNode} testID={`step-${step.id}`}>
                  {isCompleted && (
                    <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                      <AntDesign name="check" size={12} color="#ffffff" />
                    </View>
                  )}
                  {isActive && (
                    <Animated.View
                      style={[
                        styles.stepCircle,
                        styles.stepCircleActive,
                        { transform: [{ scale: pulseAnim }] },
                      ]}
                    >
                      <View style={styles.pulseInner} />
                    </Animated.View>
                  )}
                  {isInactive && (
                    <View style={[styles.stepCircle, styles.stepCircleInactive]}>
                      <View style={styles.pendingInner} />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.stepText,
                      isCompleted && styles.stepTextCompleted,
                      isActive && styles.stepTextActive,
                      isInactive && styles.stepTextInactive,
                    ]}
                  >
                    {step.text}
                  </Text>
                </View>
              );
            })}
          </View>

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
    color: BRAND_COLORS.TEXT_DARK,
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#45464c',
    lineHeight: 24,
  },
  stepperContainer: {
    gap: 16,
    paddingHorizontal: 24,
    width: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  stepNode: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCompleted: {
    backgroundColor: BRAND_COLORS.GRADIENT_GREEN,
  },
  stepCircleActive: {
    backgroundColor: BRAND_COLORS.PRIMARY,
  },
  stepCircleInactive: {
    borderWidth: 1.5,
    borderColor: '#8e909c',
    backgroundColor: 'transparent',
  },
  pulseInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  pendingInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8e909c',
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
  },
  stepTextCompleted: {
    fontWeight: '500',
    color: '#45464c',
  },
  stepTextActive: {
    fontWeight: '600',
    color: BRAND_COLORS.TEXT_DARK,
  },
  stepTextInactive: {
    fontWeight: '500',
    color: '#8e909c',
  },
  bottomSpacer: {
    height: 92,
  },
});

export default TasteAnalysisScreen;
