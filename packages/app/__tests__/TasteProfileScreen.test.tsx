/**
 * @file TasteProfileScreen.test.tsx
 * @description Unit test for TasteProfileScreen component matching Figma UI specifications.
 */
import React from 'react';
import { fireEvent, act } from '@testing-library/react-native';
import { TasteProfileScreen } from '../src/screens/TasteProfileScreen';
import { UI_STRINGS } from '../src/constants';
import { renderWithQueryClient as render } from './test-utils';

describe('TasteProfileScreen UI & Navigation', () => {
  const mockOnGenerateCourse = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Figma 스펙 타이틀, 요약 칩, 목적 순위 및 선호 공간 3개 카드가 정상 렌더링되어야 한다', async () => {
    const { getByText, getByTestId } = await render(
      <TasteProfileScreen onGenerateCourse={mockOnGenerateCourse} />,
    );

    expect(getByText(UI_STRINGS.TASTE_PROFILE.MAIN_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.TASTE_PROFILE.PURPOSES_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.TASTE_PROFILE.FOODS_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.TASTE_PROFILE.SPACES_TITLE)).toBeTruthy();

    expect(getByTestId('summary-chips-row')).toBeTruthy();
    expect(getByTestId('ranked-purposes-section')).toBeTruthy();
    expect(getByTestId('favorite-foods-section')).toBeTruthy();
    expect(getByTestId('best-spaces-section')).toBeTruthy();

    expect(getByTestId('space-card-1')).toBeTruthy();
    expect(getByTestId('space-card-2')).toBeTruthy();
    expect(getByTestId('space-card-3')).toBeTruthy();
  });

  it('여행 코스 생성하기 버튼 클릭 시 onGenerateCourse가 호출되어야 한다', async () => {
    const { getByTestId } = await render(
      <TasteProfileScreen onGenerateCourse={mockOnGenerateCourse} />,
    );

    await act(async () => {
      fireEvent.press(getByTestId('generate-course-button'));
    });

    expect(mockOnGenerateCourse).toHaveBeenCalledTimes(1);
  });
});
