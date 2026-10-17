/**
 * @file NumericBudgetSlider.test.tsx
 * @description Verifies stable drag coordinates, endpoint selection and release-only form updates.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { NumericBudgetSlider } from '../src/components/course/NumericBudgetSlider';

const touch = (pageX: number, locationX: number) => ({
  nativeEvent: { pageX, locationX },
});

describe('NumericBudgetSlider', () => {
  it('keeps tracking the finger when native local coordinates change, and commits only on release', async () => {
    const onChange = jest.fn();
    const ui = await render(
      <NumericBudgetSlider value={3000000} onChange={onChange} />,
    );
    const slider = ui.getByTestId('budget-slider');
    await fireEvent(slider, 'layout', {
      nativeEvent: { layout: { width: 200 } },
    });
    await fireEvent(slider, 'responderGrant', touch(150, 100));
    // Android may report a local coordinate relative to a moving native target.
    await fireEvent(slider, 'responderMove', touch(50, 16));
    expect(ui.getByTestId('budget-amount-text').props.accessibilityLabel).toBe(
      '총 50만원',
    );
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent(slider, 'responderMove', touch(270, 16));
    expect(ui.getByTestId('budget-amount-text').props.accessibilityLabel).toBe(
      '총 1,000만원',
    );
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent(slider, 'responderRelease', touch(270, 16));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(10000000);
  });

  it('commits the minimum when dragging past the left edge and retains it after release', async () => {
    const onChange = jest.fn();
    const ui = await render(
      <NumericBudgetSlider value={3000000} onChange={onChange} />,
    );
    const slider = ui.getByTestId('budget-slider');
    await fireEvent(slider, 'layout', {
      nativeEvent: { layout: { width: 200 } },
    });
    await fireEvent(slider, 'responderGrant', touch(150, 100));
    await fireEvent(slider, 'responderMove', touch(20, 16));
    await fireEvent(slider, 'responderRelease', touch(20, 16));
    expect(onChange).toHaveBeenCalledWith(500000);
    expect(ui.getByTestId('budget-amount-text').props.accessibilityLabel).toBe(
      '총 50만원',
    );
    expect(slider.props.onResponderTerminationRequest()).toBe(false);
  });

  it('saves the latest value if the OS interrupts a drag and accepts later external updates', async () => {
    const onChange = jest.fn();
    const ui = await render(
      <NumericBudgetSlider value={3000000} onChange={onChange} />,
    );
    const slider = ui.getByTestId('budget-slider');
    await fireEvent(slider, 'layout', {
      nativeEvent: { layout: { width: 200 } },
    });
    await fireEvent(slider, 'responderGrant', touch(150, 100));
    await fireEvent(slider, 'responderTerminate');
    expect(onChange).toHaveBeenCalledWith(5300000);
    await ui.rerender(
      <NumericBudgetSlider value={700000} onChange={onChange} />,
    );
    expect(ui.getByTestId('budget-amount-text').props.accessibilityLabel).toBe(
      '총 70만원',
    );
    await fireEvent(slider, 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });
    expect(onChange).toHaveBeenLastCalledWith(600000);
  });
});
