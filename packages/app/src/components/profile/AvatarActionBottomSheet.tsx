/**
 * @file AvatarActionBottomSheet.tsx
 * @description Bottom sheet modal component for selecting avatar photo from gallery or resetting to default image in ProfileInputScreen.
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
import { Ionicons } from '@expo/vector-icons';
import { palette, hexToRgba } from '../../theme/colors';
import { UI_STRINGS } from '../../constants';

export interface AvatarActionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectGallery: () => void;
  onResetDefault: () => void;
}

export const AvatarActionBottomSheet: React.FC<
  AvatarActionBottomSheetProps
> = ({ visible, onClose, onSelectGallery, onResetDefault }) => {
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
        <View style={styles.dimOverlay} testID='avatar-sheet-overlay'>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.bottomSheetContainer,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
              testID='avatar-action-bottom-sheet'>
              {/* Handle Bar */}
              <View style={styles.handleBar} />

              {/* Sheet Title */}
              <Text style={styles.modalTitle}>
                {UI_STRINGS.PROFILE_INPUT.AVATAR_ALERT_TITLE}
              </Text>
              <Text style={styles.modalSubTitle}>
                {UI_STRINGS.PROFILE_INPUT.AVATAR_ALERT_MESSAGE}
              </Text>

              {/* Options List */}
              <View style={styles.optionGroup}>
                {/* Gallery Option */}
                <TouchableOpacity
                  testID='btn-select-gallery'
                  style={styles.optionItem}
                  onPress={() => {
                    onClose();
                    onSelectGallery();
                  }}
                  activeOpacity={0.75}>
                  <View style={[styles.iconWrapper, styles.galleryIconBg]}>
                    <Ionicons
                      name='image-outline'
                      size={20}
                      color={palette.primary}
                    />
                  </View>
                  <Text style={styles.optionText}>
                    {UI_STRINGS.PROFILE_INPUT.AVATAR_SELECT_GALLERY}
                  </Text>
                  <Ionicons
                    name='chevron-forward'
                    size={18}
                    color={palette.gray400}
                  />
                </TouchableOpacity>

                {/* Reset Default Option */}
                <TouchableOpacity
                  testID='btn-reset-default'
                  style={styles.optionItem}
                  onPress={() => {
                    onClose();
                    onResetDefault();
                  }}
                  activeOpacity={0.75}>
                  <View style={[styles.iconWrapper, styles.resetIconBg]}>
                    <Ionicons
                      name='person-outline'
                      size={20}
                      color={palette.subText}
                    />
                  </View>
                  <Text style={styles.optionText}>
                    {UI_STRINGS.PROFILE_INPUT.AVATAR_RESET_DEFAULT}
                  </Text>
                  <Ionicons
                    name='chevron-forward'
                    size={18}
                    color={palette.gray400}
                  />
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                testID='btn-cancel-avatar-sheet'
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.85}>
                <Text style={styles.cancelButtonText}>
                  {UI_STRINGS.COMMON.CONFIRM_CANCEL}
                </Text>
              </TouchableOpacity>
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
    paddingBottom: 36,
    alignItems: 'center',
    gap: 14,
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
    fontSize: 13,
    fontWeight: '400',
    color: palette.subText,
    textAlign: 'center',
    marginBottom: 4,
  },
  optionGroup: {
    width: '100%',
    gap: 8,
  },
  optionItem: {
    width: '100%',
    height: 56,
    backgroundColor: palette.softMint,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(217, 222, 229, 0.6)',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  galleryIconBg: {
    backgroundColor: hexToRgba(palette.primary, 0.1),
  },
  resetIconBg: {
    backgroundColor: palette.gray200,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: palette.deepNavy,
  },
  cancelButton: {
    width: '100%',
    height: 50,
    backgroundColor: palette.gray100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.subText,
  },
});
