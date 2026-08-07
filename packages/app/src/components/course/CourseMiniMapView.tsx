/**
 * @file CourseMiniMapView.tsx
 * @description Mini map view component supporting native iOS MapView and Android in-app Leaflet WebView.
 * @requirements REQ-9
 * @functional FUN-3
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { WebView } from 'react-native-webview';
import type { MapCoordinate, MapRegion } from '@yeolo/common';
import { palette } from '../../theme/colors';

export interface CourseMiniMapViewProps {
  stopCoordinates: MapCoordinate[];
  mapRegion?: MapRegion;
  leafletHtml: string;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

export const CourseMiniMapView: React.FC<CourseMiniMapViewProps> = ({
  stopCoordinates,
  mapRegion,
  leafletHtml,
  onInteractionStart,
  onInteractionEnd,
}) => {
  const mapRef = React.useRef<MapView | null>(null);

  React.useEffect(() => {
    if (mapRef.current && mapRegion) {
      if (typeof mapRef.current.animateToRegion === 'function') {
        mapRef.current.animateToRegion(mapRegion, 500);
      }
    }
  }, [mapRegion]);

  return (
    <View
      style={styles.miniMapSection}
      onTouchStart={onInteractionStart}
      onTouchEnd={onInteractionEnd}
      onTouchCancel={onInteractionEnd}
    >
      {Platform.OS === 'ios' ? (
        <View style={styles.miniMapCard} testID="mini-map-card">
          <MapView
            ref={mapRef}
            testID="in-app-map-view"
            style={styles.mapView}
            region={mapRegion}
            scrollEnabled={true}
            zoomEnabled={true}
          >
            {stopCoordinates.map((stop, idx) => (
              <Marker
                key={`${stop.placeName}-${idx}`}
                coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                title={`${idx + 1}. ${stop.placeName}`}
              />
            ))}
            {stopCoordinates.length > 1 && (
              <Polyline
                coordinates={stopCoordinates.map((s) => ({
                  latitude: s.latitude,
                  longitude: s.longitude,
                }))}
                strokeColor={palette.primary}
                strokeWidth={3}
              />
            )}
          </MapView>
        </View>
      ) : (
        <View style={styles.miniMapCard} testID="mini-map-webview-card">
          <WebView
            key={leafletHtml}
            testID="in-app-webview"
            source={{ html: leafletHtml }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            nestedScrollEnabled={true}
            overScrollMode="never"
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="small" color={palette.primary} />
                <Text style={styles.webViewLoadingText}>지도를 불러오는 중...</Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  miniMapSection: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 4,
  },
  miniMapCard: {
    height: 192,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(198, 198, 204, 0.3)',
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
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.softMint,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  webViewLoadingText: {
    fontSize: 13,
    color: palette.subText,
  },
});
