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

export type NavTab = 'home' | 'explore' | 'create' | 'profile';

export interface BottomNavBarProps {
  currentTab?: NavTab;
  onTabPress?: (tab: NavTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab = 'profile',
  onTabPress,
}) => {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onTabPress?.('home')}
      >
        <Ionicons
          name={currentTab === 'home' ? 'home' : 'home-outline'}
          size={20}
          color={currentTab === 'home' ? '#4648D4' : '#76777C'}
        />
        <Text
          style={[
            styles.navText,
            currentTab === 'home' && styles.navTextActive,
          ]}
        >
          홈
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onTabPress?.('explore')}
      >
        <Ionicons
          name={currentTab === 'explore' ? 'compass' : 'compass-outline'}
          size={20}
          color={currentTab === 'explore' ? '#4648D4' : '#76777C'}
        />
        <Text
          style={[
            styles.navText,
            currentTab === 'explore' && styles.navTextActive,
          ]}
        >
          탐색
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onTabPress?.('create')}
      >
        <Ionicons
          name={currentTab === 'create' ? 'add-circle' : 'add-circle-outline'}
          size={22}
          color={currentTab === 'create' ? '#4648D4' : '#76777C'}
        />
        <Text
          style={[
            styles.navText,
            currentTab === 'create' && styles.navTextActive,
          ]}
        >
          생성
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onTabPress?.('profile')}
      >
        <Ionicons
          name={currentTab === 'profile' ? 'person' : 'person-outline'}
          size={20}
          color={currentTab === 'profile' ? '#4648D4' : '#76777C'}
        />
        <Text
          style={[
            styles.navText,
            currentTab === 'profile' && styles.navTextActive,
          ]}
        >
          프로필
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    flexDirection: 'row',
    justifyContent: 'space-around',

    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#76777C',
    marginTop: 4,
  },
  navTextActive: {
    color: '#4648D4',
    fontWeight: '700',
  },
});

export default BottomNavBar;
