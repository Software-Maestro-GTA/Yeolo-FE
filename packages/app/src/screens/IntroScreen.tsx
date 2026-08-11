/**
 * @file IntroScreen.tsx
 * @description Application introduction screen matching Figma UI design specifications with 3-second auto-cycling carousel, background illustration images, and user touch interaction.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Image,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/colors';
import { UI_STRINGS, APP_IMAGES } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

interface IntroScreenProps {
  onNext: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onNext }) => {
  useGA4ScreenTracking('IntroScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef<boolean>(false);
  const activeIndexRef = useRef<number>(activeIndex);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const goToSlide = (
    nextIndex: number,
    direction: 'next' | 'prev' = 'next',
  ) => {
    if (nextIndex === activeIndexRef.current || isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const exitValue = direction === 'next' ? -350 : 350;
    const enterValue = direction === 'next' ? 350 : -350;

    Animated.timing(slideAnim, {
      toValue: exitValue,
      duration: 160,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setActiveIndex(nextIndex);
        slideAnim.setValue(enterValue);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          isAnimatingRef.current = false;
        });
      } else {
        isAnimatingRef.current = false;
      }
    });
  };

  // 5초마다 main-body 자동 전환 (0 -> 1 -> 2 -> 0 무한 순환)
  useEffect(() => {
    const timer = setInterval(() => {
      goToSlide((activeIndex + 1) % 3, 'next');
    }, 5000);

    return () => clearInterval(timer);
  }, [activeIndex]);

  // 사람이 "다음으로" 버튼을 눌렀을 때만 동작
  const handlePressNextButton = () => {
    trackButtonClick(
      'btn_intro_next',
      `Intro Next Button Slide ${activeIndex + 1}`,
    );
    onNext();
  };

  // 사람이 메인 바디 영역을 눌렀을 때의 터치 전환 (0 -> 1 -> 2 -> 0 순환)
  const handleMainBodyPress = () => {
    trackButtonClick(
      'btn_intro_main_body_touch',
      `Intro Main Body Touch Slide ${activeIndexRef.current + 1}`,
    );
    goToSlide((activeIndexRef.current + 1) % 3, 'next');
  };

  // 좌/우 터치 드래그 및 스와이프 제스처 (PanResponder)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        const currentIdx = activeIndexRef.current;
        if (dx < -30) {
          // 왼쪽으로 밀면 다음 슬라이드 (오른쪽에서 들어옴)
          const nextIdx = (currentIdx + 1) % 3;
          trackButtonClick(
            'btn_intro_swipe_next',
            `Intro Swipe Left to Slide ${nextIdx + 1}`,
          );
          goToSlide(nextIdx, 'next');
        } else if (dx > 30) {
          // 오른쪽으로 밀면 이전 슬라이드 (왼쪽에서 들어옴)
          const prevIdx = (currentIdx - 1 + 3) % 3;
          trackButtonClick(
            'btn_intro_swipe_prev',
            `Intro Swipe Right to Slide ${prevIdx + 1}`,
          );
          goToSlide(prevIdx, 'prev');
        } else {
          // 단순 클릭 시
          handleMainBodyPress();
        }
      },
    }),
  ).current;

  // Main Body Slide 0: 3가지 핵심 기능 카드 리스트 (앱 소개1)
  const renderSlide0 = () => (
    <View style={styles.cardListContainer}>
      <View style={styles.featureCard}>
        <View style={styles.iconBg}>
          <Ionicons name='heart' size={20} color={palette.primary} />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>
            {UI_STRINGS.INTRO.SLIDE_0_CARD_1_TITLE}
          </Text>
          <Text style={styles.cardDesc}>
            {UI_STRINGS.INTRO.SLIDE_0_CARD_1_DESC}
          </Text>
        </View>
      </View>

      <View style={styles.featureCard}>
        <View style={styles.iconBg}>
          <Ionicons name='map' size={20} color={palette.accent} />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>
            {UI_STRINGS.INTRO.SLIDE_0_CARD_2_TITLE}
          </Text>
          <Text style={styles.cardDesc}>
            {UI_STRINGS.INTRO.SLIDE_0_CARD_2_DESC}
          </Text>
        </View>
      </View>

      <View style={styles.featureCard}>
        <View style={styles.iconBg}>
          <Ionicons name='share-social' size={20} color={palette.primary} />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>
            {UI_STRINGS.INTRO.SLIDE_0_CARD_3_TITLE}
          </Text>
          <Text style={styles.cardDesc}>
            {UI_STRINGS.INTRO.SLIDE_0_CARD_3_DESC}
          </Text>
        </View>
      </View>
    </View>
  );

  // Main Body Slide 1: AI 사진 파싱 및 취향 스캐닝 (앱 소개2)
  const renderSlide1 = () => (
    <View style={styles.illustrationFrame}>
      {/* Background Illustration Image */}
      <Image
        source={APP_IMAGES.INTRO_PHOTO_ANALYSIS}
        style={styles.bgIllustrationImage}
        resizeMode='cover'
        fadeDuration={0}
      />

      {/* Laser Scanning Visual Line */}
      <View style={styles.laserLine} />

      {/* Analysis Badges */}
      <View style={[styles.analysisBadge, { top: 20, left: 16 }]}>
        <Text style={styles.badgeText}>
          {UI_STRINGS.INTRO.SLIDE_1_BADGE_1}{' '}
          <Text style={styles.accentText}>92%</Text>
        </Text>
      </View>

      <View style={[styles.analysisBadge, { top: 76, right: 16 }]}>
        <Text style={styles.badgeText}>
          {UI_STRINGS.INTRO.SLIDE_1_BADGE_2}{' '}
          <Text style={styles.accentText}>85%</Text>
        </Text>
      </View>

      <View style={[styles.analysisBadge, { top: 136, left: 20 }]}>
        <Text style={styles.badgeText}>
          {UI_STRINGS.INTRO.SLIDE_1_BADGE_3}{' '}
          <Text style={{ color: palette.primary, fontWeight: '700' }}>76%</Text>
        </Text>
      </View>

      {/* Progress Card Overlay */}
      <View style={styles.progressCardOverlay}>
        <View style={styles.progressHeaderRow}>
          <View style={styles.rowFlex}>
            <View style={styles.dotIndicator} />
            <Text style={styles.progressTitle}>
              {UI_STRINGS.INTRO.SLIDE_1_PROGRESS_TITLE}
            </Text>
          </View>
          <Text style={styles.progressPercent}>
            {UI_STRINGS.INTRO.SLIDE_1_PROGRESS_PERCENT}
          </Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: '65%' }]} />
        </View>
        <Text style={styles.progressSubText}>
          {UI_STRINGS.INTRO.SLIDE_1_PROGRESS_SUBTEXT}
        </Text>
      </View>
    </View>
  );

  // Main Body Slide 2: 스마트 여행 경로 탐색 (앱 소개3)
  const renderSlide2 = () => (
    <View style={[styles.illustrationFrame, styles.mapFrameBg]}>
      {/* Background Illustration Image */}
      <Image
        source={APP_IMAGES.INTRO_MAP_ROUTE}
        style={styles.bgIllustrationImage}
        resizeMode='cover'
        fadeDuration={0}
      />

      {/* Route Navigation Badge Overlay */}
      <View style={styles.mapOverlayBadge}>
        <Ionicons name='location' size={16} color={palette.accent} />
        <Text style={styles.mapOverlayText}>
          {UI_STRINGS.INTRO.SLIDE_2_BADGE_TEXT}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <View style={styles.contentContainer}>
        {/* Header Title Section */}
        <View style={styles.headerSection} testID='top-content'>
          <Text style={styles.mainTitle}>{UI_STRINGS.INTRO.MAIN_TITLE}</Text>
          <Text style={styles.subTitle}>{UI_STRINGS.INTRO.SUB_TITLE}</Text>
        </View>

        {/* Main Body with Swipe Gesture */}
        <View
          style={[styles.mainBodyContainer, { outlineStyle: 'none' } as any]}
          testID='main-body-touchable'
          {...panResponder.panHandlers}>
          <Animated.View
            style={[
              styles.animatedBody,
              { transform: [{ translateX: slideAnim }] },
            ]}
            renderToHardwareTextureAndroid={true}
            shouldRasterizeIOS={true}>
            {activeIndex === 0 && renderSlide0()}
            {activeIndex === 1 && renderSlide1()}
            {activeIndex === 2 && renderSlide2()}
          </Animated.View>
        </View>

        {/* Bottom Navigation & Indicators */}
        <View style={styles.bottomContainer} testID='bottom-container'>
          {/* Pagination Dots */}
          <View style={styles.paginationDots}>
            {[0, 1, 2].map((idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.6}
                onPress={() =>
                  goToSlide(
                    idx,
                    idx >= activeIndexRef.current ? 'next' : 'prev',
                  )
                }
                style={[
                  styles.dot,
                  activeIndex === idx ? styles.activeDot : styles.inactiveDot,
                  { outlineStyle: 'none' } as any,
                ]}
              />
            ))}
          </View>

          {/* Next Action Button */}
          <TouchableOpacity
            style={[styles.primaryButton, { outlineStyle: 'none' } as any]}
            activeOpacity={0.8}
            onPress={handlePressNextButton}
            testID='next-button'>
            <Text style={styles.buttonText}>
              {UI_STRINGS.INTRO.NEXT_BUTTON}
            </Text>
            <Feather
              name='chevron-right'
              size={18}
              color={palette.white}
              style={styles.arrowIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
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
    gap: 8,
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
  mainBodyContainer: {
    height: 340,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.softMint,
    overflow: 'hidden',
  },
  animatedBody: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    backgroundColor: palette.softMint,
    overflow: 'hidden',
  },
  cardListContainer: {
    gap: 12,
    width: '100%',
  },
  featureCard: {
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.lightTeal,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: palette.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  cardDesc: {
    fontSize: 12,
    color: palette.subText,
  },
  illustrationFrame: {
    height: 320,
    width: '100%',
    backgroundColor: palette.white,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: palette.lightTeal,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgIllustrationImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: 24,
    opacity: 0.85,
  },
  mapFrameBg: {
    backgroundColor: palette.gray100,
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 120,
    height: 3,
    backgroundColor: palette.accent,
    opacity: 0.8,
  },
  analysisBadge: {
    position: 'absolute',
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.accent,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  accentText: {
    color: palette.accent,
    fontWeight: '700',
  },
  progressCardOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: palette.white,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.accent,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.accent,
  },
  progressBarTrack: {
    height: 8,
    width: '100%',
    backgroundColor: palette.lightTeal,
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: palette.accent,
    borderRadius: 100,
  },
  progressSubText: {
    fontSize: 11,
    color: palette.mutedText,
  },
  mapOverlayBadge: {
    position: 'absolute',
    bottom: 24,
    backgroundColor: palette.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  mapOverlayText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  bottomContainer: {
    gap: 20,
    width: '100%',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: palette.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: palette.lightTeal,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.white,
  },
  arrowIcon: {
    marginLeft: 8,
  },
});
