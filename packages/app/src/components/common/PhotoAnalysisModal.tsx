/**
 * @file PhotoAnalysisModal.tsx
 * @description Quick confirm modal component asking user whether to start photo-based taste re-analysis.
 * @requirements REQ-8, REQ-11, REQ-22
 * @functional FUN-1, FUN-GA4
 * @api N/A
 * @author Antigravity Agent
 */
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useGA4ButtonClick } from '../../hooks';

export interface PhotoAnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PhotoAnalysisModal: React.FC<PhotoAnalysisModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const { trackButtonClick } = useGA4ButtonClick();

  const handleConfirm = () => {
    trackButtonClick('btn_photo_modal_confirm', 'Start Photo Re-analysis');
    onConfirm();
  };

  const handleCancel = () => {
    trackButtonClick('btn_photo_modal_cancel', 'Cancel Photo Re-analysis');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* Icon Badge */}
              <View style={styles.iconBadge}>
                <Ionicons name="sparkles" size={24} color={theme.colors.primary} />
              </View>

              {/* Title & Subtitle */}
              <View style={styles.textGroup}>
                <Text style={styles.title}>취향 프로필 재분석</Text>
                <Text style={styles.subtitle}>
                  나의 여행 성향 데이터를 기반으로 취향을 새롭게 분석할까요?
                </Text>
              </View>

              {/* Action Buttons Row (Yes / No style) */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.8}
                  onPress={handleCancel}
                  testID="modal-cancel-button"
                >
                  <Text style={styles.cancelButtonText}>아니오</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmButton}
                  activeOpacity={0.8}
                  onPress={handleConfirm}
                  testID="modal-confirm-button"
                >
                  <Text style={styles.confirmButtonText}>네, 시작할게요</Text>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.colors.bg.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  textGroup: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  confirmButton: {
    flex: 1.3,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.inverse,
  },
});
