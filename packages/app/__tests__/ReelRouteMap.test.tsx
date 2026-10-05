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
