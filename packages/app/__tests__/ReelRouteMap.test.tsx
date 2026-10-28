/**
 * @file ReelRouteMap.test.tsx
 * @description Loaded-map capture, retry, timeout and stale snapshot cleanup contracts.
 */
import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { ReelRouteMap } from '../src/components/course/ReelRouteMap';
import * as service from '../src/services/courseReelService';
import { renderWithQueryClient as render } from './test-utils';
import { reelCourse } from './mocks/reel-fixtures';
import { UI_STRINGS } from '../src/constants/strings';
import { APP_CONFIG } from '../src/constants/config';

jest.mock('react-native/Libraries/ReactNative/RendererProxy', () => ({
  ...jest.requireActual('react-native/Libraries/ReactNative/RendererProxy'),
  findNodeHandle: jest.fn(() => 42),
}));
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    PROVIDER_GOOGLE: 'google',
    default: React.forwardRef((props: object, ref: unknown) =>
      React.createElement(View, { ...props, ref }),
    ),
  };
});
jest.mock('../src/services/courseReelService', () => ({
  ...jest.requireActual('../src/services/courseReelService'),
  captureReelMap: jest.fn(),
  deleteReel: jest.fn().mockResolvedValue(undefined),
}));
const snapshot = {
  uri: 'file:///map-test.png',
  points: [{ x: 0.3, y: 0.4, label: '1' }],
};
const mount = async () => {
  const onReady = jest.fn();
  const screen = await render(
    <ReelRouteMap
      day={reelCourse.itinerary.days[0]}
      onReady={onReady}
      disabled={false}
    />,
  );
  return { ...screen, onReady };
};
describe('ReelRouteMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (service.captureReelMap as jest.Mock).mockResolvedValue(snapshot);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });
  it('편집기의 숨은 지도는 날짜가 바뀌어도 로딩 문구를 표시하지 않는다', async () => {
    const onReady = jest.fn();
    const ui = await render(
      <ReelRouteMap
        compact
        day={reelCourse.itinerary.days[0]}
        onReady={onReady}
        disabled={false}
      />,
    );
    expect(ui.queryByText(UI_STRINGS.REEL.MAP_LOADING)).toBeNull();
    await ui.rerender(
      <ReelRouteMap
        compact
        day={reelCourse.itinerary.days[1]}
        onReady={onReady}
        disabled={false}
      />,
    );
    expect(ui.queryByText(UI_STRINGS.REEL.MAP_LOADING)).toBeNull();
    await fireEvent(ui.getByTestId('reel-google-map'), 'mapLoaded');
    expect(onReady).toHaveBeenCalledWith(snapshot);
  });
  it('Google 지도가 로드된 후 한 번 캡처하고 SDK 좌표를 전달한다', async () => {
    const { getByTestId, onReady, unmount } = await mount();
    const map = getByTestId('reel-google-map');
    expect(map.props.provider).toBe('google');
    expect(service.captureReelMap).not.toHaveBeenCalled();
    await fireEvent(map, 'mapLoaded');
    await fireEvent(map, 'mapLoaded');
    expect(service.captureReelMap).toHaveBeenCalledTimes(1);
    expect(service.captureReelMap).toHaveBeenCalledWith(42, [
      { latitude: 35.01, longitude: 129.01, label: '1' },
      { latitude: 35.02, longitude: 129.02, label: '2' },
    ]);
    expect(onReady).toHaveBeenCalledWith(snapshot);
    await unmount();
    expect(service.deleteReel).toHaveBeenCalledWith(snapshot.uri);
  });
  it('같은 날짜의 위치 변경·삭제에도 지도를 다시 만들고 남은 좌표로 범위를 계산한다', async () => {
    const onReady = jest.fn();
    const day = reelCourse.itinerary.days[0];
    const ui = await render(
      <ReelRouteMap day={day} onReady={onReady} disabled={false} />,
    );
    const previousMap = ui.getByTestId('reel-google-map');
    await fireEvent(previousMap, 'mapLoaded');
    const changed = {
      ...day,
      stops: [
        {
          ...day.stops[1],
          place: { ...day.stops[1].place, latitude: 37.57, longitude: 126.98 },
        },
      ],
    };
    await ui.rerender(
      <ReelRouteMap day={changed} onReady={onReady} disabled={false} />,
    );
    const nextMap = ui.getByTestId('reel-google-map');
    expect(nextMap).not.toBe(previousMap);
    expect(nextMap.props.initialRegion).toMatchObject({
      latitude: 37.57,
      longitude: 126.98,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    });
    expect(service.deleteReel).toHaveBeenCalledWith(snapshot.uri);
    expect(onReady).toHaveBeenLastCalledWith(null);
    await fireEvent(nextMap, 'mapLoaded');
    expect(service.captureReelMap).toHaveBeenLastCalledWith(42, [
      { latitude: 37.57, longitude: 126.98, label: '1' },
    ]);
  });
  it('교체된 지도의 늦은 로딩 이벤트로 새 지도를 미리 캡처하지 않는다', async () => {
    const onReady = jest.fn();
    const day = reelCourse.itinerary.days[0];
    const ui = await render(
      <ReelRouteMap day={day} onReady={onReady} disabled={false} />,
    );
    const oldLoaded = ui.getByTestId('reel-google-map').props.onMapLoaded;
    await ui.rerender(
      <ReelRouteMap
        day={{ ...day, stops: [day.stops[0]] }}
        onReady={onReady}
        disabled={false}
      />,
    );
    await act(async () => oldLoaded());
    expect(service.captureReelMap).not.toHaveBeenCalled();
    await fireEvent(ui.getByTestId('reel-google-map'), 'mapLoaded');
    expect(service.captureReelMap).toHaveBeenCalledTimes(1);
  });
  it('같은 좌표의 새 일정 객체는 지도 캡처를 다시 시작하지 않는다', async () => {
    const onReady = jest.fn();
    const day = reelCourse.itinerary.days[0];
    const ui = await render(
      <ReelRouteMap day={day} onReady={onReady} disabled={false} />,
    );
    await fireEvent(ui.getByTestId('reel-google-map'), 'mapLoaded');
    const map = ui.getByTestId('reel-google-map');
    onReady.mockClear();
    await ui.rerender(
      <ReelRouteMap
        day={{ ...day, memo: '새 메모' }}
        onReady={onReady}
        disabled={false}
      />,
    );
    expect(ui.getByTestId('reel-google-map')).toBe(map);
    expect(onReady).not.toHaveBeenCalled();
    expect(service.captureReelMap).toHaveBeenCalledTimes(1);
  });
  it('위치 변경 후 도착한 이전 캡처는 삭제하고 새 지도를 보존한다', async () => {
    let resolve: (map: typeof snapshot) => void = () => {};
    jest.mocked(service.captureReelMap).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const onReady = jest.fn();
    const day = reelCourse.itinerary.days[0];
    const ui = await render(
      <ReelRouteMap day={day} onReady={onReady} disabled={false} />,
    );
    await fireEvent(ui.getByTestId('reel-google-map'), 'mapLoaded');
    const next = { ...snapshot, uri: 'file:///new-map.png' };
    jest.mocked(service.captureReelMap).mockResolvedValueOnce(next);
    await ui.rerender(
      <ReelRouteMap
        day={{ ...day, stops: [day.stops[1]] }}
        onReady={onReady}
        disabled={false}
      />,
    );
    await fireEvent(ui.getByTestId('reel-google-map'), 'mapLoaded');
    await act(async () => resolve(snapshot));
    expect(onReady).toHaveBeenLastCalledWith(next);
    expect(service.deleteReel).toHaveBeenCalledWith(snapshot.uri);
    expect(service.deleteReel).not.toHaveBeenCalledWith(next.uri);
  });
  it('모든 장소가 없어지면 이전 캡처를 정리하고 빈 지도를 표시한다', async () => {
    const onReady = jest.fn();
    const day = reelCourse.itinerary.days[0];
    const ui = await render(
      <ReelRouteMap day={day} onReady={onReady} disabled={false} />,
    );
    await fireEvent(ui.getByTestId('reel-google-map'), 'mapLoaded');
    await ui.rerender(
      <ReelRouteMap
        day={{ ...day, stops: [] }}
        onReady={onReady}
        disabled={false}
      />,
    );
    expect(ui.queryByTestId('reel-google-map')).toBeNull();
    expect(ui.getByText(UI_STRINGS.REEL.MAP_EMPTY)).toBeTruthy();
    expect(onReady).toHaveBeenLastCalledWith(null);
    expect(service.deleteReel).toHaveBeenCalledWith(snapshot.uri);
  });
  it('캡처 실패를 알리고 재시도하면 새 배경을 전달한다', async () => {
    (service.captureReelMap as jest.Mock).mockRejectedValueOnce(
      new Error('tiles'),
    );
    const { getByTestId, findByText, onReady } = await mount();
    await fireEvent(getByTestId('reel-google-map'), 'mapLoaded');
    await findByText(UI_STRINGS.REEL.MAP_ERROR);
    await fireEvent.press(getByTestId('reel-map-retry'));
    await fireEvent(getByTestId('reel-google-map'), 'mapLoaded');
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(snapshot));
  });
  it('날짜 변경이나 닫기 이후 늦게 도착한 지도 파일을 삭제한다', async () => {
    let resolve: (map: typeof snapshot) => void = () => {};
    (service.captureReelMap as jest.Mock).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { getByTestId, onReady, unmount } = await mount();
    await fireEvent(getByTestId('reel-google-map'), 'mapLoaded');
    await unmount();
    await act(async () => {
      resolve(snapshot);
    });
    expect(onReady).not.toHaveBeenCalledWith(snapshot);
    expect(service.deleteReel).toHaveBeenCalledWith(snapshot.uri);
  });
  it('지도 로딩이 끝나지 않으면 재시도를 제공한다', async () => {
    jest.useFakeTimers();
    const { getByTestId, queryByText, onReady } = await mount();
    await act(async () => {
      jest.advanceTimersByTime(APP_CONFIG.REEL.MAP_TIMEOUT_MS);
    });
    expect(queryByText(UI_STRINGS.REEL.MAP_ERROR)).toBeTruthy();
    expect(getByTestId('reel-map-retry')).toBeTruthy();
    expect(onReady).not.toHaveBeenCalledWith(snapshot);
  });
});
