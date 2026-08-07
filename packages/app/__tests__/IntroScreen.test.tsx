/**
 * @file IntroScreen.test.tsx
 * @description Unit test for IntroScreen UI v2 components and interaction.
 */
import React from 'react';
import { fireEvent, act } from '@testing-library/react-native';
import { IntroScreen } from '../src/screens/IntroScreen';
import { UI_STRINGS } from '../src/constants';
import { renderWithQueryClient as render } from './test-utils';

describe('IntroScreen UI & Interaction', () => {
  const mockOnNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('기본 타이틀 및 다음으로 버튼이 정상적으로 렌더링되어야 한다', async () => {
    const { getByText, getByTestId } = await render(<IntroScreen onNext={mockOnNext} />);

    expect(getByText(UI_STRINGS.INTRO.MAIN_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.INTRO.NEXT_BUTTON)).toBeTruthy();
    expect(getByTestId('next-button')).toBeTruthy();
  });

  it('다음으로 버튼 클릭 시 onNext가 호출되어야 한다', async () => {
    const { getByTestId } = await render(<IntroScreen onNext={mockOnNext} />);
    const nextButton = getByTestId('next-button');

    await act(async () => {
      fireEvent.press(nextButton);
    });

    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });
});
