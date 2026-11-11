/**
 * @file PhotoAuthExplainScreen.tsx
 * @description Platform-specific photo guidance with a permission-aware settings or analysis action.
 */
import BackSvg from '../../assets/ui-v3-onboarding/back.svg';
import { Text } from '../components/common/Typography';
import React, { useEffect, useRef, useState } from 'react';
import {
  AppState,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  Image,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ONBOARDING_UI_STRINGS } from '../constants/onboardingUiStrings';
import {
  getPhotoAccess,
  type PhotoAccess,
} from '../services/photoPermissionService';
import { OnboardingButton } from '../components/onboarding/OnboardingButton';
import { OnboardingSvg } from '../components/taste/OnboardingIllustrations';
import { UI_STRINGS } from '../constants';
import { theme } from '../theme/colors';
import { useGA4ScreenTracking } from '../hooks';

/** Rechecks access on resume; analysis starts only after an explicit CTA press. */
export function PhotoAuthExplainScreen({
  onNext,
  onBack,
}: {
  onNext: (access: Exclude<PhotoAccess, 'denied'>) => void;
  onBack?: () => void;
}) {
  useGA4ScreenTracking('PhotoAuthExplainScreen');
  const insets = useSafeAreaInsets();
  const insetStyles = StyleSheet.create({
    content: { paddingBottom: insets.bottom + 20 },
  });
  const [message, setMessage] = useState<string>();
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    let active = true;
    const refresh = async () => {
      setChecking(true);
      try {
        const access = await getPhotoAccess();
        if (active) {
          setHasFullAccess(access === 'all');
          setMessage(
            access === 'all' ? UI_STRINGS.PHOTO_AUTH.READY : undefined,
          );
        }
      } catch {
        if (active) {
          setHasFullAccess(false);
          setMessage(UI_STRINGS.PHOTO_AUTH.PERMISSION_CHECK_ERROR);
        }
      } finally {
        if (active) setChecking(false);
      }
    };
    void refresh();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      active = false;
      mounted.current = false;
      listener.remove();
    };
  }, []);
  const continueWithPhotos = async () => {
    if (busy.current) return;
    busy.current = true;
    setChecking(true);
    try {
      if (!hasFullAccess) {
        await openSettings();
        return;
      }
      const access = await getPhotoAccess();
      if (!mounted.current) return;
      setHasFullAccess(access === 'all');
      if (access === 'all') onNext(access);
      else {
        setMessage(undefined);
        await openSettings();
      }
    } catch {
      if (mounted.current) {
        setHasFullAccess(false);
        setMessage(UI_STRINGS.PHOTO_AUTH.PERMISSION_CHECK_ERROR);
      }
    } finally {
      busy.current = false;
      if (mounted.current) setChecking(false);
    }
  };
  const openSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      if (mounted.current) setMessage(UI_STRINGS.PHOTO_AUTH.SETTINGS_ERROR);
    }
  };
  const steps =
    Platform.OS === 'ios'
      ? UI_STRINGS.PHOTO_AUTH.IOS_STEPS
      : UI_STRINGS.PHOTO_AUTH.ANDROID_STEPS;
  const stepImages =
    Platform.OS === 'android'
      ? [
          require('../../assets/ui-v3-onboarding/android-settings-app.png'),
          require('../../assets/ui-v3-onboarding/android-settings-permissions.png'),
          require('../../assets/ui-v3-onboarding/android-settings-photos.png'),
        ]
      : [
          require('../../assets/ui-v3-onboarding/settings-search.png'),
          require('../../assets/ui-v3-onboarding/settings-photos.png'),
          require('../../assets/ui-v3-onboarding/settings-access.png'),
        ];
  const androidImageStyles = [
    styles.androidAppImage,
    styles.androidPermissionsImage,
    styles.androidPhotosImage,
  ];
  const cropStyles = [styles.searchCrop, styles.photosCrop, styles.accessCrop];
  return (
    <View style={styles.screen}>
      {onBack && (
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole='button'
          accessibilityLabel={UI_STRINGS.ONBOARDING.BACK}>
          <OnboardingSvg source={BackSvg} />
        </Pressable>
      )}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          insetStyles.content,
          onBack && styles.contentWithBack,
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text style={styles.title}>
            {ONBOARDING_UI_STRINGS.PHOTO_HELP_TITLE}
          </Text>
          <Text style={styles.description}>
            {ONBOARDING_UI_STRINGS.PHOTO_HELP_DESCRIPTION}
          </Text>
        </View>
        <View style={styles.steps}>
          {steps.map((step, index) => (
            <Pressable
              key={step}
              style={styles.step}
              onPress={openSettings}
              accessibilityRole='button'
              accessibilityLabel={`${step}. ${UI_STRINGS.PHOTO_AUTH.OPEN_SETTINGS}`}>
              <Text style={styles.stepText}>{step}</Text>
              {Platform.OS === 'android' ? (
                <View
                  style={[
                    styles.imageCrop,
                    styles.androidImageCrop,
                    androidImageStyles[index],
                  ]}>
                  <Image
                    testID={`photo-permission-step-image-${index}`}
                    source={stepImages[index]}
                    style={styles.androidStepImage}
                    resizeMode='contain'
                    accessible={false}
                  />
                </View>
              ) : (
                <View style={[styles.imageCrop, cropStyles[index]]}>
                  <Image
                    testID={`photo-permission-step-image-${index}`}
                    source={stepImages[index]}
                    style={styles.stepImage}
                    resizeMode='contain'
                    accessible={false}
                  />
                </View>
              )}
            </Pressable>
          ))}
        </View>
        {message && message !== UI_STRINGS.PHOTO_AUTH.READY ? (
          <Text accessibilityLiveRegion='polite' style={styles.status}>
            {message}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <OnboardingButton
            label={
              hasFullAccess
                ? UI_STRINGS.PHOTO_AUTH.START
                : UI_STRINGS.PHOTO_AUTH.SETTINGS_CTA
            }
            onPress={() => void continueWithPhotos()}
            disabled={checking}
            accessibilityHint={message}
          />
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg.screen },
  backButton: {
    width: 44,
    height: 44,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    paddingTop: 35,
    paddingHorizontal: 20,
    gap: 12,
  },
  contentWithBack: { paddingTop: 4 },
  heading: { paddingHorizontal: 12, gap: 8, marginBottom: 6 },
  title: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 37,
    letterSpacing: -1,
    color: theme.colors.text.primary,
  },
  description: {
    fontSize: 16,
    lineHeight: 23,
    letterSpacing: -1,
    color: theme.colors.text.muted,
  },
  steps: { gap: 12 },
  step: {
    borderRadius: 16,
    paddingHorizontal: 19,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: theme.colors.bg.secondary,
    gap: 16,
  },
  stepText: {
    marginLeft: 1,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -1,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  androidImageCrop: { borderRadius: 12 },
  androidStepImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  androidAppImage: { aspectRatio: 1079 / 595 },
  androidPermissionsImage: { aspectRatio: 1080 / 210 },
  androidPhotosImage: { aspectRatio: 1079 / 697 },
  imageCrop: { width: '100%', overflow: 'hidden' },
  searchCrop: { aspectRatio: 1170 / 213 },
  photosCrop: { aspectRatio: 1170 / 308 },
  accessCrop: { aspectRatio: 1170 / 427 },
  stepImage: { width: '100%', height: '100%' },
  status: { fontSize: 14, lineHeight: 22, color: theme.colors.text.secondary },
  actions: { marginTop: 8, gap: 2 },
});
