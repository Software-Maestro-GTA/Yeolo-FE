/**
 * @file ReelRouteMap.tsx
 * @description Captures a loaded Google Maps SDK background and its geographic projection for local reel export.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  findNodeHandle,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../common/Typography';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import type { ItineraryDay } from '@yeolo/common';
import {
  captureReelMap,
  deleteReel,
  reelMapCoordinates,
  reelMapRegion,
  reelMapSignature,
  type ReelMapCoordinate,
  type ReelMapSnapshot,
} from '../../services/courseReelService';
import { APP_CONFIG } from '../../constants/config';
import { UI_STRINGS } from '../../constants/strings';
import { palette } from '../../theme/colors';

/** Remounts each capture session when the remaining places, their coordinates or the date change. */
export function ReelRouteMap({
  day,
  onReady,
  disabled,
  compact = false,
}: {
  day: ItineraryDay;
  onReady: (map: ReelMapSnapshot | null) => void;
  disabled: boolean;
  compact?: boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  const coordinates = useMemo(() => reelMapCoordinates(day), [day]);
  const signature = useMemo(() => reelMapSignature(day), [day]);
  return (
    <ReelMapCapture
      key={`${signature}:${attempt}`}
      coordinates={coordinates}
      onReady={onReady}
      disabled={disabled}
      compact={compact}
      onRetry={() => setAttempt((value) => value + 1)}
    />
  );
}

/** Owns one native map and its pending capture so stale events cannot touch the next map. */
function ReelMapCapture({
  coordinates: initialCoordinates,
  onReady,
  disabled,
  compact,
  onRetry,
}: {
  coordinates: ReelMapCoordinate[];
  onReady: (map: ReelMapSnapshot | null) => void;
  disabled: boolean;
  compact: boolean;
  onRetry: () => void;
}) {
  // The parent key makes the coordinate set immutable for this capture session.
  const coordinates = useRef(initialCoordinates).current;
  const mapRef = useRef<MapView>(null);
  const callback = useRef(onReady);
  callback.current = onReady;
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const capture = useRef<(() => void) | null>(null);
  const region = useMemo(() => reelMapRegion(coordinates), [coordinates]);
  useEffect(() => {
    let active = true,
      started = false;
    let uri: string | null = null;
    setReady(false);
    setError('');
    callback.current(null);
    if (!coordinates.length) return;
    const timer = setTimeout(() => {
      active = false;
      setError(UI_STRINGS.REEL.MAP_ERROR);
    }, APP_CONFIG.REEL.MAP_TIMEOUT_MS);
    capture.current = () => {
      if (!active || started || !coordinates.length) return;
      started = true;
      const tag = findNodeHandle(mapRef.current);
      if (tag == null) {
        setError(UI_STRINGS.REEL.MAP_ERROR);
        clearTimeout(timer);
        return;
      }
      void captureReelMap(tag, coordinates)
        .then((snapshot) => {
          if (!active) {
            void deleteReel(snapshot.uri).catch(() => {});
            return;
          }
          uri = snapshot.uri;
          setReady(true);
          callback.current(snapshot);
          clearTimeout(timer);
        })
        .catch((e: unknown) => {
          if (active)
            setError(
              e instanceof Error && e.message === UI_STRINGS.REEL.UNAVAILABLE
                ? e.message
                : UI_STRINGS.REEL.MAP_ERROR,
            );
          clearTimeout(timer);
        });
    };
    return () => {
      active = false;
      clearTimeout(timer);
      capture.current = null;
      if (uri) void deleteReel(uri).catch(() => {});
    };
  }, [coordinates]);
  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {!compact && (
        <Text style={styles.label}>{UI_STRINGS.REEL.MAP_LABEL}</Text>
      )}
      {region ? (
        <View collapsable={false} style={compact && styles.captureMask}>
          <MapView
            ref={mapRef}
            testID='reel-google-map'
            provider={PROVIDER_GOOGLE}
            style={[styles.map, compact && styles.captureMap]}
            initialRegion={region}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
            onMapLoaded={() => capture.current?.()}
          />
        </View>
      ) : (
        <Text style={styles.hint}>{UI_STRINGS.REEL.MAP_EMPTY}</Text>
      )}
      {!compact && !!region && !ready && !error && (
        <Text style={styles.hint}>{UI_STRINGS.REEL.MAP_LOADING}</Text>
      )}
      {!!error && (
        <>
          <Text style={styles.hint}>{error}</Text>
          <TouchableOpacity
            testID='reel-map-retry'
            accessibilityRole='button'
            disabled={disabled}
            onPress={onRetry}>
            <Text style={styles.retry}>{UI_STRINGS.REEL.MAP_RETRY}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  compactContainer: { marginBottom: 0 },
  captureMask: { width: 0, height: 0, overflow: 'hidden' },
  captureMap: { position: 'absolute', width: 350, height: 350 },
  container: { gap: 8, marginBottom: 20 },
  label: { color: palette.deepNavy, fontSize: 14, fontWeight: '600' },
  map: { width: '100%', aspectRatio: 1 },
  hint: { color: palette.subText, fontSize: 12 },
  retry: { color: palette.primary, paddingVertical: 12, fontWeight: '600' },
});
