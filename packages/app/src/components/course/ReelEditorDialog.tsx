/**
 * @file ReelEditorDialog.tsx
 * @description Reel guidance and explicit confirmations for discarding drafts or restoring item order and deletions.
 */
import ModalCloseSvg from '../../../assets/images/figma-course/modal-close.svg';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../common/Typography';
import { FigmaAsset } from '../common/FigmaAsset';
import { InfoDialog } from '../common/InfoDialog';
import { BOOKING_REEL_UI } from '../../constants/bookingReelUiStrings';
import { UI_STRINGS } from '../../constants/strings';
import { palette, hexToRgba } from '../../theme/colors';

export type ReelEditorDialogMode = 'info' | 'leave' | 'reset' | null;
const V = BOOKING_REEL_UI.REEL;

/** Dismissal retains all edits; only explicit confirmation leaves the editor or resets its items. */
export function ReelEditorDialog({
  mode,
  destination,
  date,
  onDismiss,
  onLeave,
  onReset,
}: {
  mode: ReelEditorDialogMode;
  destination: string;
  date: string;
  onDismiss: () => void;
  onLeave: () => void;
  onReset: () => void;
}) {
  if (!mode) return null;
  if (mode === 'info')
    return (
      <InfoDialog
        visible
        testID='reel-info-modal'
        title={V.INFO_TITLE}
        message={V.INFO(destination, date)}
        closeLabel={V.CLOSE}
        onDismiss={onDismiss}
      />
    );
  const isReset = mode === 'reset';
  return (
    <Modal
      testID={isReset ? 'reel-reset-modal' : 'reel-leave-modal'}
      visible
      transparent
      animationType='fade'
      onRequestClose={onDismiss}>
      <View style={styles.leaveOverlay}>
        <Pressable
          testID='reel-dialog-backdrop'
          accessible={false}
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
        />
        <View style={styles.leaveCard} accessibilityViewIsModal>
          <Pressable
            testID='reel-dialog-close'
            accessibilityRole='button'
            accessibilityLabel={V.CLOSE}
            style={styles.close}
            onPress={onDismiss}>
            <FigmaAsset source={ModalCloseSvg} width={24} height={24} />
          </Pressable>
          <View style={styles.summary}>
            <Text style={styles.destination}>{destination}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
          <Text style={styles.leaveTitle} accessibilityRole='header'>
            {isReset ? V.RESET_TITLE : V.LEAVE_TITLE}
          </Text>
          <Text style={styles.leaveMessage}>
            {isReset ? V.RESET_MESSAGE : V.LEAVE_MESSAGE}
          </Text>
          <View style={styles.actions}>
            <Pressable
              testID={isReset ? 'reel-cancel-reset' : 'reel-keep-editing'}
              accessibilityRole='button'
              style={styles.cancelButton}
              onPress={onDismiss}>
              <Text style={styles.cancelText}>
                {isReset ? V.CANCEL_RESET : V.KEEP_EDITING}
              </Text>
            </Pressable>
            <Pressable
              testID={isReset ? 'reel-confirm-reset' : 'reel-confirm-leave'}
              accessibilityRole='button'
              style={styles.leaveButton}
              onPress={isReset ? onReset : onLeave}>
              <Text style={styles.buttonText}>
                {isReset ? UI_STRINGS.REEL.RESET_ITEMS : V.LEAVE}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  leaveOverlay: {
    flex: 1,
    backgroundColor: hexToRgba(palette.black, 0.7),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  leaveCard: {
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
    fontSize: 20,
    fontWeight: '500',
    color: palette.deepNavy,
    letterSpacing: -1,
    textAlign: 'center',
  },
  date: { fontSize: 16, fontWeight: '500', color: palette.gray600 },
  leaveTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.deepNavy,
    letterSpacing: -1,
    textAlign: 'center',
  },
  leaveMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.gray400,
    lineHeight: 23,
    letterSpacing: -1,
    textAlign: 'center',
    marginTop: 4,
  },
  actions: { width: '100%', flexDirection: 'row', gap: 12, marginTop: 28 },
  cancelButton: {
    flex: 1,
    minHeight: 62,
    borderRadius: 16,
    backgroundColor: palette.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveButton: {
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
  buttonText: {
    fontSize: 20,
    fontWeight: '500',
    color: palette.white,
    letterSpacing: -0.6,
  },
});
