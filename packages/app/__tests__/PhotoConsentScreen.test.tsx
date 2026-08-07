/**
 * @file PhotoConsentScreen.test.tsx
 * @description Unit test for PhotoConsentScreen component matching Figma UI specifications.
 * @requirements REQ-11, REQ-22
 * @functional FUN-1
 * @author Antigravity Agent
 */
import React from 'react';
import { fireEvent, act } from '@testing-library/react-native';
import { PhotoConsentScreen } from '../src/screens/PhotoConsentScreen';
import { UI_STRINGS } from '../src/constants';
import { renderWithQueryClient as render } from './test-utils';

describe('PhotoConsentScreen UI & Navigation', () => {
  const mockOnNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Figma 스펙 타이틀, 보증 카드 2개 및 동의 버튼이 정상 렌더링되어야 한다', async () => {
    const { getByText, getByTestId } = await render(
      <PhotoConsentScreen onNext={mockOnNext} />
    );

    expect(getByText(UI_STRINGS.PHOTO_CONSENT.MAIN_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.PHOTO_CONSENT.CARD_1_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.PHOTO_CONSENT.CARD_2_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.PHOTO_CONSENT.START_BUTTON)).toBeTruthy();

    expect(getByTestId('hero-illustration')).toBeTruthy();
    expect(getByTestId('info-card-1')).toBeTruthy();
    expect(getByTestId('info-card-2')).toBeTruthy();
    expect(getByTestId('consent-start-button')).toBeTruthy();
  });

  it('동의하고 시작하기 버튼 클릭 시 onNext가 호출되어야 한다', async () => {
    const { getByTestId } = await render(
      <PhotoConsentScreen onNext={mockOnNext} />
    );

    await act(async () => {
      fireEvent.press(getByTestId('consent-start-button'));
    });

    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });
});
