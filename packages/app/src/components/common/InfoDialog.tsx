/**
 * @file InfoDialog.tsx
 * @description Shared app guidance modal used by reel information and course connection interruption notices.
 */
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Typography';
import { palette, hexToRgba } from '../../theme/colors';

interface InfoDialogProps {
  visible: boolean;
  title: string;
  message: string;
  closeLabel: string;
  onDismiss: () => void;
  testID?: string;
}

/** Displays guidance; the close button, backdrop and system back all dismiss it. */
export function InfoDialog({
  visible,
  title,
  message,
  closeLabel,
  onDismiss,
  testID = 'info-dialog',
}: InfoDialogProps) {
  if (!visible) return null;
  return (
    <Modal
      testID={testID}
      visible
      transparent
      animationType='fade'
      onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Pressable
          testID={`${testID}-backdrop`}
          accessible={false}
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
        />
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole='header'>
            {title}
          </Text>
          <Text style={styles.body}>{message}</Text>
          <Pressable
            testID={`${testID}-close`}
            accessibilityRole='button'
            style={styles.close}
            onPress={onDismiss}>
            <Text style={styles.buttonText}>{closeLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: hexToRgba(palette.deepNavy, 0.4),
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderRadius: 20,
    backgroundColor: palette.white,
    gap: 18,
  },
  title: { fontSize: 18, fontWeight: '600', color: palette.deepNavy },
  body: { fontSize: 15, lineHeight: 23, color: palette.subText },
  close: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: palette.primary,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '500',
    color: palette.white,
    letterSpacing: -0.6,
  },
});
