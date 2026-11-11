/**
 * @file AppVersionNotice.tsx
 * @description Displays a persistent update notice and opens the current platform's store on HTTP 426.
 */
import { useState, useSyncExternalStore } from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './Typography';
import {
  getVersionMismatch,
  subscribeVersionMismatch,
} from '../../services/appVersionService';
import { APP_CONFIG } from '../../constants/config';
import { UI_STRINGS } from '../../constants/strings';
import { theme } from '../../theme/colors';

/** Keeps update guidance visible until restart and allows retry when the store cannot open. */
export function AppVersionNotice() {
  const mismatch = useSyncExternalStore(
    subscribeVersionMismatch,
    getVersionMismatch,
  );
  const [openFailed, setOpenFailed] = useState(false);
  if (!mismatch) return null;

  const openStore = async () => {
    setOpenFailed(false);
    try {
      await Linking.openURL(
        Platform.OS === 'ios'
          ? APP_CONFIG.APP_STORE_URL
          : APP_CONFIG.PLAY_STORE_URL,
      );
    } catch {
      setOpenFailed(true);
    }
  };

  return (
    <Modal visible transparent animationType='fade' onRequestClose={() => {}}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text accessibilityRole='header' style={styles.title}>
            {UI_STRINGS.APP_UPDATE.TITLE}
          </Text>
          <Text style={styles.message}>{UI_STRINGS.APP_UPDATE.MESSAGE}</Text>
          {openFailed && (
            <Text accessibilityRole='alert' style={styles.error}>
              {UI_STRINGS.APP_UPDATE.STORE_ERROR}
            </Text>
          )}
          <Pressable
            accessibilityRole='button'
            style={styles.button}
            onPress={openStore}>
            <Text style={styles.buttonText}>
              {UI_STRINGS.APP_UPDATE.OPEN_STORE}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.bg.overlay,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    gap: 18,
    backgroundColor: theme.colors.bg.card,
  },
  title: { fontSize: 20, fontWeight: '600', color: theme.colors.text.primary },
  message: { fontSize: 15, lineHeight: 23, color: theme.colors.text.secondary },
  error: { fontSize: 14, color: theme.colors.text.danger },
  button: {
    minHeight: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
});
