/**
 * @file ReelPreview.tsx
 * @description Portrait storyboard preview with slow photo zoom and a captured Google Maps course route.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Polyline, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { ReelPlan } from '../../services/courseReelService';
import { palette, hexToRgba } from '../../theme/colors';
import { UI_STRINGS } from '../../constants/strings';

/** Renders an approximate storyboard preview; the exported MP4 is available separately. */
export function ReelPreview({ plan }: { plan: ReelPlan | null }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const zoom = useRef(new Animated.Value(1)).current;
  const scene = plan?.scenes[index] || plan?.scenes[0];
  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [plan]);
  useEffect(() => {
    zoom.setValue(1);
    if (!playing || !scene || !plan) return;
    const animation = Animated.timing(zoom, {
      toValue: 1.06,
      duration: scene.seconds * 1000,
      useNativeDriver: true,
    });
    animation.start();
    const timer = setTimeout(() => {
      if (index + 1 < plan.scenes.length) setIndex(index + 1);
      else {
        setPlaying(false);
        setIndex(0);
      }
    }, scene.seconds * 1000);
    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [index, playing, scene, plan, zoom]);
  return (
    <View style={styles.container}>
      <View style={styles.frame} testID='reel-preview'>
        {scene?.kind === 'photo' && (
          <Animated.View
            style={[StyleSheet.absoluteFill, { transform: [{ scale: zoom }] }]}>
            <Image
              source={{ uri: scene.uri }}
              style={StyleSheet.absoluteFill}
              resizeMode='cover'
            />
          </Animated.View>
        )}
        {scene?.kind === 'route' && (
          <Image
            source={{ uri: scene.uri }}
            style={styles.mapBackground}
            resizeMode='stretch'
            testID='reel-map-background'
          />
        )}
        {scene?.kind === 'route' && !!scene.uri && (
          <Svg viewBox='0 0 720 1280' style={StyleSheet.absoluteFill}>
            <Polyline
              points={scene.points
                .map((p) => `${p.x * 720},${p.y * 1280}`)
                .join(' ')}
              stroke={palette.warning}
              strokeWidth={6}
              fill='none'
            />
            {scene.points.map((p, i) => (
              <React.Fragment key={i}>
                <Circle
                  cx={p.x * 720}
                  cy={p.y * 1280}
                  r={22}
                  fill={palette.warning}
                />
                <SvgText
                  x={p.x * 720}
                  y={p.y * 1280 + 9}
                  fill={palette.deepNavy}
                  fontSize={26}
                  textAnchor='middle'>
                  {p.label}
                </SvgText>
              </React.Fragment>
            ))}
          </Svg>
        )}
        {scene?.kind !== 'route' && (
          <LinearGradient
            colors={[palette.transparent, hexToRgba(palette.black, 0.75)]}
            style={styles.gradient}
          />
        )}
        <View
          style={[
            styles.caption,
            scene?.kind === 'route' && styles.mapCaption,
          ]}>
          <Text style={styles.sceneTitle} numberOfLines={2}>
            {scene?.title || UI_STRINGS.REEL.PREVIEW}
          </Text>
          <Text style={styles.sceneCaption} numberOfLines={4}>
            {scene?.caption || UI_STRINGS.REEL.EMPTY_PHOTOS}
          </Text>
        </View>
        {!!plan && (
          <TouchableOpacity
            style={styles.play}
            accessibilityRole='button'
            accessibilityLabel={
              playing ? UI_STRINGS.REEL.PAUSE : UI_STRINGS.REEL.PLAY
            }
            onPress={() => setPlaying(!playing)}>
            <Ionicons
              name={playing ? 'pause' : 'play'}
              size={20}
              color={palette.white}
            />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.meta}>
        {UI_STRINGS.REEL.FORMAT}
        {plan ? ` · ${plan.scenes.reduce((n, s) => n + s.seconds, 0)}s` : ''}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  mapCaption: { top: '70%', bottom: undefined },
  mapBackground: {
    position: 'absolute',
    top: '10%',
    width: '100%',
    aspectRatio: 1,
  },
  container: { alignItems: 'center', marginVertical: 16, gap: 8 },
  frame: {
    width: 216,
    aspectRatio: 9 / 16,
    backgroundColor: palette.deepNavy,
    borderRadius: 18,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  caption: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 56,
    alignItems: 'center',
    gap: 10,
  },
  sceneTitle: {
    color: palette.warning,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sceneCaption: {
    color: palette.white,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  play: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: hexToRgba(palette.black, 0.4),
    padding: 10,
    borderRadius: 24,
  },
  meta: { fontSize: 12, color: palette.subText },
});
