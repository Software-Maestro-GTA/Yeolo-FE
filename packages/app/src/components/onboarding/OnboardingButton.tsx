/**
 * @file OnboardingButton.tsx
 * @description Accessible shared actions for photo permission and MBTI onboarding screens.
 */
import { Text } from '../common/Typography';
import { Pressable, StyleSheet } from 'react-native';
import { palette, theme } from '../../theme/colors';

/** Renders a primary or secondary onboarding action with a visible disabled state. */
export function OnboardingButton({
  label,
  onPress,
  disabled = false,
  secondary = false,
  ticket = false,
  testID,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  ticket?: boolean;
  testID?: string;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={[
        styles.button,
        ticket && styles.strong,
        secondary && styles.secondary,
        ticket && secondary && styles.ticketSecondary,
        disabled && styles.disabled,
      ]}>
      <Text
        style={[
          styles.label,
          (secondary || disabled) && styles.secondaryLabel,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 62,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: palette.gray200,
  },
  strong: { backgroundColor: palette.subBlue },
  ticketSecondary: { backgroundColor: palette.gray100 },
  disabled: { backgroundColor: palette.gray200 },
  label: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 32,
    letterSpacing: -0.6,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
  secondaryLabel: { color: theme.colors.text.secondary },
});
