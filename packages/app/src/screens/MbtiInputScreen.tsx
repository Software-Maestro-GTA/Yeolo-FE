/**
 * @file MbtiInputScreen.tsx
 * @description Accessible MBTI selection grid and API save action using the blue UI v3 selection states (1196:902, 1196:935).
 */
import { Text } from '../components/common/Typography';
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ToastAndroid,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingSvg } from '../components/taste/OnboardingIllustrations';
import { ONBOARDING_UI_STRINGS } from '../constants/onboardingUiStrings';
import { palette, hexToRgba } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import { useUpdatePreferencesMutation } from '../hooks/queries/useAuthMutations';
import type { MbtiType } from '../constants/mbtiProfiles';
import { getAuthErrorMessage } from '../utils/errorUtils';

interface MbtiInputScreenProps {
  onBack?: () => void;
  onNext: (mbti: MbtiType) => void; // 저장된 MBTI 결과 화면으로 이동
  onDetailRecommend?: () => void; // "더 정확한 추천 받기" 클릭 시 사진 분석 동의 화면으로 이동
}

type EI = 'E' | 'I';
type SN = 'S' | 'N';
type TF = 'T' | 'F';
type JP = 'J' | 'P';

export const MbtiInputScreen: React.FC<MbtiInputScreenProps> = ({
  onNext,
  onBack,
}) => {
  useGA4ScreenTracking('MbtiInputScreen');
  const insets = useSafeAreaInsets();
  const insetStyles = StyleSheet.create({
    content: { paddingBottom: insets.bottom + 46 },
  });
  const { trackButtonClick } = useGA4ButtonClick();
  const updatePreferencesMutation = useUpdatePreferencesMutation();

  // 초기 상태: 아무것도 선택되지 않은 unselected 상태 (null)
  const [ei, setEi] = useState<EI | null>(null);
  const [sn, setSn] = useState<SN | null>(null);
  const [tf, setTf] = useState<TF | null>(null);
  const [jp, setJp] = useState<JP | null>(null);

  // MBTI 4개 항목(E/I, S/N, T/F, J/P)이 모두 선택되었는지 검증
  const isComplete = Boolean(ei && sn && tf && jp);
  const selectedMbti = `${ei || '_'}${sn || '_'}${tf || '_'}${jp || '_'}`;

  const handlePressNext = () => {
    if (!isComplete) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          ONBOARDING_UI_STRINGS.MBTI_REQUIRED,
          ToastAndroid.SHORT,
        );
      } else {
        Alert.alert(
          ONBOARDING_UI_STRINGS.NOTICE,
          ONBOARDING_UI_STRINGS.MBTI_REQUIRED,
        );
      }
      return;
    }

    updatePreferencesMutation.mutate(
      { mbti: selectedMbti },
      {
        onSuccess: () => {
          trackButtonClick('btn_mbti_next', `MBTI Next (${selectedMbti})`);
          onNext(selectedMbti as MbtiType);
        },
        onError: (err: any) => {
          const errorMessage = getAuthErrorMessage(
            err,
            ONBOARDING_UI_STRINGS.MBTI_SAVE_ERROR,
          );
          if (Platform.OS === 'android') {
            ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
          } else {
            Alert.alert(UI_STRINGS.ONBOARDING.ERROR_TITLE, errorMessage);
          }
        },
      },
    );
  };

  const selections = [ei, sn, tf, jp];
  const selectOption = (row: number, letter: string) => {
    if (row === 0) setEi(letter as EI);
    else if (row === 1) setSn(letter as SN);
    else if (row === 2) setTf(letter as TF);
    else setJp(letter as JP);
  };
  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={[styles.contentContainer, insetStyles.content]}
        showsVerticalScrollIndicator={false}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole='button'
            accessibilityLabel={UI_STRINGS.ONBOARDING.BACK}>
            <OnboardingSvg
              source={require('../../assets/ui-v3-onboarding/back.svg')}
            />
          </TouchableOpacity>
        )}
        <Text style={styles.mainTitle}>{UI_STRINGS.MBTI.MAIN_TITLE}</Text>
        <View
          style={styles.mbtiGridContainer}
          testID='mbti-selection-container'>
          {ONBOARDING_UI_STRINGS.MBTI_OPTIONS.map((pair, row) => (
            <View
              key={row}
              style={styles.mbtiRow}
              accessibilityRole='radiogroup'>
              {pair.map(({ letter, label }) => (
                <TouchableOpacity
                  key={letter}
                  accessibilityRole='radio'
                  accessibilityLabel={label}
                  accessibilityState={{
                    checked: selections[row] === letter,
                    disabled: updatePreferencesMutation.isPending,
                  }}
                  disabled={updatePreferencesMutation.isPending}
                  activeOpacity={0.8}
                  style={[
                    styles.mbtiOptionCard,
                    selections[row] === letter
                      ? styles.activeCard
                      : styles.inactiveCard,
                  ]}
                  onPress={() => selectOption(row, letter)}
                  testID={`mbti-option-${letter}`}>
                  <Text
                    style={[
                      styles.letterText,
                      selections[row] === letter
                        ? styles.activeLetterText
                        : styles.inactiveLetterText,
                    ]}>
                    {letter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
        <View style={styles.bottomContainer} testID='bottom-container'>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityState={{
              disabled: !isComplete || updatePreferencesMutation.isPending,
              busy: updatePreferencesMutation.isPending,
            }}
            style={[
              styles.primaryButton,
              (!isComplete || updatePreferencesMutation.isPending) &&
                styles.disabledButton,
            ]}
            disabled={!isComplete || updatePreferencesMutation.isPending}
            activeOpacity={0.8}
            onPress={handlePressNext}
            testID='next-button'>
            <Text
              style={[
                styles.primaryButtonText,
                (!isComplete || updatePreferencesMutation.isPending) &&
                  styles.disabledButtonText,
              ]}>
              {UI_STRINGS.MBTI.NEXT_BUTTON}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: palette.white },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: palette.deepNavy,
    lineHeight: 37,
    letterSpacing: -1,
    paddingHorizontal: 12,
  },
  mbtiGridContainer: {
    width: '100%',
    gap: 15,
    marginTop: 32,
    marginBottom: 21,
  },
  mbtiRow: { flexDirection: 'row', gap: 12, width: '100%' },
  mbtiOptionCard: {
    flex: 1,
    minHeight: 109,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCard: {
    backgroundColor: hexToRgba(palette.primary, 0.2),
    borderWidth: 1,
    borderColor: palette.primary,
  },
  inactiveCard: {
    backgroundColor: palette.gray100,
    borderWidth: 1,
    borderColor: palette.gray100,
  },
  letterText: { fontSize: 48, fontWeight: '800', lineHeight: 58 },
  activeLetterText: { color: palette.primary },
  inactiveLetterText: { color: palette.gray400 },
  bottomContainer: { marginTop: 'auto' },
  primaryButton: {
    backgroundColor: palette.primary,
    minHeight: 62,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: { backgroundColor: palette.gray200 },
  disabledButtonText: { color: palette.subText },
  primaryButtonText: {
    fontSize: 20,
    lineHeight: 37,
    letterSpacing: -0.6,
    fontWeight: '500',
    color: palette.white,
    textAlign: 'center',
  },
});
