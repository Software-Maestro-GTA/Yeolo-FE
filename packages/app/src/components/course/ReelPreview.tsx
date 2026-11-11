/**
 * @file ReelPreview.tsx
 * @description Frame-timed portrait storyboard using the native export layout, readable captions and resumable playback.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  reelPlaybackFrame,
  type ReelPlan,
  type ReelScene,
  type ReelPoint,
} from '../../services/courseReelService';
import { APP_CONFIG } from '../../constants/config';
import { palette, hexToRgba } from '../../theme/colors';
import { UI_STRINGS } from '../../constants/strings';
import { BOOKING_REEL_UI } from '../../constants/bookingReelUiStrings';

/** Scales one 720px export canvas rather than maintaining a second typography/layout system. */
export function ReelPreview({
  plan,
  compact = false,
  expanded = false,
  onClose,
}: {
  plan: ReelPlan | null;
  compact?: boolean;
  expanded?: boolean;
  onClose?: () => void;
}) {
  const [seconds, setSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [width, setWidth] = useState(216);
  const elapsed = useRef(0);
  const frame = plan ? reelPlaybackFrame(plan, seconds) : null;
  const scene = frame && plan ? plan.scenes[frame.index] : undefined;
  const fraction = frame?.fraction ?? 0;
  const duration = useMemo(
    () => plan?.scenes.reduce((sum, item) => sum + item.seconds, 0) ?? 0,
    [plan],
  );
  useEffect(() => {
    elapsed.current = 0;
    setSeconds(0);
    setPlaying(false);
  }, [plan]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') setPlaying(false);
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!playing || !plan) return;
    const anchor = Date.now() - elapsed.current * 1000;
    let finished = false;
    const timer = setInterval(() => {
      const next = (Date.now() - anchor) / 1000;
      if (next >= duration) {
        finished = true;
        elapsed.current = 0;
        setSeconds(0);
        setPlaying(false);
      } else {
        elapsed.current = next;
        setSeconds(next);
      }
    }, 1000 / plan.fps);
    return () => {
      clearInterval(timer);
      if (!finished)
        elapsed.current = Math.min(duration, (Date.now() - anchor) / 1000);
    };
  }, [playing, plan, duration]);
  return (
    <View style={styles.container}>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={[
          styles.frame,
          compact && styles.compactFrame,
          expanded && styles.expandedFrame,
          !scene && styles.emptyFrame,
        ]}
        testID='reel-preview'>
        {scene && plan && (
          <ReelSceneCanvas
            plan={plan}
            scene={scene}
            width={width}
            markerTime={scene.kind === 'route' ? fraction * scene.seconds : 0}
          />
        )}
        {!scene && (
          <View style={styles.emptyCaption}>
            <Text style={styles.emptyText}>{UI_STRINGS.REEL.PREVIEW}</Text>
            <Text style={styles.emptyText}>{UI_STRINGS.REEL.EMPTY_PHOTOS}</Text>
          </View>
        )}
        {!!plan && !compact && (
          <TouchableOpacity
            style={[styles.play, !!onClose && styles.playWithClose]}
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
        {!!onClose && (
          <TouchableOpacity
            testID='reel-preview-close'
            accessibilityRole='button'
            accessibilityLabel={BOOKING_REEL_UI.REEL.CLOSE}
            style={styles.close}
            onPress={onClose}>
            <Ionicons name='close' size={24} color={palette.white} />
          </TouchableOpacity>
        )}
      </View>
      {!compact && (
        <Text style={styles.meta}>
          {UI_STRINGS.REEL.FORMAT}
          {plan ? ` · ${duration}s` : ''}
        </Text>
      )}
    </View>
  );
}
/** Keeps static photo scenes out of the playback clock's render loop. */
const ReelSceneCanvas = React.memo(function ReelSceneCanvas({
  plan,
  scene,
  width,
  markerTime,
}: {
  plan: ReelPlan;
  scene: ReelScene;
  width: number;
  markerTime: number;
}) {
  const canvasStyles = useMemo(() => makeCanvasStyles(width), [width]);
  const sceneStyles = useMemo(
    () => makeSceneStyles(plan, scene),
    [plan, scene],
  );
  const layout = plan.layout;
  return (
    <View style={canvasStyles.canvas} pointerEvents='none'>
      {scene.kind === 'photo' && (
        <Image
          testID='reel-photo-background'
          source={{ uri: scene.uri }}
          style={StyleSheet.absoluteFill}
          resizeMode='cover'
        />
      )}
      {scene.kind === 'route' && (
        <>
          <View style={sceneStyles.mapCard}>
            <Image
              source={{ uri: scene.uri }}
              style={StyleSheet.absoluteFill}
              resizeMode='stretch'
              testID='reel-map-background'
            />
          </View>
          {scene.points.map((point, index) => {
            const opacity = Math.min(
              1,
              Math.max(
                0,
                (markerTime - index * layout.markerIntervalSeconds) /
                  layout.markerFadeSeconds,
              ),
            );
            if (opacity <= 0) return null;
            return (
              <ReelMapMarker
                key={point.label}
                point={point}
                opacity={opacity}
                layout={layout}
              />
            );
          })}
        </>
      )}
      {scene.kind === 'photo' && (
        <LinearGradient
          testID='reel-bottom-gradient'
          colors={[
            palette.transparent,
            hexToRgba(palette.black, layout.gradientMidOpacity),
            hexToRgba(palette.black, layout.gradientBottomOpacity),
          ]}
          locations={[0, layout.gradientMidStop, 1]}
          style={sceneStyles.gradient}
        />
      )}
      {scene.role === 'stop' ? (
        <View style={sceneStyles.placeHeading}>
          <View style={sceneStyles.placeTitleRow}>
            {!!scene.number && !!scene.title.trim() && (
              <View style={sceneStyles.numberCircle}>
                <Text testID='reel-place-number' style={sceneStyles.number}>
                  {scene.number}
                </Text>
              </View>
            )}
            <Text
              testID='reel-scene-title'
              style={sceneStyles.placeTitle}
              numberOfLines={2}>
              {scene.title}
            </Text>
          </View>
        </View>
      ) : (
        <Text
          testID='reel-scene-title'
          style={sceneStyles.title}
          numberOfLines={2}>
          {scene.title}
        </Text>
      )}
      {!!scene.caption && (
        <Text style={sceneStyles.caption} numberOfLines={2}>
          {scene.caption}
        </Text>
      )}
      <Image
        testID='reel-brand-mark'
        source={plan.brandMark}
        resizeMode='contain'
        style={sceneStyles.brandMark}
        accessible={false}
      />
    </View>
  );
});

/** Reuses marker geometry and skips renders once its fade has finished. */
const ReelMapMarker = React.memo(function ReelMapMarker({
  point,
  opacity,
  layout,
}: {
  point: ReelPoint;
  opacity: number;
  layout: ReelPlan['layout'];
}) {
  const marker = useMemo(
    () => makeMarkerStyles(point, layout),
    [point, layout],
  );
  const fadeStyle = useMemo(() => ({ opacity }), [opacity]);
  return (
    <View style={[marker.group, fadeStyle]}>
      <View style={marker.circle}>
        <Text style={marker.number}>{point.label}</Text>
      </View>
      {!!point.name && (
        <View style={marker.nameBox}>
          <Text style={marker.name} numberOfLines={1}>
            {point.name}
          </Text>
        </View>
      )}
    </View>
  );
});

function makeCanvasStyles(width: number) {
  return StyleSheet.create({
    canvas: {
      position: 'absolute',
      width: 720,
      height: 1280,
      transformOrigin: 'top left',
      transform: [{ scale: width / 720 }],
    },
  });
}
function makeSceneStyles(plan: ReelPlan | null, scene?: ReelScene) {
  const l = plan?.layout ?? APP_CONFIG.REEL.LAYOUT;
  const hero = scene?.role === 'hook';
  const route = scene?.kind === 'route';
  const common = {
    position: 'absolute' as const,
    color: plan?.textColor ?? palette.white,
    textAlign: 'left' as const,
    includeFontPadding: false,
  };
  return StyleSheet.create({
    brandMark: {
      position: 'absolute',
      left: l.logoX,
      top: l.logoY,
      width: l.logoWidth,
      height: l.logoHeight,
    },
    gradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: l.gradientTop,
      bottom: 0,
    },
    mapCard: {
      position: 'absolute',
      left: l.mapX,
      top: l.mapY,
      width: l.mapSize,
      height: l.mapSize,
      borderRadius: l.mapRadius,
      overflow: 'hidden',
    },
    title: {
      ...common,
      left: hero ? l.textX : l.titleX,
      width: hero ? l.textWidth : l.titleWidth,
      top: hero ? l.heroTitleY : l.titleY,
      height: hero ? l.heroTitleHeight : l.titleHeight,
      fontSize: hero ? l.heroTitleSize : l.titleSize,
      fontWeight: '800',
    },
    placeHeading: {
      position: 'absolute',
      left: l.numberX - l.numberRadius,
      top: l.titleY,
      width: l.textWidth,
      height: l.titleHeight,
      justifyContent: 'flex-end',
    },
    placeTitleRow: { flexDirection: 'row', alignItems: 'flex-start' },
    placeTitle: {
      color: plan?.textColor ?? palette.white,
      fontSize: l.titleSize,
      fontWeight: '800',
      includeFontPadding: false,
      width: l.titleWidth,
      minHeight: Math.ceil(l.titleSize * 1.2),
      lineHeight: Math.ceil(l.titleSize * 1.2),
    },
    caption: {
      ...common,
      left: hero || route ? l.textX : l.captionX,
      width: hero || route ? l.textWidth : l.captionWidth,
      top: route ? l.dateY : hero ? l.heroCaptionY : l.captionY,
      height: route
        ? l.dateHeight
        : hero
          ? l.heroCaptionHeight
          : l.captionHeight,
      fontSize: route ? l.dateSize : hero ? l.heroCaptionSize : l.captionSize,
      textAlign: route ? 'center' : 'left',
      fontWeight: hero ? '800' : '500',
    },
    numberCircle: {
      marginTop: l.numberY - l.titleY - l.numberRadius,
      marginRight: l.titleX - l.numberX - l.numberRadius,
      width: l.numberRadius * 2,
      height: l.numberRadius * 2,
      borderRadius: l.numberRadius,
      backgroundColor: plan?.accentColor ?? palette.primary,
      borderWidth: 2,
      borderColor: palette.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    number: {
      color: palette.white,
      fontSize: l.numberSize,
      fontWeight: '800',
      lineHeight: l.numberRadius * 2 - 2,
    },
  });
}
function makeMarkerStyles(point: ReelPoint, l: ReelPlan['layout']) {
  return StyleSheet.create({
    group: StyleSheet.absoluteFill,
    circle: {
      position: 'absolute',
      left: point.x * 720 - l.mapMarkerRadius,
      top: point.y * 1280 - l.mapMarkerRadius,
      width: l.mapMarkerRadius * 2,
      height: l.mapMarkerRadius * 2,
      borderRadius: l.mapMarkerRadius,
      backgroundColor: palette.primary,
      borderWidth: 3,
      borderColor: palette.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    number: {
      color: palette.white,
      fontSize: l.mapMarkerSize,
      fontWeight: '800',
      lineHeight: l.mapMarkerRadius * 2 - 2,
    },
    nameBox: {
      position: 'absolute',
      left: point.nameX ?? 0,
      top: point.nameY ?? 0,
      width: point.nameWidth ?? 0,
      height: l.mapNameHeight,
      borderRadius: 4,
      backgroundColor: palette.white,
      justifyContent: 'center',
      paddingHorizontal: 10,
    },
    name: {
      color: palette.deepNavy,
      fontSize: l.mapNameSize,
      fontWeight: '700',
      includeFontPadding: false,
    },
  });
}
const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  frame: {
    width: 216,
    aspectRatio: 9 / 16,
    backgroundColor: palette.deepNavy,
    borderRadius: 20,
    overflow: 'hidden',
  },
  compactFrame: { width: 210 },
  expandedFrame: { width: 314 },
  emptyFrame: { backgroundColor: palette.mediaPlaceholder },
  emptyCaption: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    gap: 10,
  },
  emptyText: { color: palette.subText, fontSize: 14, textAlign: 'center' },
  play: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: hexToRgba(palette.black, 0.4),
    padding: 10,
    borderRadius: 24,
  },
  playWithClose: { left: 12, right: undefined },
  close: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hexToRgba(palette.black, 0.4),
  },
  meta: { fontSize: 12, color: palette.subText },
});
