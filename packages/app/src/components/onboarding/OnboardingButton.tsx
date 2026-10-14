/**
 * @file OnboardingButton.tsx
 * @description Accessible shared actions for photo permission and MBTI onboarding screens.
 */
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/colors';

/** Renders a primary or secondary onboarding action with a visible disabled state. */
export function OnboardingButton({
  label,
  onPress,
  disabled = false,
  secondary = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={[
        styles.button,
        secondary && styles.secondary,
        disabled && styles.disabled,
      ]}>
      <Text style={[styles.label, secondary && styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.bg.card,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  disabled: { opacity: 0.45 },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
  secondaryLabel: { color: theme.colors.text.primary },
});
