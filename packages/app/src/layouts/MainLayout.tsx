/**
 * @file MainLayout.tsx
 * @description Shell layout component providing persistent bottom navigation bar for main tab screens.
 * @requirements REQ-11
 * @functional FUN-4
 * @author Antigravity Agent
 */
import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavBar, NavTab } from '../components/navigation/BottomNavBar';

export interface MainLayoutProps {
  children: React.ReactNode;
  currentTab: NavTab;
  onTabPress: (tab: NavTab) => void;
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
    <SafeAreaView style={[styles.mainLayout, style]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.content, contentStyle]}>{children}</View>
      <BottomNavBar currentTab={currentTab} onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainLayout: {
    flex: 1,
    backgroundColor: '#F6FAFE',
  },
  content: {
    flex: 1,
  },
});

export default MainLayout;
