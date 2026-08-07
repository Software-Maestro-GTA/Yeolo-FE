/**
 * @file TasteAnalysisScreen.test.tsx
 * @description Unit test for TasteAnalysisScreen component matching Figma UI specifications.
 */
import React from 'react';
import { renderWithQueryClient as render } from './test-utils';
import { TasteAnalysisScreen } from '../src/screens/TasteAnalysisScreen';
import { UI_STRINGS } from '../src/constants';

jest.mock('../src/services', () => ({
  fetchPhotosWithExifData: jest.fn().mockResolvedValue([
    { latitude: 37.5665, longitude: 126.978, timestamp: Date.now() },
  ]),
}));

describe('TasteAnalysisScreen UI & Progress', () => {
  const mockOnFinish = jest.fn();
  const mockOnFail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Figma 스펙 타이틀, 스텝 3개 및 실시간 수집 헤더가 정상 렌더링되어야 한다', async () => {
    const { getByText, getByTestId } = await render(
      <TasteAnalysisScreen onFinish={mockOnFinish} onFail={mockOnFail} />
    );

    expect(getByText(UI_STRINGS.TASTE_ANALYSIS.MAIN_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.TASTE_ANALYSIS.STEP_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.TASTE_ANALYSIS.STEP_1)).toBeTruthy();
    expect(getByText(UI_STRINGS.TASTE_ANALYSIS.STEP_2)).toBeTruthy();
    expect(getByText(UI_STRINGS.TASTE_ANALYSIS.STEP_3)).toBeTruthy();

    expect(getByTestId('checklist-container')).toBeTruthy();
    expect(getByTestId('step-1')).toBeTruthy();
    expect(getByTestId('step-2')).toBeTruthy();
    expect(getByTestId('step-3')).toBeTruthy();

    expect(getByTestId('insights-container')).toBeTruthy();
    expect(getByText(UI_STRINGS.TASTE_ANALYSIS.INSIGHTS_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.TASTE_ANALYSIS.INSIGHTS_BADGE)).toBeTruthy();
  });
});
