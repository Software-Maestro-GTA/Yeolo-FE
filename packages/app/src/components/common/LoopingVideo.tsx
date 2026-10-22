/**
 * @file LoopingVideo.tsx
 * @description Bundled decorative Figma video with a poster, reduced-motion support and foreground-only playback.
 */
import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { CachedImage } from './CachedImage';
import { palette } from '../../theme/colors';

interface LoopingVideoProps {
  source: number;
  poster: ImageSourcePropType;
  style: StyleProp<ViewStyle>;
  testID: string;
}

/** Shows local artwork immediately and plays its muted loop when motion is allowed. */
export function LoopingVideo({
  source,
  poster,
  style,
  testID,
}: LoopingVideoProps) {
  const [reduceMotion, setReduceMotion] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const player = useVideoPlayer(source, (video) => {
    video.loop = true;
    video.muted = true;
    video.audioMixingMode = 'mixWithOthers';
    video.staysActiveInBackground = false;
  });

  useEffect(() => {
    let mounted = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value) => {
        changed = true;
        setReduceMotion(value);
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => {
        if (mounted && !changed) setReduceMotion(value);
      },
      () => {}, // Keep the still poster if the system preference is unavailable.
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = player.addListener('statusChange', ({ status }) => {
      if (status === 'error') setFailed(true);
    });
    return () => subscription.remove();
  }, [player]);

  useEffect(() => {
    const syncPlayback = (state = AppState.currentState) => {
      if (state === 'active' && !reduceMotion && !failed) player.play();
      else player.pause();
    };
    syncPlayback();
    const subscription = AppState.addEventListener('change', syncPlayback);
    return () => subscription.remove();
  }, [player, reduceMotion, failed]);

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      pointerEvents='none'
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit='contain'
        nativeControls={false}
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}
        onFirstFrameRender={() => setReady(true)}
        testID={`${testID}-player`}
      />
      {(!ready || reduceMotion || failed) && (
        <CachedImage
          source={poster}
          style={StyleSheet.absoluteFill}
          contentFit='contain'
          testID={`${testID}-poster`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', backgroundColor: palette.white },
});
