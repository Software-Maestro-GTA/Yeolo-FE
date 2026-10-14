/**
 * @file PhotoAuthExplainScreen.tsx
 * @description Full-access setup instructions with foreground refresh and an explicit permission-checked analysis action.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  AppState,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getPhotoAccess } from '../services/photoPermissionService';
import { OnboardingButton } from '../components/onboarding/OnboardingButton';
import { UI_STRINGS } from '../constants';
import { theme } from '../theme/colors';
import { useGA4ScreenTracking } from '../hooks';

/** Rechecks access on resume and on each CTA press; only full access can continue. */
export function PhotoAuthExplainScreen({ onNext }: { onNext: () => void }) {
  useGA4ScreenTracking('PhotoAuthExplainScreen');
  const [message, setMessage] = useState<string>(
    UI_STRINGS.PHOTO_AUTH.REQUIRED,
  );
  const [checking, setChecking] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    let active = true;
    const refresh = async () => {
      try {
        const access = await getPhotoAccess();
        if (active)
          setMessage(
            access === 'all'
              ? UI_STRINGS.PHOTO_AUTH.READY
              : UI_STRINGS.PHOTO_AUTH.REQUIRED,
          );
      } catch {
        if (active) setMessage(UI_STRINGS.PHOTO_AUTH.PERMISSION_CHECK_ERROR);
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
      const access = await getPhotoAccess();
      if (!mounted.current) return;
      if (access === 'all') onNext();
      else setMessage(UI_STRINGS.PHOTO_AUTH.REQUIRED);
    } catch {
      if (mounted.current)
        setMessage(UI_STRINGS.PHOTO_AUTH.PERMISSION_CHECK_ERROR);
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
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{UI_STRINGS.PHOTO_AUTH.TITLE}</Text>
      <Text style={styles.description}>
        {UI_STRINGS.PHOTO_AUTH.DESCRIPTION}
      </Text>
      <View style={styles.steps}>
        {steps.map((step, index) => (
          <View key={step} style={styles.step}>
            <Text style={styles.stepText}>
              {index + 1}. {step}
            </Text>
          </View>
        ))}
      </View>
      <Text accessibilityLiveRegion='polite' style={styles.description}>
        {message}
      </Text>
      <OnboardingButton
        label={UI_STRINGS.PHOTO_AUTH.OPEN_SETTINGS}
        onPress={openSettings}
        secondary
      />
      <OnboardingButton
        label={UI_STRINGS.PHOTO_AUTH.START}
        onPress={continueWithPhotos}
        disabled={checking}
      />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingVertical: 16, gap: 16 },
  title: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 37,
    color: theme.colors.text.primary,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.text.secondary,
  },
  steps: { flex: 1, gap: 12, justifyContent: 'center' },
  step: {
    minHeight: 94,
    borderRadius: 16,
    padding: 20,
    backgroundColor: theme.colors.bg.card,
  },
  stepText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});
