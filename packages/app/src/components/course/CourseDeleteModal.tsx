/**
 * @file CourseDeleteModal.tsx
 * @description Bottom sheet modal component for confirming course deletion.
 * @requirements REQ-9
 * @functional FUN-3
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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.dimOverlay} testID="delete-modal-overlay">
          <TouchableWithoutFeedback>
            <View style={styles.bottomSheetContainer} testID="course-delete-modal-card">
              {/* Handle Bar */}
              <View style={styles.handleBar} />

              {/* Title & Warning Text */}
              <Text style={styles.modalTitle}>
                {UI_STRINGS.COURSE_LIST?.DELETE_MODAL_TITLE || '코스를 삭제하시겠습니까?'}
              </Text>
              <Text style={styles.modalSubTitle}>
                {courseTitle ? `"${courseTitle}" ` : ''}
                {UI_STRINGS.COURSE_LIST?.DELETE_MODAL_DESC || '삭제된 코스는 복구할 수 없습니다.'}
              </Text>

              {/* Action Buttons Group */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  testID="btn-confirm-delete"
                  style={styles.deleteButton}
                  onPress={onConfirmDelete}
                  activeOpacity={0.85}
                >
                  <Text style={styles.deleteButtonText}>
                    {UI_STRINGS.COURSE_LIST?.DELETE_MODAL_CONFIRM || '삭제하기'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="btn-cancel-delete"
                  style={styles.cancelButton}
                  onPress={onClose}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cancelButtonText}>
                    {UI_STRINGS.COURSE_LIST?.DELETE_MODAL_CANCEL || '취소'}
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
    backgroundColor: '#D9DEE5',
    borderRadius: 2,
    marginBottom: 4,
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
    color: '#73808C',
    textAlign: 'center',
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  deleteButton: {
    width: '100%',
    backgroundColor: '#EB4545',
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
    backgroundColor: '#F0F2F5',
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
