/**
 * @file TasteAnalysisScreen.test.tsx
 * @description Unit test for TasteAnalysisScreen component matching Figma UI specifications.
 */
import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderWithQueryClient as render } from './test-utils';
import { TasteAnalysisScreen } from '../src/screens/TasteAnalysisScreen';
import { UI_STRINGS } from '../src/constants';
import { fetchPhotosWithExifData } from '../src/services/photoService';

jest.mock('../src/services/photoService', () => ({
  fetchPhotosWithExifData: jest.fn().mockResolvedValue([
    {
      sourceImageId: 'asset-1',
      capturedAt: '2026-08-08T00:00:00.000Z',
      latitude: 37.5665,
      longitude: 126.978,
      timezone: 'UTC',
    },
  ]),
}));

describe('TasteAnalysisScreen UI & Progress', () => {
  const mockOnFinish = jest.fn();
  const mockOnFail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (fetchPhotosWithExifData as jest.Mock).mockResolvedValue([
      {
        sourceImageId: 'asset-1',
        capturedAt: '2026-08-08T00:00:00.000Z',
        latitude: 37.5665,
        longitude: 126.978,
        timezone: 'UTC',
      },
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Figma 스펙 타이틀, 스텝 3개, 실시간 인사이트 안내가 정상 렌더링되어야 한다', async () => {
    const { getByText, getAllByText, getByTestId } = await render(
      <TasteAnalysisScreen onFinish={mockOnFinish} onFail={mockOnFail} />,
    );

    expect(getByText(UI_STRINGS.TASTE_ANALYSIS.MAIN_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.TASTE_ANALYSIS.STEP_TITLE)).toBeTruthy();
    expect(
      getAllByText(new RegExp(UI_STRINGS.TASTE_ANALYSIS.STEP_1)).length,
    ).toBeGreaterThan(0);
    expect(
      getAllByText(new RegExp(UI_STRINGS.TASTE_ANALYSIS.STEP_2)).length,
    ).toBeGreaterThan(0);
    expect(
      getAllByText(new RegExp(UI_STRINGS.TASTE_ANALYSIS.STEP_3)).length,
    ).toBeGreaterThan(0);

    expect(getByTestId('checklist-container')).toBeTruthy();
    expect(getByTestId('step-1')).toBeTruthy();
    expect(getByTestId('step-2')).toBeTruthy();
    expect(getByTestId('step-3')).toBeTruthy();

    expect(getByTestId('insights-container')).toBeTruthy();
    expect(getByText(UI_STRINGS.TASTE_ANALYSIS.INSIGHTS_TITLE)).toBeTruthy();
  });

  it('분석 완료 시 즉시 전환되지 않고 1초의 텀을 두고 onFinish가 호출되어야 한다', async () => {
    const useTasteStore = require('@yeolo/common').useTasteStore;
    jest
      .spyOn(useTasteStore.getState(), 'analyzeTaste')
      .mockResolvedValueOnce('550e8400-e29b-41d4-a716-446655440001');

    await render(
      <TasteAnalysisScreen onFinish={mockOnFinish} onFail={mockOnFail} />,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    // Initial render: onFinish should not be called yet
    expect(mockOnFinish).not.toHaveBeenCalled();

    // Advance 1s timer for transition
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnFinish).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440001',
    );
  });
});
