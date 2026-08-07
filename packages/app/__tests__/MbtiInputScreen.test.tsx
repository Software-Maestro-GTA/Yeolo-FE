/**
 * @file MbtiInputScreen.test.tsx
 * @description Unit test for MbtiInputScreen component matching Figma UI specifications.
 */
import React from 'react';
import { fireEvent, act } from '@testing-library/react-native';
import { MbtiInputScreen } from '../src/screens/MbtiInputScreen';
import { UI_STRINGS } from '../src/constants';
import { renderWithQueryClient as render } from './test-utils';

describe('MbtiInputScreen UI & Navigation', () => {
  const mockOnNext = jest.fn();
  const mockOnDetailRecommend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Figma 스펙 타이틀, 8개 MBTI 옵션 카드 및 2개 버튼이 정상 렌더링되어야 한다', async () => {
    const { getByText, getByTestId } = await render(
      <MbtiInputScreen onNext={mockOnNext} onDetailRecommend={mockOnDetailRecommend} />
    );

    expect(getByText(UI_STRINGS.MBTI.MAIN_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.MBTI.NEXT_BUTTON)).toBeTruthy();
    expect(getByText(UI_STRINGS.MBTI.ACCURATE_RECOMMEND_BUTTON)).toBeTruthy();

    expect(getByTestId('mbti-option-E')).toBeTruthy();
    expect(getByTestId('mbti-option-I')).toBeTruthy();
    expect(getByTestId('mbti-option-S')).toBeTruthy();
    expect(getByTestId('mbti-option-N')).toBeTruthy();
    expect(getByTestId('mbti-option-T')).toBeTruthy();
    expect(getByTestId('mbti-option-F')).toBeTruthy();
    expect(getByTestId('mbti-option-J')).toBeTruthy();
    expect(getByTestId('mbti-option-P')).toBeTruthy();

    expect(getByTestId('next-button')).toBeTruthy();
    expect(getByTestId('accurate-recommend-button')).toBeTruthy();
  });

  it('MBTI 4개 항목을 모두 선택하지 않고 다음으로 버튼 클릭 시 onNext가 호출되지 않아야 한다', async () => {
    const { getByTestId } = await render(
      <MbtiInputScreen onNext={mockOnNext} onDetailRecommend={mockOnDetailRecommend} />
    );

    await act(async () => {
      fireEvent.press(getByTestId('mbti-option-E'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('mbti-option-N'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('next-button'));
    });

    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it('MBTI 4개 항목(E/I, S/N, T/F, J/P)을 모두 선택 후 다음으로 버튼 클릭 시 onNext가 호출되어야 한다', async () => {
    const { getByTestId } = await render(
      <MbtiInputScreen onNext={mockOnNext} onDetailRecommend={mockOnDetailRecommend} />
    );

    await act(async () => {
      fireEvent.press(getByTestId('mbti-option-E'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('mbti-option-N'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('mbti-option-F'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('mbti-option-P'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('next-button'));
    });

    expect(mockOnNext).toHaveBeenCalledTimes(1);
    expect(mockOnDetailRecommend).not.toHaveBeenCalled();
  });

  it('더 정확한 추천 받기 버튼 클릭 시 onDetailRecommend가 호출되어야 한다', async () => {
    const { getByTestId } = await render(
      <MbtiInputScreen onNext={mockOnNext} onDetailRecommend={mockOnDetailRecommend} />
    );

    await act(async () => {
      fireEvent.press(getByTestId('accurate-recommend-button'));
    });

    expect(mockOnDetailRecommend).toHaveBeenCalledTimes(1);
    expect(mockOnNext).not.toHaveBeenCalled();
  });
});
