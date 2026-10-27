/**
 * @file CourseGenerationStatusCard.tsx
 * @description Figma 메인화면_코스 로딩의 하단 카드에 생성 화면과 같은 진행률을 채워 표시하고 진행·완료·오류 화면을 엽니다.
 */
import { useMemo } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingTrackSvg from '../../../assets/figma-v3/course-status/loading-track.svg';
import Svg, { Circle } from 'react-native-svg';
import BackSvg from '../../../assets/figma-v3/course-status/back.svg';
import { Text } from '../common/Typography';
import { CachedImage } from '../common/CachedImage';
import { UI_STRINGS } from '../../constants';
import { palette } from '../../theme/colors';

const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 14;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CourseGenerationStatusCardProps {
  progress: Animated.Value;
  status: 'generating' | 'complete' | 'error';
  title: string;
  message: string;
  onPress: () => void;
  onDismiss: () => void;
}

/** Keeps status and its destination action together without covering screen controls. */
export function CourseGenerationStatusCard({
  progress,
  status,
  title,
  message,
  onPress,
  onDismiss,
}: CourseGenerationStatusCardProps) {
  const strings = UI_STRINGS.COURSE_GENERATING;
  const generating = status === 'generating';
  const arcOffset = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 100],
        outputRange: [GAUGE_CIRCUMFERENCE, 0],
        extrapolate: 'clamp',
      }),
    [progress],
  );
  const action = generating
    ? strings.MINI_PROGRESS
    : status === 'complete'
      ? strings.MINI_RESULT
      : strings.MINI_ERROR_ACTION;
  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <CachedImage
        source={require('../../../assets/images/figma-course/date-footer-shadow.png')}
        style={styles.footerShadow}
        contentFit='fill'
        pointerEvents='none'
        accessible={false}
      />
      <View style={styles.card} testID='course-generation-status'>
        <Pressable
          testID='course-generation-status-action'
          style={styles.action}
          accessibilityRole='button'
          accessibilityLabel={`${title}. ${message}. ${action}`}
          accessibilityState={{ busy: generating }}
          onPress={onPress}>
          {generating ? (
            <View
              style={styles.gauge}
              pointerEvents='none'
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility='no-hide-descendants'>
              <LoadingTrackSvg />
              <Svg
                width={35}
                height={35}
                viewBox='0 0 35 35'
                style={StyleSheet.absoluteFill}>
                <AnimatedCircle
                  testID='course-generation-status-progress-arc'
                  cx={17.5}
                  cy={17.5}
                  r={14}
                  fill='none'
                  stroke={palette.primary}
                  strokeWidth={7}
                  strokeLinecap='butt'
                  strokeDasharray={GAUGE_CIRCUMFERENCE}
                  strokeDashoffset={arcOffset}
                  transform='rotate(-90 17.5 17.5)'
                />
              </Svg>
            </View>
          ) : (
            <Ionicons
              name={
                status === 'complete'
                  ? 'checkmark-circle'
                  : 'alert-circle-outline'
              }
              size={35}
              color={status === 'error' ? palette.red500 : palette.primary}
            />
          )}
          <View style={styles.content}>
            <Text
              style={styles.title}
              numberOfLines={1}
              accessibilityLiveRegion='polite'>
              {title}
            </Text>
            <Text style={styles.message} numberOfLines={1}>
              {message}
            </Text>
          </View>
          <View style={styles.trailing} pointerEvents='none' accessible={false}>
            {!generating && <Text style={styles.actionText}>{action}</Text>}
            <View style={styles.forward}>
              <BackSvg />
            </View>
          </View>
        </Pressable>
        {!generating && (
          <Pressable
            testID='course-generation-status-dismiss'
            style={styles.dismiss}
            accessibilityRole='button'
            accessibilityLabel={strings.MINI_DISMISS}
            onPress={onDismiss}>
            <Ionicons name='close' size={20} color={palette.subText} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.white,
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  footerShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -14,
    height: 14,
    transform: [{ scaleY: -1 }],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.gray100,
    borderRadius: 16,
  },
  action: {
    flex: 1,
    minHeight: 76,
    paddingLeft: 16.5,
    paddingRight: 12,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16.5,
  },
  gauge: { width: 35, height: 35, flexShrink: 0 },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  forward: { width: 24, height: 24, transform: [{ rotate: '180deg' }] },
  content: { flex: 1, minWidth: 0, gap: 4 },
  title: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '500',
    letterSpacing: -1,
    color: palette.deepNavy,
  },
  message: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '500',
    letterSpacing: -1,
    color: palette.mutedText,
  },
  actionText: { fontSize: 13, fontWeight: '600', color: palette.accent },
  dismiss: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
