/**
 * @file CourseMiniMapView.test.tsx
 * @description Course map gesture, marker lifecycle and native viewport fitting contracts.
 */
import React from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import {
  act,
  fireEvent,
  render as renderNative,
} from '@testing-library/react-native';
import { renderWithQueryClient as render } from './test-utils';
import { CourseMiniMapView } from '../src/components/course/CourseMiniMapView';

const mockFitToCoordinates = jest.fn();
const mockAnimateToRegion = jest.fn();

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    PROVIDER_GOOGLE: 'google',
    default: React.forwardRef((props: object, ref: unknown) => {
      React.useImperativeHandle(ref, () => ({
        fitToCoordinates: mockFitToCoordinates,
        animateToRegion: mockAnimateToRegion,
      }));
      return React.createElement(View, props);
    }),
    Marker: View,
    Polyline: View,
  };
});

describe('CourseMiniMapView', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  const mockCoordinates = [
    {
      placeName: '테스트 장소 1',
      latitude: 33.5,
      longitude: 126.5,
    },
    {
      placeName: '테스트 장소 2',
      latitude: 33.6,
      longitude: 126.6,
    },
  ];

  const closeCoordinates = [
    { placeName: '첫 장소', latitude: 35.01, longitude: 135.67 },
    { placeName: '두 번째 장소', latitude: 35.012, longitude: 135.672 },
  ];
  const layout = {
    nativeEvent: { layout: { x: 0, y: 0, width: 340, height: 168 } },
  };

  it('가까운 장소들도 지도가 준비되고 크기가 결정되면 실제 좌표에 맞춰 확대한다', async () => {
    const { getByTestId } = await render(
      <CourseMiniMapView
        stopCoordinates={closeCoordinates}
        mapRegion={{
          latitude: 35.011,
          longitude: 135.671,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
      />,
    );
    const map = getByTestId('in-app-map-view');
    await fireEvent(map, 'layout', layout);
    expect(mockFitToCoordinates).not.toHaveBeenCalled();
    await fireEvent(map, 'mapReady');
    expect(mockFitToCoordinates).toHaveBeenCalledWith(
      closeCoordinates.map(({ latitude, longitude }) => ({
        latitude,
        longitude,
      })),
      {
        animated: false,
        edgePadding: { top: 72, right: 24, bottom: 24, left: 24 },
      },
    );
    expect(map.props.region).toBeUndefined();
    expect(map.props.zoomEnabled).toBe(true);
  });

  it('사용자 확대는 접기·펼치기 후에도 유지하고 날짜 또는 너비 변경에만 다시 맞춘다', async () => {
    jest.useFakeTimers();
    const { getByTestId, rerender } = await renderNative(
      <CourseMiniMapView stopCoordinates={closeCoordinates} />,
    );
    await fireEvent(getByTestId('in-app-map-view'), 'mapReady');
    expect(mockFitToCoordinates).not.toHaveBeenCalled();
    await fireEvent(getByTestId('in-app-map-view'), 'layout', layout);
    expect(mockFitToCoordinates).toHaveBeenCalledTimes(1);
    await rerender(
      <CourseMiniMapView
        stopCoordinates={closeCoordinates.map((stop) => ({ ...stop }))}
      />,
    );
    await fireEvent(getByTestId('in-app-map-view'), 'layout', layout);
    expect(mockFitToCoordinates).toHaveBeenCalledTimes(1);
    await rerender(<CourseMiniMapView stopCoordinates={mockCoordinates} />);
    expect(mockFitToCoordinates).toHaveBeenLastCalledWith(
      mockCoordinates.map(({ latitude, longitude }) => ({
        latitude,
        longitude,
      })),
      expect.objectContaining({ animated: true }),
    );
    await rerender(
      <CourseMiniMapView stopCoordinates={mockCoordinates} compact />,
    );
    await fireEvent(getByTestId('in-app-map-view'), 'layout', layout);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    expect(mockFitToCoordinates).toHaveBeenCalledTimes(2);
    await rerender(<CourseMiniMapView stopCoordinates={mockCoordinates} />);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    expect(mockFitToCoordinates).toHaveBeenCalledTimes(2);
    await fireEvent(getByTestId('in-app-map-view'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 168 } },
    });
    expect(mockFitToCoordinates).toHaveBeenCalledTimes(3);
  });

  it('표시 영역이 접히는 중에도 네이티브 지도 높이와 카메라는 유지된다', async () => {
    jest.useFakeTimers();
    const { getByTestId, rerender, unmount } = await renderNative(
      <CourseMiniMapView stopCoordinates={closeCoordinates} />,
    );
    await fireEvent(getByTestId('in-app-map-view'), 'mapReady');
    await fireEvent(getByTestId('in-app-map-view'), 'layout', layout);
    await rerender(
      <CourseMiniMapView stopCoordinates={closeCoordinates} compact />,
    );
    await act(async () => {
      await jest.advanceTimersByTimeAsync(80);
    });
    const viewportHeight = StyleSheet.flatten(
      getByTestId('mini-map-card').props.style,
    ).height;
    expect(viewportHeight).toBeGreaterThan(128);
    expect(viewportHeight).toBeLessThan(168);
    expect(
      StyleSheet.flatten(getByTestId('in-app-map-view').props.style).height,
    ).toBe(168);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    expect(
      StyleSheet.flatten(getByTestId('mini-map-card').props.style).height,
    ).toBe(128);
    expect(mockFitToCoordinates).toHaveBeenCalledTimes(1);
    await rerender(
      <CourseMiniMapView stopCoordinates={mockCoordinates} compact />,
    );
    expect(mockFitToCoordinates).toHaveBeenCalledTimes(2);
    expect(mockFitToCoordinates).toHaveBeenLastCalledWith(
      mockCoordinates.map(({ latitude, longitude }) => ({
        latitude,
        longitude,
      })),
      expect.objectContaining({ animated: true }),
    );
    await unmount();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    expect(mockFitToCoordinates).toHaveBeenCalledTimes(2);
  });

  it('축소 중 방향을 바꿔도 현재 높이에서 이어서 원래 크기로 돌아온다', async () => {
    jest.useFakeTimers();
    const { getByTestId, rerender } = await renderNative(
      <CourseMiniMapView stopCoordinates={closeCoordinates} />,
    );
    const height = () =>
      StyleSheet.flatten(getByTestId('mini-map-card').props.style)
        .height as number;
    const expandedHeight = height();
    await rerender(
      <CourseMiniMapView stopCoordinates={closeCoordinates} compact />,
    );
    await act(async () => {
      await jest.advanceTimersByTimeAsync(80);
    });
    const shrinkingHeight = height();
    expect(shrinkingHeight).toBeLessThan(expandedHeight);
    expect(shrinkingHeight).toBeGreaterThan(128);
    await rerender(<CourseMiniMapView stopCoordinates={closeCoordinates} />);
    expect(height()).toBeCloseTo(shrinkingHeight);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    expect(height()).toBe(expandedHeight);
  });

  it('동작 줄이기 설정이 켜져 있으면 지연 없이 크기를 바꾼다', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);
    const { getByTestId, rerender } = await renderNative(
      <CourseMiniMapView stopCoordinates={closeCoordinates} />,
    );
    await fireEvent(getByTestId('in-app-map-view'), 'layout', layout);
    await fireEvent(getByTestId('in-app-map-view'), 'mapReady');
    await rerender(
      <CourseMiniMapView stopCoordinates={closeCoordinates} compact />,
    );
    expect(
      StyleSheet.flatten(getByTestId('mini-map-card').props.style).height,
    ).toBe(128);
    await fireEvent(getByTestId('in-app-map-view'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 340, height: 168 } },
    });
    expect(mockFitToCoordinates).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.objectContaining({ animated: false }),
    );
  });

  it.each([1, 2])(
    '한 위치에 %i개 장소가 있으면 좌표를 옮기지 않고 주변 거리 수준으로 표시한다',
    async (count) => {
      const stops = Array.from({ length: count }, (_, index) => ({
        ...closeCoordinates[0],
        placeName: `장소 ${index + 1}`,
      }));
      const { getByTestId } = await render(
        <CourseMiniMapView stopCoordinates={stops} />,
      );
      const map = getByTestId('in-app-map-view');
      await fireEvent(map, 'layout', layout);
      await fireEvent(map, 'mapReady');
      expect(mockFitToCoordinates).not.toHaveBeenCalled();
      expect(mockAnimateToRegion).toHaveBeenCalledTimes(1);
      const [region] = mockAnimateToRegion.mock.calls[0];
      expect(region.latitude).toBe(closeCoordinates[0].latitude);
      expect(region.longitude).toBe(closeCoordinates[0].longitude);
      expect(region.latitudeDelta).toBeGreaterThan(0);
      expect(region.latitudeDelta).toBeLessThan(0.01);
      expect(region.longitudeDelta).toBeGreaterThan(region.latitudeDelta);
      for (let index = 0; index < count; index++) {
        expect(
          getByTestId(`course-map-marker-${index}`).props.coordinate,
        ).toEqual({
          latitude: stops[index].latitude,
          longitude: stops[index].longitude,
        });
      }
    },
  );

  it('유효하지 않은 좌표는 카메라 계산이나 마커에 전달하지 않는다', async () => {
    const { getByTestId, queryByTestId } = await render(
      <CourseMiniMapView
        stopCoordinates={[{ placeName: '누락', latitude: 0, longitude: 0 }]}
      />,
    );
    await fireEvent(getByTestId('in-app-map-view'), 'layout', layout);
    await fireEvent(getByTestId('in-app-map-view'), 'mapReady');
    expect(mockFitToCoordinates).not.toHaveBeenCalled();
    expect(mockAnimateToRegion).not.toHaveBeenCalled();
    expect(queryByTestId('course-map-marker-0')).toBeNull();
  });

  it('기본값(interactive=true)일 때 MapView의 scrollEnabled와 zoomEnabled가 true여야 하며 2D 고정을 위해 pitchEnabled와 showsBuildings는 false여야 한다', async () => {
    const { getByTestId } = await render(
      <CourseMiniMapView stopCoordinates={mockCoordinates} />,
    );

    const mapView = getByTestId('in-app-map-view');
    expect(mapView.props.provider).toBe('google');
    expect(mapView.props.scrollEnabled).toBe(true);
    expect(mapView.props.zoomEnabled).toBe(true);
    expect(mapView.props.pitchEnabled).toBe(false);
    expect(mapView.props.showsBuildings).toBe(false);
  });

  it('interactive=false일 때 MapView의 scrollEnabled와 zoomEnabled가 false여야 하고 pointerEvents가 none이어야 한다', async () => {
    const { getByTestId } = await render(
      <CourseMiniMapView
        stopCoordinates={mockCoordinates}
        interactive={false}
      />,
    );

    const mapView = getByTestId('in-app-map-view');
    expect(mapView.props.scrollEnabled).toBe(false);
    expect(mapView.props.zoomEnabled).toBe(false);
    expect(mapView.props.rotateEnabled).toBe(false);
    expect(mapView.props.pitchEnabled).toBe(false);

    const miniMapSection = getByTestId('mini-map-section');
    expect(miniMapSection.props.pointerEvents).toBe('none');
  });

  it('captures the first marker layout, freezes it, and refreshes a changed day', async () => {
    jest.useFakeTimers();
    try {
      const { getByTestId, rerender } = await renderNative(
        <CourseMiniMapView stopCoordinates={mockCoordinates} />,
      );
      expect(getByTestId('course-map-marker-0').props.tracksViewChanges).toBe(
        true,
      );
      await fireEvent(getByTestId('course-map-pin-0'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 28, height: 36 } },
      });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(200);
      });
      expect(getByTestId('course-map-marker-0').props.tracksViewChanges).toBe(
        false,
      );
      await rerender(
        <CourseMiniMapView
          stopCoordinates={[
            { placeName: '다음날 장소', latitude: 34, longitude: 127 },
          ]}
        />,
      );
      const nextMarker = getByTestId('course-map-marker-0');
      expect(nextMarker.props.title).toBe('1. 다음날 장소');
      expect(nextMarker.props.coordinate).toEqual({
        latitude: 34,
        longitude: 127,
      });
      expect(nextMarker.props.tracksViewChanges).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});
