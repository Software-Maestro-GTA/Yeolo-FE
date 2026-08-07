/**
 * @file ProfileEditModal.tsx
 * @description Modal component for editing user nickname and profile details.
 * @requirements REQ-11
 * @functional FUN-8
 * @author Antigravity Agent
 */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { palette } from '../../theme/colors';

export interface ProfileEditModalProps {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (newName: string) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  currentName,
  onClose,
  onSave,
}) => {
  const [nameInput, setNameInput] = useState(currentName);

  useEffect(() => {
    setNameInput(currentName);
  }, [currentName, visible]);

  const handleSave = () => {
    if (!nameInput.trim()) return;
    onSave(nameInput.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.dimOverlay} testID="profile-edit-modal-overlay">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidView}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalCard} testID="profile-edit-modal-card">
                <Text style={styles.modalTitle}>프로필 정보 수정</Text>
                <Text style={styles.modalSubTitle}>새로운 닉네임을 입력해 주세요.</Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    testID="input-nickname"
                    style={styles.textInput}
                    value={nameInput}
                    onChangeText={setNameInput}
                    placeholder="닉네임을 입력하세요"
                    placeholderTextColor="#99A1AB"
                    maxLength={20}
                  />
                </View>

                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    testID="btn-cancel-edit"
                    style={styles.cancelBtn}
                    onPress={onClose}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.cancelBtnText}>취소</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="btn-save-edit"
                    style={[styles.saveBtn, !nameInput.trim() && styles.disabledBtn]}
                    onPress={handleSave}
                    disabled={!nameInput.trim()}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.saveBtnText}>저장</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
  },
  keyboardAvoidView: {
    width: '100%',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    backgroundColor: palette.white,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.deepNavy,
    textAlign: 'center',
  },
  modalSubTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#59616B',
    textAlign: 'center',
    marginTop: -8,
  },
  inputContainer: {
    width: '100%',
    height: 48,
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginTop: 4,
  },
  textInput: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.deepNavy,
    padding: 0,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.deepNavy,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: palette.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.white,
  },
});
