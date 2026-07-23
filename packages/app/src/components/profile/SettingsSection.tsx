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

export interface SettingsSectionProps {
  onPressTerms: () => void;
  onPressLogout: () => void;
  onPressWithdraw: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  onPressTerms,
  onPressLogout,
  onPressWithdraw,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionHeaderTitle}>계정 및 서비스 설정</Text>

      {/* 이용약관 */}
      <TouchableOpacity style={styles.menuItem} onPress={onPressTerms} activeOpacity={0.6}>
        <View style={styles.menuItemLeft}>
          <Ionicons name="document-text-outline" size={20} color="#475569" />
          <Text style={styles.menuItemText}>이용약관</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* 로그아웃 */}
      <TouchableOpacity style={styles.menuItem} onPress={onPressLogout} activeOpacity={0.6}>
        <View style={styles.menuItemLeft}>
          <Ionicons name="log-out-outline" size={20} color="#475569" />
          <Text style={styles.menuItemText}>로그아웃</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* 탈퇴하기 */}
      <TouchableOpacity style={styles.menuItem} onPress={onPressWithdraw} activeOpacity={0.6}>
        <View style={styles.menuItemLeft}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={[styles.menuItemText, styles.dangerText]}>탈퇴하기</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
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
    color: '#1E293B',
  },
  dangerText: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
});

export default SettingsSection;
