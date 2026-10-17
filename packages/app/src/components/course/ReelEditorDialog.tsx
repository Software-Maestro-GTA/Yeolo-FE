/**
 * @file ReelEditorDialog.tsx
 * @description Reel guidance and discard confirmation using the booking info and course deletion modal styles.
 */
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../common/Typography';
import { FigmaAsset } from '../common/FigmaAsset';
import { BOOKING_REEL_UI } from '../../constants/bookingReelUiStrings';
import { palette, hexToRgba } from '../../theme/colors';

export type ReelEditorDialogMode = 'info' | 'leave' | null;
const V = BOOKING_REEL_UI.REEL;

/** Dismissal always retains the draft; only the explicit leave action discards it. */
export function ReelEditorDialog({
  mode,
  destination,
  date,
  onDismiss,
  onLeave,
}: {
  mode: ReelEditorDialogMode;
  destination: string;
  date: string;
  onDismiss: () => void;
  onLeave: () => void;
}) {
  if (!mode) return null;
  const leaving = mode === 'leave';
  return (
    <Modal
      testID={`reel-${mode}-modal`}
      visible
      transparent
      animationType='fade'
      onRequestClose={onDismiss}>
      <View style={leaving ? styles.leaveOverlay : styles.infoOverlay}>
        <Pressable
          testID='reel-dialog-backdrop'
          accessible={false}
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
        />
        <View
          style={leaving ? styles.leaveCard : styles.infoCard}
          accessibilityViewIsModal>
          {leaving ? (
            <>
              <Pressable
                testID='reel-dialog-close'
                accessibilityRole='button'
                accessibilityLabel={V.CLOSE}
                style={styles.close}
                onPress={onDismiss}>
                <FigmaAsset
                  source={require('../../../assets/images/figma-course/modal-close.svg')}
                  width={24}
                  height={24}
                />
              </Pressable>
              <View style={styles.summary}>
                <Text style={styles.destination}>{destination}</Text>
                <Text style={styles.date}>{date}</Text>
              </View>
              <Text style={styles.leaveTitle} accessibilityRole='header'>
                {V.LEAVE_TITLE}
              </Text>
              <Text style={styles.leaveMessage}>{V.LEAVE_MESSAGE}</Text>
              <View style={styles.actions}>
                <Pressable
                  testID='reel-keep-editing'
                  accessibilityRole='button'
                  style={styles.cancelButton}
                  onPress={onDismiss}>
                  <Text style={styles.cancelText}>{V.KEEP_EDITING}</Text>
                </Pressable>
                <Pressable
                  testID='reel-confirm-leave'
                  accessibilityRole='button'
                  style={styles.leaveButton}
                  onPress={onLeave}>
                  <Text style={styles.buttonText}>{V.LEAVE}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.infoTitle} accessibilityRole='header'>
                {V.INFO_TITLE}
              </Text>
              <Text style={styles.infoBody}>{V.INFO(destination, date)}</Text>
              <Pressable
                testID='reel-dialog-close'
                accessibilityRole='button'
                style={styles.infoClose}
                onPress={onDismiss}>
                <Text style={styles.buttonText}>{V.CLOSE}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  infoOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: hexToRgba(palette.deepNavy, 0.4),
  },
  infoCard: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderRadius: 20,
    backgroundColor: palette.white,
    gap: 18,
  },
  infoTitle: { fontSize: 18, fontWeight: '600', color: palette.deepNavy },
  infoBody: { fontSize: 15, lineHeight: 23, color: palette.subText },
  infoClose: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: palette.primary,
  },
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
