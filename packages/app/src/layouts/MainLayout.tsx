/**
 * @file MainLayout.tsx
 * @description Shell layout component providing persistent bottom navigation bar for main tab screens, with optional noTopEdges for full bleed translucent status bar headers.
 */
import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { BottomNavBar, NavTab } from '../components/navigation';
import { palette } from '../theme/colors';

export interface MainLayoutProps {
  children: React.ReactNode;
  currentTab: NavTab;
  onTabPress: (tab: NavTab) => void;
  noTopEdges?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentTab,
  onTabPress,
  style,
  contentStyle,
}) => {
  return (
    <View style={[styles.mainLayout, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
      <BottomNavBar currentTab={currentTab} onTabPress={onTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  mainLayout: {
    flex: 1,
    backgroundColor: palette.softMint, // #F5FAF8
  },
  content: {
    flex: 1,
    paddingBottom: 60,
  },
});
