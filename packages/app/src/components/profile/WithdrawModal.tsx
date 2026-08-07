/**
 * @file WithdrawModal.tsx
 * @description Central popup modal component for confirming account withdrawal.
 * @requirements REQ-12
 * @functional FUN-8
 * @author Antigravity Agent
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { palette } from '../../theme/colors';
import { UI_STRINGS } from '../../constants';

export interface WithdrawModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmWithdraw: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  visible,
  onClose,
  onConfirmWithdraw,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.dimOverlay} testID="withdraw-modal-overlay">
          <TouchableWithoutFeedback>
            <View style={styles.modalCard} testID="withdraw-modal-card">
              {/* Title & Warning Stack */}
              <View style={styles.textStack}>
                <Text style={styles.modalTitle}>
                  {UI_STRINGS.PROFILE?.WITHDRAW_MODAL_TITLE || '정말 탈퇴하시겠습니까?'}
                </Text>
                <Text style={styles.modalSubTitle}>
                  {UI_STRINGS.PROFILE?.WITHDRAW_MODAL_DESC || '탈퇴 시 모든 데이터가 삭제되며\n복구할 수 없습니다.'}
                </Text>
              </View>

              {/* Action Buttons Group */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  testID="btn-cancel-withdraw"
                  style={styles.cancelBtn}
                  onPress={onClose}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cancelBtnText}>
                    {UI_STRINGS.COMMON?.CANCEL || '취소'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="btn-confirm-withdraw"
                  style={styles.confirmWithdrawBtn}
                  onPress={onConfirmWithdraw}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmWithdrawBtnText}>
                    {UI_STRINGS.PROFILE?.WITHDRAW_LINK || '탈퇴하기'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  dimOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: palette.white,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 20,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  textStack: {
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.deepNavy, // #0D2137
    textAlign: 'center',
  },
  modalSubTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#59616B',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: palette.primary, // #2D7DD2
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.white,
  },
  confirmWithdrawBtn: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmWithdrawBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999999',
  },
});
