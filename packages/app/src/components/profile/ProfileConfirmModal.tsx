/**
 * @file ProfileConfirmModal.tsx
 * @description Bottom sheet modal component for confirming user logout and account withdrawal actions in ProfileScreen.
 */
import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from 'react-native';
import { palette, hexToRgba } from '../../theme/colors';
import { UI_STRINGS } from '../../constants';

export interface ProfileConfirmModalProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmText: string;
  cancelText?: string;
  isDestructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ProfileConfirmModal: React.FC<ProfileConfirmModalProps> = ({
  visible,
  title,
  description,
  confirmText,
  cancelText = UI_STRINGS.PROFILE.CONFIRM_CANCEL,
  isDestructive = true,
  onClose,
  onConfirm,
}) => {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.dimOverlay} testID='profile-confirm-modal-overlay'>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.bottomSheetContainer,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
              testID='profile-confirm-modal-card'>
              {/* Handle Bar */}
              <View style={styles.handleBar} />

              {/* Title & Description */}
              <Text style={styles.modalTitle}>{title}</Text>
              {Boolean(description) && (
                <Text style={styles.modalSubTitle}>{description}</Text>
              )}

              {/* Action Buttons Group */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  testID='btn-confirm-action'
                  style={[
                    styles.actionButton,
                    isDestructive
                      ? styles.destructiveButton
                      : styles.primaryButton,
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.85}>
                  <Text style={styles.actionButtonText}>{confirmText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID='btn-cancel-action'
                  style={styles.cancelButton}
                  onPress={onClose}
                  activeOpacity={0.85}>
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  dimOverlay: {
    flex: 1,
    backgroundColor: hexToRgba(palette.deepNavy, 0.45),
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 16,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: palette.gray200,
    borderRadius: 2,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.deepNavy,
    textAlign: 'center',
  },
  modalSubTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: palette.subText,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destructiveButton: {
    backgroundColor: palette.red500,
  },
  primaryButton: {
    backgroundColor: palette.primary,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.white,
  },
  cancelButton: {
    width: '100%',
    height: 48,
    backgroundColor: palette.gray100,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.subText,
  },
});
