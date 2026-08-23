/**
 * @file CourseMiniMapView.tsx
 * @description Native map view component displaying course itinerary stops with pins and route polylines.
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import type { MapCoordinate, MapRegion } from '@yeolo/common';
import { isValidCoordinate } from '@yeolo/common';
import { palette, hexToRgba } from '../../theme/colors';

export interface CourseMiniMapViewProps {
  stopCoordinates: MapCoordinate[];
  mapRegion?: MapRegion;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  interactive?: boolean;
}

interface MiniMapState {
  hasError: boolean;
}

export class CourseMiniMapView extends React.Component<
  CourseMiniMapViewProps,
  MiniMapState
> {
  private mapRef = React.createRef<MapView>();

  constructor(props: CourseMiniMapViewProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): MiniMapState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn(
      '[CourseMiniMapView] Native map rendering error caught:',
      error,
    );
  }

  componentDidUpdate(prevProps: CourseMiniMapViewProps) {
    if (
      this.mapRef.current &&
      this.props.mapRegion &&
      this.props.mapRegion !== prevProps.mapRegion
    ) {
      const { latitude, longitude, latitudeDelta, longitudeDelta } =
        this.props.mapRegion;
      if (isValidCoordinate({ latitude, longitude })) {
        try {
          if (typeof this.mapRef.current.animateToRegion === 'function') {
            this.mapRef.current.animateToRegion(
              {
                latitude,
                longitude,
                latitudeDelta: latitudeDelta || 0.05,
                longitudeDelta: longitudeDelta || 0.05,
              },
              500,
            );
          }
        } catch (_) {
          // ignore animation error
        }
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.miniMapSection}>
          <View style={styles.miniMapCard} testID='mini-map-card'>
            <View style={styles.fallbackContainer}>
              <Ionicons name='map-outline' size={24} color={palette.subText} />
              <Text style={styles.fallbackText}>
                지도를 불러올 수 없습니다.
              </Text>
            </View>
          </View>
        </View>
      );
    }

    const {
      stopCoordinates,
      mapRegion,
      onInteractionStart,
      onInteractionEnd,
      interactive = true,
    } = this.props;

    const validCoordinates = (stopCoordinates || []).filter(isValidCoordinate);

    const isRegionValid = isValidCoordinate(mapRegion);
    const safeRegion =
      mapRegion && isRegionValid
        ? {
            latitude: mapRegion.latitude,
            longitude: mapRegion.longitude,
            latitudeDelta: mapRegion.latitudeDelta || 0.05,
            longitudeDelta: mapRegion.longitudeDelta || 0.05,
          }
        : undefined;

    return (
      <View
        testID='mini-map-section'
        style={styles.miniMapSection}
        pointerEvents={interactive ? 'auto' : 'none'}
        onTouchStart={interactive ? onInteractionStart : undefined}
        onTouchEnd={interactive ? onInteractionEnd : undefined}
        onTouchCancel={interactive ? onInteractionEnd : undefined}>
        <View style={styles.miniMapCard} testID='mini-map-card'>
          <MapView
            ref={this.mapRef}
            provider={PROVIDER_GOOGLE}
            testID='in-app-map-view'
            style={styles.mapView}
            initialRegion={safeRegion}
            region={safeRegion}
            scrollEnabled={interactive}
            zoomEnabled={interactive}
            rotateEnabled={interactive}
            pitchEnabled={false}
            showsBuildings={false}
            showsIndoors={false}
            showsIndoorLevelPicker={false}
            mapType='standard'>
            {validCoordinates.map((stop, idx) => (
              <Marker
                key={`${stop.placeName || idx}-${idx}`}
                coordinate={{
                  latitude: stop.latitude,
                  longitude: stop.longitude,
                }}
                anchor={{ x: 0.5, y: 1 }}
                title={`${idx + 1}. ${stop.placeName || '장소'}`}>
                <View style={styles.customMarkerPin}>
                  <View style={styles.markerHead}>
                    <View style={styles.markerBadge}>
                      <Text style={styles.markerNumberText}>{idx + 1}</Text>
                    </View>
                  </View>
                  <View style={styles.markerTail} />
                </View>
              </Marker>
            ))}
            {validCoordinates.length > 1 && (
              <Polyline
                coordinates={validCoordinates.map((s) => ({
                  latitude: s.latitude,
                  longitude: s.longitude,
                }))}
                strokeColor={palette.primary}
                strokeWidth={3}
              />
            )}
          </MapView>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  miniMapSection: {
    width: '100%',
    marginVertical: 4,
  },
  miniMapCard: {
    height: 192,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: hexToRgba(palette.gray200, 0.5),
    backgroundColor: palette.softMint,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  mapView: {
    flex: 1,
  },
  customMarkerPin: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 4,
  },
  markerHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.primary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: palette.primary,
    alignSelf: 'center',
    marginTop: -1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.softMint,
  },
  fallbackText: {
    fontSize: 13,
    color: palette.subText,
  },
});
