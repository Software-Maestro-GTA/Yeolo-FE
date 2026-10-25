/**
 * @file TasteReanalysisSheet.tsx
 * @description UI v3 재분석 안내 시트에서 사진 추가 안내와 재분석 확인·취소 동작을 제공합니다 (1644:99).
 */
import CloseSvg from '../../../assets/images/figma-course/close.svg';
import WarningCircleSvg from '../../../assets/ui-v3-onboarding/reanalysis-warning-circle.svg';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UI_STRINGS } from '../../constants';
import { useSheetEntrance } from '../../hooks/useSheetEntrance';
import { hexToRgba, palette } from '../../theme/colors';
import { FigmaAsset } from '../common/FigmaAsset';
import { Text } from '../common/Typography';
import { OnboardingButton } from '../onboarding/OnboardingButton';

/** Confirms reanalysis only through the primary action; dismissals preserve the current result. */
export function TasteReanalysisSheet({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const insets = useSafeAreaInsets();
  const entranceStyle = useSheetEntrance(visible);
  const insetStyles = StyleSheet.create({
    sheet: { paddingBottom: insets.bottom + 36 },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      testID='taste-reanalysis-modal'>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole='button'
          accessibilityLabel={UI_STRINGS.TASTE_PROFILE.REANALYZE_CLOSE}
          testID='taste-reanalysis-backdrop'
        />
        <Animated.View
          style={[styles.sheet, insetStyles.sheet, entranceStyle]}
          accessibilityViewIsModal
          testID='taste-reanalysis-sheet'>
          <Pressable
            onPress={onClose}
            style={styles.close}
            accessibilityRole='button'
            accessibilityLabel={UI_STRINGS.TASTE_PROFILE.REANALYZE_CLOSE}
            testID='taste-reanalysis-close'>
            <FigmaAsset source={CloseSvg} width={24} height={24} />
          </Pressable>
          <View style={styles.warning} accessible={false}>
            <FigmaAsset
              source={WarningCircleSvg}
              width={20}
              height={20}
              style={styles.warningCircle}
            />
            <Text style={styles.warningMark} accessible={false}>
              !
            </Text>
          </View>
          <Text style={styles.message}>
            {UI_STRINGS.TASTE_PROFILE.REANALYZE_NOTICE}
          </Text>
          <View style={styles.action}>
            <OnboardingButton
              label={UI_STRINGS.TASTE_PROFILE.REANALYZE_CONFIRM}
              onPress={onConfirm}
              testID='taste-reanalysis-confirm'
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: hexToRgba(palette.black, 0.7),
  },
  sheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 36,
    alignItems: 'center',
  },
  close: {
    position: 'absolute',
    top: 18,
    right: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warning: { width: 20, height: 27 },
  warningCircle: { position: 'absolute', top: 3, left: 0 },
  warningMark: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 27,
    letterSpacing: -1,
    textAlign: 'center',
    color: palette.privacyRed,
  },
  message: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 29,
    letterSpacing: -1,
    textAlign: 'center',
    color: palette.deepNavy,
  },
  action: { width: '100%', marginTop: 20 },
});
