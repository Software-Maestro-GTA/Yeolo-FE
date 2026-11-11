/**
 * @file useSheetEntrance.ts
 * @description 모달의 배경 페이드와 분리해 하단 시트 내용만 올리며 동작 줄이기 설정을 존중합니다.
 */
import { useLayoutEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';

/** Apply the returned transform only to sheet content inside a fading Modal. */
export function useSheetEntrance(visible: boolean) {
  const { height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;

  useLayoutEffect(() => {
    if (!visible) return;
    progress.stopAnimation();
    progress.setValue(0);

    let disposed = false;
    let preferenceChanged = false;
    const show = (reduceMotion: boolean) => {
      if (disposed) return;
      progress.stopAnimation();
      if (reduceMotion) {
        progress.setValue(1);
      } else {
        Animated.timing(progress, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
    };
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        preferenceChanged = true;
        show(enabled);
      },
    );
    AccessibilityInfo.isReduceMotionEnabled().then(
      (enabled) => {
        if (!preferenceChanged) show(enabled);
      },
      () => {
        if (!preferenceChanged) show(true);
      },
    );
    return () => {
      disposed = true;
      subscription.remove();
      progress.stopAnimation();
    };
  }, [visible, progress]);

  return {
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [height, 0],
        }),
      },
    ],
  };
}
