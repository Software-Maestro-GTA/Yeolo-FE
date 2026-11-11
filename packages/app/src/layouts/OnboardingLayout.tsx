/**
 * @file OnboardingLayout.tsx
 * @description Full-size onboarding shell; each UI v3 screen owns its content spacing and bottom safe area.
 */
import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { palette } from '../theme/colors';

export interface OnboardingLayoutProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  style,
  contentStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: palette.softMint, // #F5FAF8
  },
  content: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default OnboardingLayout;
