/**
 * @file useCourseGenerationProgress.ts
 * @description 화면 이동과 무관하게 공유할 수 있는 코스 생성 추정 진행 애니메이션을 관리합니다.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

interface CourseGenerationProgressOptions {
  active: boolean;
  completed: boolean;
  error?: string | null;
  sharedProgress?: Animated.Value;
}

/** Owns the estimate unless a longer-lived navigation owner supplies its value. */
export function useCourseGenerationProgress({
  active,
  completed,
  error,
  sharedProgress,
}: CourseGenerationProgressOptions): Animated.Value {
  const localProgress = useRef<Animated.Value | null>(null);
  if (!localProgress.current)
    localProgress.current = new Animated.Value(completed ? 100 : 5);
  const progress = sharedProgress ?? localProgress.current;

  useEffect(() => {
    if (sharedProgress || error || (!active && !completed)) return;
    if (!completed) progress.setValue(5);
    // SSE stages/messages never restart the estimate. Only a saved ID fills
    // the last 1%; the navigation owner keeps this running between screens.
    const animation = completed
      ? Animated.timing(progress, {
          toValue: 100,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        })
      : Animated.sequence([
          Animated.timing(progress, {
            toValue: 92,
            duration: 90000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(progress, {
            toValue: 99,
            duration: 600000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
        ]);
    animation.start();
    return () => {
      animation.stop();
      progress.stopAnimation();
    };
  }, [active, completed, error, progress, sharedProgress]);

  return progress;
}
