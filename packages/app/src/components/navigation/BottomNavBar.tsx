/**
 * @file BottomNavBar.tsx
 * @description Shared bottom navigation bar component matching project design system.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '../../theme/colors';

export type NavTab = 'home' | 'explore' | 'create' | 'profile';

export interface BottomNavBarProps {
  currentTab?: NavTab;
  onTabPress?: (tab: NavTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab = 'profile',
  onTabPress,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 0);

  const tabs: {
    id: NavTab;
    label: string;
    icon: keyof typeof Feather.glyphMap;
    size: number;
  }[] = [
    { id: 'home', label: '홈', icon: 'home', size: 18 },
    { id: 'explore', label: '탐색', icon: 'compass', size: 20 },
    { id: 'create', label: '생성', icon: 'plus', size: 22 },
    { id: 'profile', label: '프로필', icon: 'user', size: 18 },
  ];

  return (
    <View
      style={[
        styles.bottomNav,
        { height: 60 + bottomInset, paddingBottom: bottomInset },
      ]}
      testID='bottom-nav-bar'>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const iconColor = isActive ? palette.primary : '#9CA3AF';

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => onTabPress?.(tab.id)}
            testID={`tab-${tab.id}`}>
            <Feather name={tab.icon} size={tab.size} color={iconColor} />
            <Text
              style={[
                styles.navText,
                isActive ? styles.navTextActive : styles.navTextInactive,
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: 'rgba(45, 125, 210, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
  navItem: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 11,
    lineHeight: 14,
  },
  navTextActive: {
    color: palette.primary, // #2D7DD2
    fontWeight: '700',
  },
  navTextInactive: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
