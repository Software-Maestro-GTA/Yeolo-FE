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
import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

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
                strokeColor={theme.colors.primary}
                strokeWidth={4}
              />
            )}
          </MapView>
        </View>
      ) : (
        <View style={styles.miniMapCard} testID="mini-map-webview-card">
          <WebView
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
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.webViewLoadingText}>{UI_STRINGS.COURSE_DETAIL.MAP_LOADING}</Text>
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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  miniMapCard: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
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
    backgroundColor: theme.colors.bg.input,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  webViewLoadingText: {
    fontSize: 13,
    color: theme.colors.text.subtle,
  },
});
