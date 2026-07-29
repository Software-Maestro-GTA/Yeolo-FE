/**
 * @file SettingsSection.tsx
 * @description Settings list component displaying options for Terms of Service, Logout, and Account Withdrawal.
 * @requirements REQ-11, REQ-12
 * @functional FUN-4
 * @api API-FB-11, API-FB-12
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

export interface SettingsSectionProps {
  onPressTerms: () => void;
  onPressLogout: () => void;
  onPressWithdraw: () => void;
  onPressSupport?: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  onPressTerms,
  onPressLogout,
  onPressWithdraw,
  onPressSupport,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionHeaderTitle}>{UI_STRINGS.COMPONENTS.SETTINGS_TITLE}</Text>

      {/* 이용약관 */}
      <TouchableOpacity style={styles.menuItem} onPress={onPressTerms} activeOpacity={0.6}>
        <View style={styles.menuItemLeft}>
          <Ionicons name="document-text-outline" size={20} color={theme.colors.text.secondary} />
          <Text style={styles.menuItemText}>{UI_STRINGS.COMPONENTS.TERMS_SERVICE}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.text.placeholder} />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* 고객 지원 */}
      <TouchableOpacity style={styles.menuItem} onPress={onPressSupport} activeOpacity={0.6}>
        <View style={styles.menuItemLeft}>
          <Ionicons name="help-circle-outline" size={20} color={theme.colors.text.secondary} />
          <Text style={styles.menuItemText}>{UI_STRINGS.COMMON.CUSTOMER_SUPPORT_LINK}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.text.placeholder} />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* 로그아웃 */}
      <TouchableOpacity style={styles.menuItem} onPress={onPressLogout} activeOpacity={0.6}>
        <View style={styles.menuItemLeft}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.text.secondary} />
          <Text style={styles.menuItemText}>{UI_STRINGS.PROFILE.LOGOUT}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.text.placeholder} />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* 탈퇴하기 */}
      <TouchableOpacity style={styles.menuItem} onPress={onPressWithdraw} activeOpacity={0.6}>
        <View style={styles.menuItemLeft}>
          <Ionicons name="trash-outline" size={20} color={theme.colors.status.error} />
          <Text style={[styles.menuItemText, styles.dangerText]}>{UI_STRINGS.PROFILE.WITHDRAW}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.status.error} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bg.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.placeholder,
    marginBottom: 8,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  dangerText: {
    color: theme.colors.status.error,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
  },
});
