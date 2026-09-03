/**
 * @file CourseDeleteModal.tsx
 * @description Bottom sheet modal component for confirming course deletion, featuring separated fade backdrop overlay and independent bottom sheet slide animation.
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

export interface CourseDeleteModalProps {
  visible: boolean;
  courseTitle?: string;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export const CourseDeleteModal: React.FC<CourseDeleteModalProps> = ({
  visible,
  courseTitle,
  onClose,
  onConfirmDelete,
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
        <View style={styles.dimOverlay} testID='delete-modal-overlay'>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.bottomSheetContainer,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
              testID='course-delete-modal-card'>
              {/* Handle Bar */}
              <View style={styles.handleBar} />

              {/* Title & Warning Text */}
              <Text style={styles.modalTitle}>
                {UI_STRINGS.COURSE_LIST.DELETE_MODAL_TITLE}
              </Text>
              <Text style={styles.modalSubTitle}>
                {courseTitle ? `"${courseTitle}" ` : ''}
                {UI_STRINGS.COURSE_LIST.DELETE_MODAL_DESC}
              </Text>

              {/* Action Buttons Group */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  testID='btn-confirm-delete'
                  style={styles.deleteButton}
                  onPress={onConfirmDelete}
                  activeOpacity={0.85}>
                  <Text style={styles.deleteButtonText}>
                    {UI_STRINGS.COURSE_LIST.DELETE_MODAL_CONFIRM}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID='btn-cancel-delete'
                  style={styles.cancelButton}
                  onPress={onClose}
                  activeOpacity={0.85}>
                  <Text style={styles.cancelButtonText}>
                    {UI_STRINGS.COURSE_LIST.DELETE_MODAL_CANCEL}
                  </Text>
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
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  deleteButton: {
    width: '100%',
    backgroundColor: palette.red500,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.white,
  },
  cancelButton: {
    width: '100%',
    backgroundColor: palette.gray100,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.deepNavy,
  },
});
