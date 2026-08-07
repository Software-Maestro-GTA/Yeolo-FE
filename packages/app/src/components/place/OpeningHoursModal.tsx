/**
 * @file OpeningHoursModal.tsx
 * @description Modal component for displaying weekly opening hours specifications.
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/colors';
import { UI_STRINGS } from '../../constants';

export interface OpeningHoursModalProps {
  visible: boolean;
  onClose: () => void;
  hoursData?: { day: string; hours: string; isToday?: boolean }[];
}

const DEFAULT_WEEKLY_HOURS = [
  { day: '월요일', hours: '10:00 - 22:00', isToday: true },
  { day: '화요일', hours: '10:00 - 22:00', isToday: false },
  { day: '수요일', hours: '10:00 - 22:00', isToday: false },
  { day: '목요일', hours: '10:00 - 22:00', isToday: false },
  { day: '금요일', hours: '10:00 - 22:00', isToday: false },
  { day: '토요일', hours: '10:00 - 22:00', isToday: false },
  { day: '일요일', hours: '10:00 - 22:00', isToday: false },
];

export const OpeningHoursModal: React.FC<OpeningHoursModalProps> = ({
  visible,
  onClose,
  hoursData = DEFAULT_WEEKLY_HOURS,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} testID="opening-hours-modal-overlay">
          <TouchableWithoutFeedback>
            <View style={styles.modalCard} testID="opening-hours-modal-card">
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {UI_STRINGS.PLACE_DETAIL.MODAL_TITLE}
                </Text>
                <TouchableOpacity
                  testID="close-modal-btn"
                  style={styles.closeBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color="#59616B" />
                </TouchableOpacity>
              </View>

              {/* Hours Rows List */}
              <View style={styles.hoursListContainer}>
                {hoursData.map((item) => (
                  <View key={item.day} style={styles.hourRow}>
                    <View style={styles.dayGroup}>
                      <Text
                        style={[
                          styles.dayText,
                          item.isToday && styles.todayDayText,
                        ]}
                      >
                        {item.day}
                      </Text>
                      {item.isToday && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>
                            {UI_STRINGS.PLACE_DETAIL.TODAY_BADGE}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.hoursText}>{item.hours}</Text>
                  </View>
                ))}
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
    backgroundColor: 'rgba(13, 33, 55, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: palette.white, // #FFFFFF
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.deepNavy, // #0D2137
  },
  closeBtn: {
    padding: 4,
  },
  hoursListContainer: {
    gap: 12,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.subText, // #59616B
  },
  todayDayText: {
    fontWeight: '700',
    color: palette.deepNavy,
  },
  todayBadge: {
    backgroundColor: '#E0F7F1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.accent, // #00C9A7
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.deepNavy,
  },
});
