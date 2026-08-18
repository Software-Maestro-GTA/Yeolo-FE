/**
 * @file CourseMiniMapView.test.tsx
 * @description Unit tests for CourseMiniMapView component, verifying interactive and non-interactive modes.
 */
import React from 'react';
import { renderWithQueryClient as render } from './test-utils';
import { CourseMiniMapView } from '../src/components/course/CourseMiniMapView';

describe('CourseMiniMapView', () => {
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

  it('기본값(interactive=true)일 때 MapView의 scrollEnabled와 zoomEnabled가 true여야 하며 2D 고정을 위해 pitchEnabled와 showsBuildings는 false여야 한다', async () => {
    const { getByTestId } = await render(
      <CourseMiniMapView stopCoordinates={mockCoordinates} />,
    );

    const mapView = getByTestId('in-app-map-view');
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
});
