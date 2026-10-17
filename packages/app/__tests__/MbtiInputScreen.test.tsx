/**
 * @file MbtiInputScreen.test.tsx
 * @description Unit test for MbtiInputScreen component matching Figma UI specifications and API-PREF-1 integration.
 */
import React from 'react';
import { fireEvent, act, waitFor } from '@testing-library/react-native';
import * as yeoloCommon from '@yeolo/common';
import { MbtiInputScreen } from '../src/screens/MbtiInputScreen';
import { UI_STRINGS } from '../src/constants';
import { renderWithQueryClient as render } from './test-utils';

describe('MbtiInputScreen UI & Navigation & API', () => {
  const mockOnNext = jest.fn();
  const mockOnDetailRecommend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Figma UI v3 타이틀, 8개 MBTI 옵션 카드 및 버튼이 정상 렌더링되어야 한다', async () => {
    const { getByText, getByTestId } = await render(
      <MbtiInputScreen
        onNext={mockOnNext}
        onDetailRecommend={mockOnDetailRecommend}
      />,
    );

    expect(getByText(/MBTI를 알려주시면\s*취향을 찾아볼게요/)).toBeTruthy();
    expect(getByText('여행 취향 알아보기')).toBeTruthy();

    expect(getByTestId('mbti-option-E')).toBeTruthy();
    expect(getByTestId('mbti-option-I')).toBeTruthy();
    expect(getByTestId('mbti-option-S')).toBeTruthy();
    expect(getByTestId('mbti-option-N')).toBeTruthy();
    expect(getByTestId('mbti-option-T')).toBeTruthy();
    expect(getByTestId('mbti-option-F')).toBeTruthy();
    expect(getByTestId('mbti-option-J')).toBeTruthy();
    expect(getByTestId('mbti-option-P')).toBeTruthy();

    expect(getByTestId('next-button')).toBeDisabled();
  });

  it('MBTI 4개 항목을 모두 선택하지 않고 다음으로 버튼 클릭 시 onNext가 호출되지 않아야 한다', async () => {
    const { getByTestId } = await render(
      <MbtiInputScreen
        onNext={mockOnNext}
        onDetailRecommend={mockOnDetailRecommend}
      />,
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

  it('MBTI 4개 선택 시 고정 CTA가 활성화되고 선택한 값의 API 저장 후에만 이동한다 (API-PREF-1)', async () => {
    const spyUpdatePref = jest
      .spyOn(yeoloCommon, 'updatePreferencesApi')
      .mockResolvedValueOnce({
        status: 200,
        message: '사용자 MBTI 수정 성공',
        data: null,
      });

    const { getByTestId, getByText } = await render(
      <MbtiInputScreen
        onNext={mockOnNext}
        onDetailRecommend={mockOnDetailRecommend}
      />,
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

    expect(getByText('여행 취향 알아보기')).toBeTruthy();
    expect(getByTestId('next-button')).toBeEnabled();
    for (const letter of ['E', 'N', 'F', 'P']) {
      expect(getByTestId(`mbti-option-${letter}`)).toBeChecked();
    }

    await act(async () => {
      fireEvent.press(getByTestId('next-button'));
    });

    await waitFor(() => {
      expect(spyUpdatePref).toHaveBeenCalledWith(
        expect.any(String),
        undefined,
        { mbti: 'ENFP' },
      );
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
    expect(mockOnDetailRecommend).not.toHaveBeenCalled();
  });

  it('API 저장 실패 시 (500 에러) onNext가 호출되지 않아야 한다', async () => {
    jest
      .spyOn(yeoloCommon, 'updatePreferencesApi')
      .mockRejectedValueOnce(
        new yeoloCommon.ApiError(500, '서버 오류가 발생했습니다.'),
      );

    const { getByTestId } = await render(
      <MbtiInputScreen
        onNext={mockOnNext}
        onDetailRecommend={mockOnDetailRecommend}
      />,
    );

    await act(async () => {
      fireEvent.press(getByTestId('mbti-option-I'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('mbti-option-S'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('mbti-option-T'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('mbti-option-J'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('next-button'));
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it('뒤로가기는 저장 요청 없이 이전 화면으로 돌아가야 한다', async () => {
    const onBack = jest.fn();
    const { getByRole } = await render(
      <MbtiInputScreen onNext={mockOnNext} onBack={onBack} />,
    );
    await fireEvent.press(
      getByRole('button', { name: UI_STRINGS.ONBOARDING.BACK }),
    );
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(mockOnNext).not.toHaveBeenCalled();
  });
});
