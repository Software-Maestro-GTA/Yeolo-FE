/**
 * @file ConfirmModal.tsx
 * @description Re-confirmation modal component for user logout and account withdrawal actions.
 * @requirements REQ-11, REQ-12
 * @functional FUN-4
 * @api API-FB-11, API-FB-12
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';

import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

export interface ConfirmModalProps {
  visible: boolean;
  type: 'logout' | 'withdraw';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  type,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const isLogout = type === 'logout';
  const title = isLogout ? UI_STRINGS.PROFILE.LOGOUT_CONFIRM : UI_STRINGS.PROFILE.WITHDRAW_NOTICE;
  const description = isLogout
    ? UI_STRINGS.PROFILE.LOGOUT_DESC
    : UI_STRINGS.PROFILE.WITHDRAW_CONFIRM;
  const confirmText = isLogout ? UI_STRINGS.PROFILE.LOGOUT_CONFIRM_BTN : UI_STRINGS.PROFILE.WITHDRAW_CONFIRM_BTN;

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>{UI_STRINGS.COMPONENTS.CONFIRM_CANCEL}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, !isLogout && styles.dangerButton]}
              onPress={onConfirm}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.text.inverse} />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: theme.colors.bg.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.subtle,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.border.light,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: theme.colors.status.error,
  },
  confirmButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 15,
    fontWeight: '600',
  },
});
