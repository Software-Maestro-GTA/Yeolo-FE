/**
 * @file CourseMiniMapView.tsx
 * @description Displays numbered place markers without connecting lines, clips a stable native map viewport while preserving camera position during scrolling.
 */
import { Text } from '../common/Typography';
import React from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  View,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import type { MapCoordinate, MapRegion } from '@yeolo/common';
import { isValidCoordinate } from '@yeolo/common';
import { palette } from '../../theme/colors';
import { APP_CONFIG } from '../../constants/config';
import { COURSE_UI } from '../../constants/courseUiStrings';

export const COURSE_MAP_EXPANDED_HEIGHT = 168;
export const COURSE_MAP_COMPACT_HEIGHT = 128;

/** Freezes static marker content only after its first layout has been captured. */
const CourseMapMarker = React.memo(function CourseMapMarker({
  stop,
  index,
}: {
  stop: MapCoordinate;
  index: number;
}) {
  const markerRef = React.useRef<React.ComponentRef<typeof Marker>>(null);
  const [hasLayout, setHasLayout] = React.useState(false);
  const [tracksViewChanges, setTracksViewChanges] = React.useState(true);
  React.useEffect(() => {
    if (!hasLayout) return;
    const timer = setTimeout(() => {
      markerRef.current?.redraw?.();
      setTracksViewChanges(false);
    }, APP_CONFIG.MAP_MARKER_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [hasLayout]);
  return (
    <Marker
      ref={markerRef}
      testID={`course-map-marker-${index}`}
      tracksViewChanges={tracksViewChanges}
      coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
      anchor={{ x: 0.5, y: 1 }}
      title={`${index + 1}. ${stop.placeName || '장소'}`}>
      <View
        testID={`course-map-pin-${index}`}
        style={styles.customMarkerPin}
        onLayout={() => setHasLayout(true)}>
        <View style={styles.markerHead}>
          <View style={styles.markerBadge}>
            <Text style={styles.markerNumberText}>{index + 1}</Text>
          </View>
        </View>
      </View>
    </Marker>
  );
});

export interface CourseMiniMapViewProps {
  stopCoordinates: MapCoordinate[];
  mapRegion?: MapRegion;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  interactive?: boolean;
  compact?: boolean;
  /** Read-only scroll-driven height; overrides the standalone compact animation. */
  viewportHeight?: Animated.Value | Animated.AnimatedInterpolation<number>;
}

interface MiniMapState {
  hasError: boolean;
}

export class CourseMiniMapView extends React.PureComponent<
  CourseMiniMapViewProps,
  MiniMapState
> {
  private mapRef = React.createRef<MapView>();
  private isMapReady = false;
  private mapSize?: { width: number; height: number };
  private mapHeight: Animated.Value;
  private animatedSize: { height: Animated.Value };
  private lastFitSignature?: string;
  private mounted = false;
  private reduceMotion = false;
  private motionSubscription?: ReturnType<
    typeof AccessibilityInfo.addEventListener
  >;

  constructor(props: CourseMiniMapViewProps) {
    super(props);
    this.state = { hasError: false };
    this.mapHeight = new Animated.Value(this.targetHeight);
    this.animatedSize = { height: this.mapHeight };
  }

  private get targetHeight() {
    return this.props.compact
      ? COURSE_MAP_COMPACT_HEIGHT
      : COURSE_MAP_EXPANDED_HEIGHT;
  }

  componentDidMount() {
    this.mounted = true;
    this.motionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      this.updateReduceMotion,
    );
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(this.updateReduceMotion)
      .catch(() => {});
  }

  componentWillUnmount() {
    this.mounted = false;
    this.mapHeight.stopAnimation();
    this.motionSubscription?.remove();
  }

  private updateReduceMotion = (enabled: boolean) => {
    if (!this.mounted) return;
    this.reduceMotion = enabled;
    if (enabled) {
      this.mapHeight.stopAnimation();
      this.mapHeight.setValue(this.targetHeight);
    }
  };

  private resizeMap() {
    this.mapHeight.stopAnimation();
    if (this.reduceMotion) {
      this.mapHeight.setValue(this.targetHeight);
      return;
    }
    Animated.timing(this.mapHeight, {
      toValue: this.targetHeight,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
      isInteraction: false,
    }).start();
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
    if (!this.props.viewportHeight && this.props.compact !== prevProps.compact)
      this.resizeMap();
    const previous = (prevProps.stopCoordinates || []).filter(
      isValidCoordinate,
    );
    const next = (this.props.stopCoordinates || []).filter(isValidCoordinate);
    const coordinatesChanged =
      previous.length !== next.length ||
      next.some(
        (stop, index) =>
          stop.latitude !== previous[index]?.latitude ||
          stop.longitude !== previous[index]?.longitude,
      );
    if (coordinatesChanged) {
      this.fitStops(true);
    }
  }

  private handleMapReady = () => {
    this.isMapReady = true;
    this.fitStops(false);
  };

  private handleMapLayout = ({
    nativeEvent: { layout },
  }: LayoutChangeEvent) => {
    const { width, height } = layout;
    if (
      width <= 0 ||
      height <= 0 ||
      (this.mapSize?.width === width && this.mapSize?.height === height)
    )
      return;
    const resized = Boolean(this.mapSize);
    this.mapSize = { width, height };
    this.fitStops(resized);
  };

  /** Wait for native readiness and layout; fitting screen pixels avoids an overly wide fixed degree span. */
  private fitStops(animated: boolean) {
    const map = this.mapRef.current;
    if (!map || !this.isMapReady || !this.mapSize) return;
    const coordinates = (this.props.stopCoordinates || [])
      .filter(isValidCoordinate)
      .map(({ latitude, longitude }) => ({ latitude, longitude }));
    const first = coordinates[0];
    if (!first) return;
    const signature = JSON.stringify([this.mapSize, coordinates]);
    if (signature === this.lastFitSignature) return;
    this.lastFitSignature = signature;
    const animateCamera = animated && !this.reduceMotion;

    // A zero-area bounds can overzoom. Keep coincident places at their actual location with street context.
    const hasDistinctLocations = coordinates.some(
      (coordinate) =>
        coordinate.latitude !== first.latitude ||
        coordinate.longitude !== first.longitude,
    );
    if (hasDistinctLocations) {
      map.fitToCoordinates?.(coordinates, {
        // The upper strip is clipped in compact mode; keep all pins in the visible area.
        edgePadding: {
          top: 32 + COURSE_MAP_EXPANDED_HEIGHT - COURSE_MAP_COMPACT_HEIGHT,
          right: 24,
          bottom: 24,
          left: 24,
        },
        animated: animateCamera,
      });
    } else {
      const latitudeDelta = 0.002;
      map.animateToRegion?.(
        {
          ...first,
          latitudeDelta,
          longitudeDelta:
            latitudeDelta * (this.mapSize.width / this.mapSize.height),
        },
        animateCamera ? 350 : 0,
      );
    }
  }

  render() {
    // Re-read the interpolation when the parent measures the intro or changes layout.
    const viewportStyle = this.props.viewportHeight
      ? { height: this.props.viewportHeight }
      : this.animatedSize;
    if (this.state.hasError) {
      return (
        <View style={styles.miniMapSection}>
          <Animated.View
            style={[styles.miniMapCard, viewportStyle]}
            testID='mini-map-card'>
            <View style={styles.fallbackContainer}>
              <Ionicons name='map-outline' size={24} color={palette.subText} />
              <Text style={styles.fallbackText}>{COURSE_UI.MAP_ERROR}</Text>
            </View>
          </Animated.View>
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
        <Animated.View
          style={[styles.miniMapCard, viewportStyle]}
          testID='mini-map-card'>
          <MapView
            ref={this.mapRef}
            provider={PROVIDER_GOOGLE}
            testID='in-app-map-view'
            style={styles.mapView}
            initialRegion={safeRegion}
            onMapReady={this.handleMapReady}
            onLayout={this.handleMapLayout}
            scrollEnabled={interactive}
            zoomEnabled={interactive}
            rotateEnabled={interactive}
            pitchEnabled={false}
            showsBuildings={false}
            showsIndoors={false}
            showsIndoorLevelPicker={false}
            mapType='standard'>
            {validCoordinates.map((stop, idx) => (
              <CourseMapMarker
                key={`${stop.placeName}-${stop.latitude}-${stop.longitude}-${idx}`}
                stop={stop}
                index={idx}
              />
            ))}
          </MapView>
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  miniMapSection: {
    width: '100%',
    marginVertical: 0,
  },
  miniMapCard: {
    borderRadius: 16,
    overflow: 'hidden',

    backgroundColor: palette.softMint,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  mapView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: COURSE_MAP_EXPANDED_HEIGHT,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.darkBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.darkBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.white,
    textAlign: 'center',
    includeFontPadding: false,
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
