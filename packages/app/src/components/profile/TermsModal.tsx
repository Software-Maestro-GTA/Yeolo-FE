/**
 * @file TermsModal.tsx
 * @description Modal dialog component for displaying Terms of Service.
 * @requirements REQ-11
 * @functional FUN-4
 * @author Antigravity Agent
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';

import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

export interface TermsModalProps {
  visible: boolean;
  type?: 'service' | 'privacy';
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ visible, type = 'service', onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {type === 'privacy' ? '여로 개인정보 처리방침' : '여로 서비스 이용약관'}
              </Text>
              <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={true}>
                <Text style={styles.termsText}>
                  제1조 (목적){'\n'}
                  본 약관은 여로(Yeolo) 서비스 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.{'\n\n'}
                  제2조 (개인정보 보호 및 사용){'\n'}
                  회사는 정보통신망법 등 관계 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력을 다합니다.{'\n\n'}
                  제3조 (AI 맞춤형 서비스 제공){'\n'}
                  여로는 사용자의 여행 성향 및 위치 정보 데이터를 바탕으로 AI 초개인화 여행 코스를 추천합니다.{'\n\n'}
                  제4조 (계정 관리 및 탈퇴){'\n'}
                  회원은 언제든지 서비스 내 설정 메뉴를 통해 로그아웃 또는 회원탈퇴를 신청할 수 있으며, 탈퇴 시 관련 법령에 따라 보관되는 정보를 제외한 모든 데이터가 즉시 파기됩니다.
                </Text>
              </ScrollView>

              <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.closeButtonText}>{UI_STRINGS.COMMON.CLOSE}</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: theme.colors.bg.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollContent: {
    marginBottom: 20,
  },
  termsText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 15,
    fontWeight: '600',
  },
});
