/**
 * @file LoopingVideo.test.tsx
 * @description Verifies decorative video playback, accessibility preferences, fallback and listener cleanup.
 */
import React from 'react';
import {
  AccessibilityInfo,
  AppState,
  StyleSheet,
  type AppStateStatus,
} from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { LoopingVideo } from '../src/components/common/LoopingVideo';

const initialAppState = AppState.currentState;
const styles = StyleSheet.create({ artwork: { width: 278, height: 278 } });
const hidden = { includeHiddenElements: true };
const artwork = (
  <LoopingVideo source={1} poster={2} style={styles.artwork} testID='motion' />
);

describe('LoopingVideo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AppState.currentState = 'active';
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(false);
  });
  afterEach(() => {
    AppState.currentState = initialAppState;
    jest.restoreAllMocks();
  });

  it('plays muted in a loop, pauses in the background and removes listeners on unmount', async () => {
    let onState!: (state: AppStateStatus) => void;
    const remove = jest.fn();
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_, listener) => {
        onState = listener;
        return { remove };
      });
    const screen = await render(artwork);
    const player = screen.getByTestId('motion-player', hidden).props.player;
    expect(player.loop).toBe(true);
    expect(player.muted).toBe(true);
    expect(player.play).toHaveBeenCalled();
    await act(() => onState('background'));
    expect(player.pause).toHaveBeenCalled();
    player.play.mockClear();
    await act(() => onState('active'));
    expect(player.play).toHaveBeenCalledTimes(1);
    const statusSubscription = player.addListener.mock.results[0].value;
    await screen.unmount();
    expect(remove).toHaveBeenCalled();
    expect(statusSubscription.remove).toHaveBeenCalled();
  });

  it('keeps a still poster while reduced motion is enabled and resumes when disabled', async () => {
    jest
      .mocked(AccessibilityInfo.isReduceMotionEnabled)
      .mockResolvedValue(true);
    const motionListener = jest.spyOn(AccessibilityInfo, 'addEventListener');
    const screen = await render(artwork);
    const view = screen.getByTestId('motion-player', hidden);
    const player = view.props.player;
    await fireEvent(view, 'firstFrameRender');
    expect(screen.getByTestId('motion-poster', hidden)).toBeTruthy();
    expect(player.play).not.toHaveBeenCalled();
    const onMotion = motionListener.mock.calls[0][1] as unknown as (
      enabled: boolean,
    ) => void;
    await act(() => onMotion(false));
    expect(player.play).toHaveBeenCalled();
    expect(screen.queryByTestId('motion-poster', hidden)).toBeNull();
  });

  it('keeps the poster until the first decoded frame and restores it on a video error', async () => {
    const screen = await render(artwork);
    const view = screen.getByTestId('motion-player', hidden);
    const player = view.props.player;
    expect(screen.getByTestId('motion-poster', hidden)).toBeTruthy();
    await fireEvent(view, 'firstFrameRender');
    expect(screen.queryByTestId('motion-poster', hidden)).toBeNull();
    const onStatus = player.addListener.mock.calls[0][1];
    await act(() => onStatus({ status: 'error' }));
    expect(screen.getByTestId('motion-poster', hidden)).toBeTruthy();
    expect(player.pause).toHaveBeenCalled();
  });
});
