/**
 * @file GenerateCourseButton.tsx
 * @description Floating or inline gradient button component for generating AI course path matching Figma UI v1.
 * @requirements REQ-11
 * @functional FUN-4
 * @api API-FB-8
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

export interface GenerateCourseButtonProps {
  onPress?: () => void;
  label?: string;
  disabled?: boolean;
  testID?: string;
  isFloating?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const GenerateCourseButton: React.FC<GenerateCourseButtonProps> = ({
  onPress,
  label = UI_STRINGS.COMPONENTS.GENERATE_BUTTON_DEFAULT,
  disabled = false,
  testID = 'submit-course-btn',
  isFloating = false,
  style,
}) => {
  const gradientColors = disabled
    ? ([theme.colors.text.placeholder, theme.colors.text.subtle] as const)
    : theme.colors.gradient.primary;

  return (
    <View style={[isFloating ? styles.floatingContainer : styles.inlineContainer, style]}>
      <TouchableOpacity
        testID={testID}
        activeOpacity={disabled ? 1 : 0.85}
        disabled={disabled}
        accessibilityState={{ disabled }}
        style={[styles.touchable, disabled && styles.disabledTouchable]}
        onPress={onPress}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Ionicons
            name="sparkles"
            size={20}
            color={disabled ? theme.colors.bg.secondary : theme.colors.text.inverse}
            style={styles.icon}
          />
          <Text style={[styles.text, disabled && styles.disabledText]}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  inlineContainer: {
    width: '100%',
    marginVertical: 12,
  },
  touchable: {
    width: '100%',
    borderRadius: 9999,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  disabledTouchable: {
    shadowOpacity: 0,
    elevation: 0,
  },
  gradient: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: theme.colors.text.inverse,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  disabledText: {
    color: theme.colors.bg.secondary,
  },
  arrowIcon: {
    marginLeft: 6,
  },
});
