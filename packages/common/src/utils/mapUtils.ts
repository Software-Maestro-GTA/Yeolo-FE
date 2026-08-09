/**
 * @file mapUtils.ts
 * @description Common map calculations and Leaflet HTML generator utilities shared between web and app.
 */

export interface MapCoordinate {
  latitude: number;
  longitude: number;
  placeName: string;
  sequence?: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * 인접한 장소 간의 노드 포개짐을 원천 방지하는 겹침 방지 알고리즘 (실제 좌표 오차 최소화)
 */
export function getAdjustedCoordinates(
  stops: MapCoordinate[],
): MapCoordinate[] {
  const result: MapCoordinate[] = [];
  const THRESHOLD = 0.0003; // 약 30m 이내 극인접 감지 기준

  for (let i = 0; i < stops.length; i++) {
    const current = stops[i];
    if (!current) continue;

    let lat = current.latitude;
    let lng = current.longitude;

    let overlapCount = 0;
    for (let j = 0; j < result.length; j++) {
      const prev = result[j];
      if (!prev) continue;

      const distLat = Math.abs(lat - prev.latitude);
      const distLng = Math.abs(lng - prev.longitude);
      if (distLat < THRESHOLD && distLng < THRESHOLD) {
        overlapCount++;
      }
    }

    if (overlapCount > 0) {
      // 실제 장소 위치 오차가 느껴지지 않는 미세 오프셋(약 10m 이격)
      const angle = (overlapCount * 60 * Math.PI) / 180;
      lat += Math.sin(angle) * 0.00015;
      lng += Math.cos(angle) * 0.00015;
    }

    result.push({
      ...current,
      latitude: lat,
      longitude: lng,
    });
  }

  return result;
}

/**
 * 주어진 마커 좌표들의 바운딩 박스(Bounding Box) 및 중앙 카메라 뷰포트 계산 유틸
 */
export function calculateRegion(
  stopCoordinates: MapCoordinate[],
): MapRegion | undefined {
  if (!stopCoordinates || stopCoordinates.length === 0) {
    return undefined;
  }
  const first = stopCoordinates[0];
  if (!first) {
    return undefined;
  }

  if (stopCoordinates.length === 1) {
    return {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  let minLat = first.latitude;
  let maxLat = first.latitude;
  let minLng = first.longitude;
  let maxLng = first.longitude;

  stopCoordinates.forEach((c) => {
    if (c) {
      minLat = Math.min(minLat, c.latitude);
      maxLat = Math.max(maxLat, c.latitude);
      minLng = Math.min(minLng, c.longitude);
      maxLng = Math.max(maxLng, c.longitude);
    }
  });

  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;
  const latDelta = Math.max((maxLat - minLat) * 1.5, 0.04);
  const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.04);

  return {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

/**
 * OpenStreetMap Leaflet 기반 지도 렌더링 HTML 생성기 유틸
 */
export function getLeafletMapHtml(stopCoordinates: MapCoordinate[]): string {
  if (!stopCoordinates || stopCoordinates.length === 0) return '';

  const center = stopCoordinates[0];
  if (!center) return '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #eaeef2; }
        .custom-marker {
          background-color: #ffffff;
          color: #2d7dd2;
          border-radius: 14px;
          width: 28px;
          height: 28px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 700;
          font-size: 12px;
          border: 2px solid #2d7dd2;
          box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${center.latitude}, ${center.longitude}], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: ''
        }).addTo(map);

        var latlngs = [];
        var stops = ${JSON.stringify(stopCoordinates)};

        stops.forEach(function(stop, index) {
          var latlng = [stop.latitude, stop.longitude];
          latlngs.push(latlng);

          var customIcon = L.divIcon({
            className: 'custom-marker',
            html: (index + 1).toString(),
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          L.marker(latlng, { icon: customIcon }).addTo(map).bindPopup(stop.placeName);
        });

        if (latlngs.length > 1) {
          var polyline = L.polyline(latlngs, { color: '#2d7dd2', weight: 3, opacity: 0.9 }).addTo(map);
          map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
        }
      </script>
    </body>
    </html>
  `;
}
