/**
 * @file ReelProgressBar.tsx
 * @description Smooth native-driven interpolation of actual encoder progress without a simulated timer.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { APP_CONFIG } from '../../constants/config';
import { UI_STRINGS } from '../../constants/strings';
import { palette } from '../../theme/colors';

/** Animates received progress from the left edge; stops its animation on unmount. */
export function ReelProgressBar({ progress }: { progress: number }) {
  const fraction = Math.max(0, Math.min(1, progress));
  const value = useRef(new Animated.Value(0)).current;
  const fillStyle = useMemo(
    () => ({ transform: [{ scaleX: value }] }),
    [value],
  );
  useEffect(() => {
    const animation = Animated.timing(value, {
      toValue: fraction,
      duration: APP_CONFIG.REEL.PROGRESS_ANIMATION_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [fraction, value]);
  return (
    <View
      style={styles.track}
      accessible
      accessibilityRole='progressbar'
      accessibilityLabel={UI_STRINGS.REEL.PROGRESS_LABEL}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(fraction * 100),
      }}>
      <Animated.View
        testID='reel-progress-fill'
        style={[styles.fill, fillStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 249,
    height: 9,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: palette.gray200,
  },
  fill: {
    width: '100%',
    height: '100%',
    backgroundColor: palette.primary,
    transformOrigin: 'left center',
  },
});
