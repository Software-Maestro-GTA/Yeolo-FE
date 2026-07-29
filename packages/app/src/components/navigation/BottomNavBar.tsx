/**
 * @file BottomNavBar.tsx
 * @description Shared bottom navigation bar component following Figma UI v1 design.
 * @requirements REQ-11
 * @functional FUN-4
 * @api API-FB-8
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

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

  return (
    <View style={[styles.bottomNav, { height: 64 + bottomInset, paddingBottom: bottomInset }]}>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => onTabPress?.('home')}
      >
        <Ionicons
          name={currentTab === 'home' ? 'home' : 'home-outline'}
          size={20}
          color={currentTab === 'home' ? theme.colors.primary : theme.colors.text.muted}
        />
        <Text
          style={[
            styles.navText,
            currentTab === 'home' && styles.navTextActive,
          ]}
        >
          {UI_STRINGS.COMPONENTS.NAV_HOME}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => onTabPress?.('explore')}
      >
        <Ionicons
          name={currentTab === 'explore' ? 'compass' : 'compass-outline'}
          size={20}
          color={currentTab === 'explore' ? theme.colors.primary : theme.colors.text.muted}
        />
        <Text
          style={[
            styles.navText,
            currentTab === 'explore' && styles.navTextActive,
          ]}
        >
          {UI_STRINGS.COMPONENTS.NAV_EXPLORE}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => onTabPress?.('create')}
      >
        <Ionicons
          name={currentTab === 'create' ? 'add-circle' : 'add-circle-outline'}
          size={22}
          color={currentTab === 'create' ? theme.colors.primary : theme.colors.text.muted}
        />
        <Text
          style={[
            styles.navText,
            currentTab === 'create' && styles.navTextActive,
          ]}
        >
          {UI_STRINGS.COMPONENTS.NAV_CREATE}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => onTabPress?.('profile')}
      >
        <Ionicons
          name={currentTab === 'profile' ? 'person' : 'person-outline'}
          size={20}
          color={currentTab === 'profile' ? theme.colors.primary : theme.colors.text.muted}
        />
        <Text
          style={[
            styles.navText,
            currentTab === 'profile' && styles.navTextActive,
          ]}
        >
          {UI_STRINGS.COMPONENTS.NAV_PROFILE}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: theme.colors.bg.card,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  navItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.muted,
    marginTop: 4,
  },
  navTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  centerButtonLabelActive: {
    color: theme.colors.primary,
  },
});
