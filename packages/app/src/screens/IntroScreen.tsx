/**
 * @file IntroScreen.tsx
 * @description Application introduction screen matching Figma UI design specifications with 3-second auto-cycling carousel, background illustration images, and user touch interaction.
 */
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';

// Intro Illustration Asset Images
const introPhotoImg = require('../../assets/images/intro_photo_analysis.jpg');
const introMapImg = require('../../assets/images/intro_map_route.jpg');

interface IntroScreenProps {
  onNext: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onNext }) => {
  useGA4ScreenTracking('IntroScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 3초마다 main-body 자동 전환 (0 -> 1 -> 2 -> 0 무한 순환만 수행)
  useEffect(() => {
    const timer = setInterval(() => {
      cycleNextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [activeIndex]);

  const cycleNextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % 3);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  // 사람이 "다음으로" 버튼을 눌렀을 때만 동작
  const handlePressNextButton = () => {
    trackButtonClick('btn_intro_next', `Intro Next Button Slide ${activeIndex + 1}`);
    onNext();
  };

  // 사람이 메인 바디 영역을 눌렀을 때의 터치 전환 (0 -> 1 -> 2 -> 0 순환)
  const handleMainBodyPress = () => {
    trackButtonClick('btn_intro_main_body_touch', `Intro Main Body Touch Slide ${activeIndex + 1}`);
    cycleNextSlide();
  };

  // Main Body Slide 0: 3가지 핵심 기능 카드 리스트 (앱 소개1)
  const renderSlide0 = () => (
    <View style={styles.cardListContainer}>
      <View style={styles.featureCard}>
        <View style={styles.iconBg}>
          <Ionicons name="heart" size={20} color={palette.primary} />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>AI 취향 분석</Text>
          <Text style={styles.cardDesc}>몇 장의 사진으로 발견하는 나만의 여행 취향</Text>
        </View>
      </View>

      <View style={styles.featureCard}>
        <View style={styles.iconBg}>
          <Ionicons name="map" size={20} color={palette.accent} />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>맞춤 코스 생성</Text>
          <Text style={styles.cardDesc}>동선과 운영 시간을 계산한 최적의 일정 설계</Text>
        </View>
      </View>

      <View style={styles.featureCard}>
        <View style={styles.iconBg}>
          <Ionicons name="share-social" size={20} color={palette.primary} />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>코스 공유</Text>
          <Text style={styles.cardDesc}>나만의 여행 코스를 친구와 공유하고 즐기기</Text>
        </View>
      </View>
    </View>
  );

  // Main Body Slide 1: AI 사진 파싱 및 취향 스캐닝 (앱 소개2)
  const renderSlide1 = () => (
    <View style={styles.illustrationFrame}>
      {/* Background Illustration Image */}
      <Image
        source={introPhotoImg}
        style={styles.bgIllustrationImage}
        resizeMode="cover"
      />

      {/* Laser Scanning Visual Line */}
      <View style={styles.laserLine} />

      {/* Analysis Badges */}
      <View style={[styles.analysisBadge, { top: 20, left: 16 }]}>
        <Text style={styles.badgeText}>🌿 자연/힐링 <Text style={styles.accentText}>92%</Text></Text>
      </View>

      <View style={[styles.analysisBadge, { top: 76, right: 16 }]}>
        <Text style={styles.badgeText}>🌊 오션뷰 <Text style={styles.accentText}>85%</Text></Text>
      </View>

      <View style={[styles.analysisBadge, { top: 136, left: 20 }]}>
        <Text style={styles.badgeText}>📸 감성사진 <Text style={{ color: palette.primary, fontWeight: '700' }}>76%</Text></Text>
      </View>

      {/* Progress Card Overlay */}
      <View style={styles.progressCardOverlay}>
        <View style={styles.progressHeaderRow}>
          <View style={styles.rowFlex}>
            <View style={styles.dotIndicator} />
            <Text style={styles.progressTitle}>취향 분석 중...</Text>
          </View>
          <Text style={styles.progressPercent}>65%</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: '65%' }]} />
        </View>
        <Text style={styles.progressSubText}>342장의 사진 데이터 파싱 완료</Text>
      </View>
    </View>
  );

  // Main Body Slide 2: 스마트 여행 경로 탐색 (앱 소개3)
  const renderSlide2 = () => (
    <View style={[styles.illustrationFrame, styles.mapFrameBg]}>
      {/* Background Illustration Image */}
      <Image
        source={introMapImg}
        style={styles.bgIllustrationImage}
        resizeMode="cover"
      />

      {/* Route Navigation Badge Overlay */}
      <View style={styles.mapOverlayBadge}>
        <Ionicons name="location" size={16} color={palette.accent} />
        <Text style={styles.mapOverlayText}>나만을 위한 최적의 여행 경로 탐색 중</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.contentContainer}>
          {/* Header Title Section */}
          <View style={styles.headerSection} testID="top-content">
            <Text style={styles.mainTitle}>{UI_STRINGS.INTRO.MAIN_TITLE}</Text>
            <Text style={styles.subTitle}>{UI_STRINGS.INTRO.SUB_TITLE}</Text>
          </View>

          {/* Main Body */}
          <TouchableOpacity
            style={styles.mainBodyContainer}
            activeOpacity={0.95}
            onPress={handleMainBodyPress}
            testID="main-body-touchable"
          >
            <Animated.View style={[styles.animatedBody, { opacity: fadeAnim }]}>
              {activeIndex === 0 && renderSlide0()}
              {activeIndex === 1 && renderSlide1()}
              {activeIndex === 2 && renderSlide2()}
            </Animated.View>
          </TouchableOpacity>

          {/* Bottom Navigation & Indicators */}
          <View style={styles.bottomContainer} testID="bottom-container">
            {/* Pagination Dots */}
            <View style={styles.paginationDots}>
              {[0, 1, 2].map((idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.6}
                  onPress={() => setActiveIndex(idx)}
                  style={[
                    styles.dot,
                    activeIndex === idx ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>

            {/* Next Action Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={handlePressNextButton}
              testID="next-button"
            >
              <Text style={styles.buttonText}>{UI_STRINGS.INTRO.NEXT_BUTTON}</Text>
              <Feather
                name="chevron-right"
                size={18}
                color="#FFFFFF"
                style={styles.arrowIcon}
              />
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
  },
  animatedBody: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
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
    elevation: 2,
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
    backgroundColor: '#F8FAFC',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
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
    backgroundColor: '#F0F5F2',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
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
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  arrowIcon: {
    marginLeft: 8,
  },
});
