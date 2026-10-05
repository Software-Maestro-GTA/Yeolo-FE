/**
 * @file ReelRouteMap.tsx
 * @description Captures a loaded Google Maps SDK background and its geographic projection for local reel export.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  findNodeHandle,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import type { ItineraryDay } from '@yeolo/common';
import {
  captureReelMap,
  deleteReel,
  reelMapCoordinates,
  type ReelMapSnapshot,
} from '../../services/courseReelService';
import { APP_CONFIG } from '../../constants/config';
import { UI_STRINGS } from '../../constants/strings';
import { palette } from '../../theme/colors';

/** A fresh instance per date prevents late tile/snapshot events from updating another day's video. */
export function ReelRouteMap({
  day,
  onReady,
  disabled,
}: {
  day: ItineraryDay;
  onReady: (map: ReelMapSnapshot | null) => void;
  disabled: boolean;
}) {
  const mapRef = useRef<MapView>(null);
  const callback = useRef(onReady);
  callback.current = onReady;
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const capture = useRef<(() => void) | null>(null);
  const coordinates = useMemo(() => reelMapCoordinates(day), [day]);
  const region = useMemo(() => {
    if (!coordinates.length) return undefined;
    const latitudes = coordinates.map((p) => p.latitude);
    const longitudes = coordinates.map((p) => p.longitude);
    const minLat = Math.min(...latitudes),
      maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes),
      maxLng = Math.max(...longitudes);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.008, (maxLat - minLat) * 1.7),
      longitudeDelta: Math.max(0.008, (maxLng - minLng) * 1.7),
    };
  }, [coordinates]);
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
  }, [coordinates, attempt]);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{UI_STRINGS.REEL.MAP_LABEL}</Text>
      {region ? (
        <MapView
          key={attempt}
          ref={mapRef}
          testID='reel-google-map'
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          onMapLoaded={() => capture.current?.()}
        />
      ) : (
        <Text style={styles.hint}>{UI_STRINGS.REEL.MAP_EMPTY}</Text>
      )}
      {!!region && !ready && !error && (
        <Text style={styles.hint}>{UI_STRINGS.REEL.MAP_LOADING}</Text>
      )}
      {!!error && (
        <>
          <Text style={styles.hint}>{error}</Text>
          <TouchableOpacity
            testID='reel-map-retry'
            accessibilityRole='button'
            disabled={disabled}
            onPress={() => setAttempt((n) => n + 1)}>
            <Text style={styles.retry}>{UI_STRINGS.REEL.MAP_RETRY}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 8, marginBottom: 20 },
  label: { color: palette.deepNavy, fontSize: 14, fontWeight: '600' },
  map: { width: '100%', aspectRatio: 1 },
  hint: { color: palette.subText, fontSize: 12 },
  retry: { color: palette.primary, paddingVertical: 12, fontWeight: '600' },
});
