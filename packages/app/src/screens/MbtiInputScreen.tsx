/**
 * @file MbtiInputScreen.tsx
 * @description MBTI selection screen matching exact Figma UI specifications with chevron-right icon.
 */
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import { useUpdatePreferencesMutation } from '../hooks/queries/useAuthMutations';
import { getAuthErrorMessage } from '../utils/errorUtils';

interface MbtiInputScreenProps {
  onNext: () => void; // "다음으로" 클릭 시 코스 생성 화면으로 이동
  onDetailRecommend: () => void; // "더 정확한 추천 받기" 클릭 시 사진 분석 동의 화면으로 이동
}

type EI = 'E' | 'I';
type SN = 'S' | 'N';
type TF = 'T' | 'F';
type JP = 'J' | 'P';

export const MbtiInputScreen: React.FC<MbtiInputScreenProps> = ({
  onNext,
  onDetailRecommend,
}) => {
  useGA4ScreenTracking('MbtiInputScreen');
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

  const handlePressNext = async () => {
    if (!isComplete) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          'MBTI 4개 항목을 모두 선택해 주세요.',
          ToastAndroid.SHORT,
        );
      } else {
        Alert.alert('알림', 'MBTI 4개 항목을 모두 선택해 주세요.');
      }
      return;
    }

    try {
      await updatePreferencesMutation.mutateAsync({ mbti: selectedMbti });
      trackButtonClick('btn_mbti_next', `MBTI Next (${selectedMbti})`);
      onNext();
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(
        err,
        'MBTI 저장에 실패했습니다. 다시 시도해 주세요.',
      );
      if (Platform.OS === 'android') {
        ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
      } else {
        Alert.alert('오류', errorMessage);
      }
    }
  };

  const handlePressAccurate = () => {
    trackButtonClick(
      'btn_mbti_accurate_recommend',
      `MBTI Accurate Recommend (${selectedMbti})`,
    );
    onDetailRecommend();
  };

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.contentContainer}>
          {/* Header Title Section */}
          <View style={styles.headerSection} testID='top-content'>
            <Text style={styles.mainTitle}>{UI_STRINGS.MBTI.MAIN_TITLE}</Text>
            <Text style={styles.subTitle}>{UI_STRINGS.MBTI.SUB_TITLE}</Text>
          </View>

          {/* Main Body: MBTI 4-Row 2-Column Options Grid */}
          <View
            style={styles.mbtiGridContainer}
            testID='mbti-selection-container'>
            {/* Row 1: E vs I */}
            <View style={styles.mbtiRow}>
              {/* Option E */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.mbtiOptionCard,
                  ei === 'E' ? styles.activeCard : styles.inactiveCard,
                ]}
                onPress={() => setEi('E')}
                testID='mbti-option-E'>
                <Text
                  style={[
                    styles.letterText,
                    ei === 'E'
                      ? styles.activeLetterText
                      : styles.inactiveLetterText,
                  ]}>
                  E
                </Text>
                <Text
                  style={[
                    styles.koreanText,
                    ei === 'E'
                      ? styles.activeKoreanText
                      : styles.inactiveKoreanText,
                  ]}>
                  외향형
                </Text>
              </TouchableOpacity>

              {/* Option I */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.mbtiOptionCard,
                  ei === 'I' ? styles.activeCard : styles.inactiveCard,
                ]}
                onPress={() => setEi('I')}
                testID='mbti-option-I'>
                <Text
                  style={[
                    styles.letterText,
                    ei === 'I'
                      ? styles.activeLetterText
                      : styles.inactiveLetterText,
                  ]}>
                  I
                </Text>
                <Text
                  style={[
                    styles.koreanText,
                    ei === 'I'
                      ? styles.activeKoreanText
                      : styles.inactiveKoreanText,
                  ]}>
                  내향형
                </Text>
              </TouchableOpacity>
            </View>

            {/* Row 2: S vs N */}
            <View style={styles.mbtiRow}>
              {/* Option S */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.mbtiOptionCard,
                  sn === 'S' ? styles.activeCard : styles.inactiveCard,
                ]}
                onPress={() => setSn('S')}
                testID='mbti-option-S'>
                <Text
                  style={[
                    styles.letterText,
                    sn === 'S'
                      ? styles.activeLetterText
                      : styles.inactiveLetterText,
                  ]}>
                  S
                </Text>
                <Text
                  style={[
                    styles.koreanText,
                    sn === 'S'
                      ? styles.activeKoreanText
                      : styles.inactiveKoreanText,
                  ]}>
                  감각형
                </Text>
              </TouchableOpacity>

              {/* Option N */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.mbtiOptionCard,
                  sn === 'N' ? styles.activeCard : styles.inactiveCard,
                ]}
                onPress={() => setSn('N')}
                testID='mbti-option-N'>
                <Text
                  style={[
                    styles.letterText,
                    sn === 'N'
                      ? styles.activeLetterText
                      : styles.inactiveLetterText,
                  ]}>
                  N
                </Text>
                <Text
                  style={[
                    styles.koreanText,
                    sn === 'N'
                      ? styles.activeKoreanText
                      : styles.inactiveKoreanText,
                  ]}>
                  직관형
                </Text>
              </TouchableOpacity>
            </View>

            {/* Row 3: T vs F */}
            <View style={styles.mbtiRow}>
              {/* Option T */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.mbtiOptionCard,
                  tf === 'T' ? styles.activeCard : styles.inactiveCard,
                ]}
                onPress={() => setTf('T')}
                testID='mbti-option-T'>
                <Text
                  style={[
                    styles.letterText,
                    tf === 'T'
                      ? styles.activeLetterText
                      : styles.inactiveLetterText,
                  ]}>
                  T
                </Text>
                <Text
                  style={[
                    styles.koreanText,
                    tf === 'T'
                      ? styles.activeKoreanText
                      : styles.inactiveKoreanText,
                  ]}>
                  사고형
                </Text>
              </TouchableOpacity>

              {/* Option F */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.mbtiOptionCard,
                  tf === 'F' ? styles.activeCard : styles.inactiveCard,
                ]}
                onPress={() => setTf('F')}
                testID='mbti-option-F'>
                <Text
                  style={[
                    styles.letterText,
                    tf === 'F'
                      ? styles.activeLetterText
                      : styles.inactiveLetterText,
                  ]}>
                  F
                </Text>
                <Text
                  style={[
                    styles.koreanText,
                    tf === 'F'
                      ? styles.activeKoreanText
                      : styles.inactiveKoreanText,
                  ]}>
                  감정형
                </Text>
              </TouchableOpacity>
            </View>

            {/* Row 4: J vs P */}
            <View style={styles.mbtiRow}>
              {/* Option J */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.mbtiOptionCard,
                  jp === 'J' ? styles.activeCard : styles.inactiveCard,
                ]}
                onPress={() => setJp('J')}
                testID='mbti-option-J'>
                <Text
                  style={[
                    styles.letterText,
                    jp === 'J'
                      ? styles.activeLetterText
                      : styles.inactiveLetterText,
                  ]}>
                  J
                </Text>
                <Text
                  style={[
                    styles.koreanText,
                    jp === 'J'
                      ? styles.activeKoreanText
                      : styles.inactiveKoreanText,
                  ]}>
                  판단형
                </Text>
              </TouchableOpacity>

              {/* Option P */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.mbtiOptionCard,
                  jp === 'P' ? styles.activeCard : styles.inactiveCard,
                ]}
                onPress={() => setJp('P')}
                testID='mbti-option-P'>
                <Text
                  style={[
                    styles.letterText,
                    jp === 'P'
                      ? styles.activeLetterText
                      : styles.inactiveLetterText,
                  ]}>
                  P
                </Text>
                <Text
                  style={[
                    styles.koreanText,
                    jp === 'P'
                      ? styles.activeKoreanText
                      : styles.inactiveKoreanText,
                  ]}>
                  인식형
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Container Action Buttons */}
          <View style={styles.bottomContainer} testID='bottom-container'>
            {/* Primary Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                updatePreferencesMutation.isPending && styles.disabledButton,
              ]}
              activeOpacity={0.8}
              disabled={updatePreferencesMutation.isPending}
              onPress={handlePressNext}
              testID='next-button'>
              <Text style={styles.primaryButtonText}>
                {UI_STRINGS.MBTI.NEXT_BUTTON}
              </Text>
              <Feather
                name='chevron-right'
                size={18}
                color={palette.white}
                style={styles.arrowIcon}
              />
            </TouchableOpacity>

            {/* Secondary Button: 📷 더 정확한 추천 받기 */}
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.8}
              onPress={handlePressAccurate}
              testID='accurate-recommend-button'>
              <Ionicons
                name='camera-outline'
                size={18}
                color={palette.accent}
                style={styles.cameraIconMargin}
              />
              <Text style={styles.secondaryButtonText}>
                {UI_STRINGS.MBTI.ACCURATE_RECOMMEND_BUTTON}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: palette.softMint,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerSection: {
    gap: 12,
    width: '100%',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: palette.deepNavy,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: palette.subText,
    lineHeight: 21,
  },
  mbtiGridContainer: {
    width: '100%',
    gap: 12,
    marginVertical: 12,
  },
  mbtiRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  mbtiOptionCard: {
    flex: 1,
    height: 88,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  activeCard: {
    backgroundColor: palette.lightTeal,
    borderWidth: 2,
    borderColor: palette.accent,
  },
  inactiveCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
  },
  letterText: {
    fontSize: 28,
    fontWeight: '800',
  },
  activeLetterText: {
    color: palette.accent,
  },
  inactiveLetterText: {
    color: palette.gray400,
  },
  koreanText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeKoreanText: {
    color: palette.deepNavy,
  },
  inactiveKoreanText: {
    color: palette.subText,
  },
  bottomContainer: {
    gap: 16,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: palette.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.white,
  },
  arrowIcon: {
    marginLeft: 6,
  },
  secondaryButton: {
    backgroundColor: palette.white,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: palette.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.accent,
  },
  cameraIconMargin: {
    marginRight: 6,
  },
});
