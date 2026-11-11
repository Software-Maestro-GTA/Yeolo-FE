/**
 * @file CourseDeleteModal.tsx
 * @description UI v3 중앙 삭제 확인 모달에 실제 코스 요약과 취소·삭제 상태를 표시합니다.
 */
import ModalCloseSvg from '../../../assets/images/figma-course/modal-close.svg';
import React from 'react';
import { StyleSheet, View, Pressable, Modal } from 'react-native';
import type { CourseSummary } from '@yeolo/common';
import { palette, hexToRgba } from '../../theme/colors';
import { COURSE_UI } from '../../constants/courseUiStrings';
import { formatCourseDateRange } from '../../utils/courseDateRange';
import { FigmaAsset } from '../common/FigmaAsset';
import { Text } from '../common/Typography';

export interface CourseDeleteModalProps {
  visible: boolean;
  courseTitle?: string;
  course?: CourseSummary | null;
  pending?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirmDelete: () => void;
}

/** Keeps the destructive action explicit and blocks duplicate submissions while pending. */
export const CourseDeleteModal: React.FC<CourseDeleteModalProps> = ({
  visible,
  courseTitle,
  course,
  pending = false,
  errorMessage,
  onClose,
  onConfirmDelete,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType='fade'
    onRequestClose={pending ? undefined : onClose}>
    <View style={styles.overlay}>
      <Pressable
        style={StyleSheet.absoluteFill}
        testID='delete-modal-overlay'
        accessibilityLabel={COURSE_UI.CLOSE}
        disabled={pending}
        onPress={onClose}
      />
      <View
        style={styles.card}
        testID='course-delete-modal-card'
        accessibilityViewIsModal>
        <Pressable
          style={styles.close}
          accessibilityRole='button'
          accessibilityLabel={COURSE_UI.CLOSE}
          disabled={pending}
          onPress={onClose}>
          <FigmaAsset source={ModalCloseSvg} width={24} height={24} />
        </Pressable>
        <View style={styles.summary} testID='course-delete-summary'>
          {course ? (
            <>
              <View style={styles.destination}>
                <Text style={styles.destinationText} numberOfLines={1}>
                  {course.destinationCountry}
                </Text>
                <View style={styles.divider} />
                <Text style={styles.destinationText} numberOfLines={1}>
                  {course.destinationCity}
                </Text>
              </View>
              <Text style={styles.date}>{formatCourseDateRange(course)}</Text>
            </>
          ) : (
            <Text style={styles.destinationText}>{courseTitle}</Text>
          )}
        </View>
        <Text style={styles.title}>{COURSE_UI.DELETE_TITLE}</Text>
        <Text style={styles.description}>{COURSE_UI.DELETE_DESCRIPTION}</Text>
        {errorMessage ? (
          <Text style={styles.error} accessibilityRole='alert'>
            {errorMessage}
          </Text>
        ) : null}
        <View style={styles.buttons}>
          <Pressable
            testID='btn-cancel-delete'
            accessibilityRole='button'
            disabled={pending}
            style={styles.cancelButton}
            onPress={onClose}>
            <Text style={styles.cancelText}>{COURSE_UI.CANCEL}</Text>
          </Pressable>
          <Pressable
            testID='btn-confirm-delete'
            accessibilityRole='button'
            accessibilityState={{ disabled: pending, busy: pending }}
            disabled={pending}
            style={[styles.deleteButton, pending && styles.pendingButton]}
            onPress={onConfirmDelete}>
            <Text style={styles.deleteText}>{COURSE_UI.DELETE}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: hexToRgba(palette.black, 0.7),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    transform: [{ translateY: -16 }],
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    backgroundColor: palette.white,
    alignItems: 'center',
  },
  close: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    minWidth: 213,
    maxWidth: '100%',
    minHeight: 79,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  destination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  destinationText: {
    fontSize: 20,
    fontWeight: '500',
    color: palette.deepNavy,
    letterSpacing: -1,
    flexShrink: 1,
  },
  divider: { width: 2, height: 16, backgroundColor: palette.gray200 },
  date: { fontSize: 16, fontWeight: '500', color: palette.gray600 },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.deepNavy,
    letterSpacing: -1,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.gray400,
    letterSpacing: -1,
    textAlign: 'center',
    marginTop: 4,
  },
  error: {
    fontSize: 14,
    color: palette.red500,
    textAlign: 'center',
    marginTop: 12,
  },
  buttons: { width: '100%', flexDirection: 'row', gap: 12, marginTop: 28 },
  cancelButton: {
    flex: 1,
    minHeight: 62,
    borderRadius: 16,
    backgroundColor: palette.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    flex: 1,
    minHeight: 62,
    borderRadius: 16,
    backgroundColor: palette.red500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 20,
    fontWeight: '500',
    color: palette.gray600,
    letterSpacing: -0.6,
  },
  deleteText: {
    fontSize: 20,
    fontWeight: '500',
    color: palette.white,
    letterSpacing: -0.6,
  },
  pendingButton: { opacity: 0.6 },
});
