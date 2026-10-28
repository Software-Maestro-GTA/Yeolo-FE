/**
 * @file ReelProgressBar.test.tsx
 * @description Ensures real progress targets use native interpolation and dispose animation work.
 */
import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { ReelProgressBar } from '../src/components/course/ReelProgressBar';

it('실제 진행률 사이를 왼쪽부터 보간하고 진행률 변경·해제 시 이전 애니메이션을 정리한다', async () => {
  const animations: { start: jest.Mock; stop: jest.Mock; reset: jest.Mock }[] =
    [];
  const timing = jest.spyOn(Animated, 'timing').mockImplementation(() => {
    const animation = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() };
    animations.push(animation);
    return animation;
  });
  try {
    const ui = await render(<ReelProgressBar progress={0.2} />);
    expect(timing).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        toValue: 0.2,
        duration: 300,
        useNativeDriver: true,
      }),
    );
    expect(
      StyleSheet.flatten(ui.getByTestId('reel-progress-fill').props.style)
        .transformOrigin,
    ).toBe('left center');
    await ui.rerender(<ReelProgressBar progress={0.7} />);
    expect(animations[0].stop).toHaveBeenCalledTimes(1);
    expect(timing).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 0.7 }),
    );
    expect(animations[1].start).toHaveBeenCalledTimes(1);
    await ui.unmount();
    expect(animations[1].stop).toHaveBeenCalledTimes(1);
  } finally {
    timing.mockRestore();
  }
});
