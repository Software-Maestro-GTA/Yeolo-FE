/**
 * @file MainLayout.tsx
 * @description Main screen shell with optional legacy tab navigation; UI v3 screens use their own headers and entry points.
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
  showNavigation?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentTab,
  onTabPress,
  style,
  contentStyle,
  showNavigation = false,
}) => {
  return (
    <View style={[styles.mainLayout, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
      {showNavigation && (
        <BottomNavBar currentTab={currentTab} onTabPress={onTabPress} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainLayout: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: palette.softMint,
  },
  content: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
