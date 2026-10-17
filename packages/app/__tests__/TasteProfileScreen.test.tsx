/**
 * @file TasteProfileScreen.test.tsx
 * @description Unit test for TasteProfileScreen component matching Figma UI specifications.
 */
import React from 'react';
import { fireEvent, act } from '@testing-library/react-native';
import * as yeoloCommon from '@yeolo/common';
import { TasteProfileScreen } from '../src/screens/TasteProfileScreen';
import { renderWithQueryClient as render } from './test-utils';

describe('TasteProfileScreen UI v3 & API-PREF-4 Integration', () => {
  const mockOnGenerateCourse = jest.fn();
  const mockOnReanalyze = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(yeoloCommon, 'fetchTasteProfileApi').mockResolvedValue({
      intro: '쉬엄쉬엄 다니면서 사진은 야무지게 찍는 타입',
      hashtags: ['여유로운여행', '인생샷', '포근한날씨'],
      types: [
        {
          typeCode: 'TRAVEL_PACE',
          typeName: '여행페이스',
          lowName: '여유',
          highName: '빠름',
          score: -45,
        },
        {
          typeCode: 'PHOTO_PREFERENCE',
          typeName: '사진 취향',
          lowName: '기록',
          highName: '감성',
          score: 68,
        },
        {
          typeCode: 'WEATHER_PREFERENCE',
          typeName: '날씨 취향',
          lowName: '추운',
          highName: '더운',
          score: 32,
        },
      ],
      recommendCity: {
        countryName: '포르투갈',
        cityName: '리스본',
        imageUrl: 'https://cdn.yeolo.com/cities/lisbon.jpg',
        reason: '따뜻한 햇살과 골목 풍경이 매력적인 여행지예요',
      },
    });
  });

  it('Figma UI v3 타이틀, 티켓형 취향 카드(intro, hashtags, types 스펙트럼), 추천 여행지 카드가 정상 렌더링되어야 한다', async () => {
    const { findByText, getByText, getByTestId } = await render(
      <TasteProfileScreen
        tasteProfileId='550e8400-e29b-41d4-a716-446655440001'
        onGenerateCourse={mockOnGenerateCourse}
        onReanalyze={mockOnReanalyze}
      />,
    );

    await findByText('쉬엄쉬엄 다니면서 사진은 야무지게 찍는 타입');

    expect(getByText('여행 취향 분석 결과예요!')).toBeTruthy();
    expect(getByTestId('taste-ticket-card')).toBeTruthy();
    expect(getByText(/#여유로운여행/)).toBeTruthy();
    expect(getByText(/#인생샷/)).toBeTruthy();
    expect(getByText('여행페이스')).toBeTruthy();
    expect(getByText('사진 취향')).toBeTruthy();
    expect(getByText('날씨 취향')).toBeTruthy();

    expect(getByTestId('recommend-city-card')).toBeTruthy();
    expect(getByText('추천 여행지')).toBeTruthy();
    expect(getByText(/포르투갈.*리스본/)).toBeTruthy();
    expect(
      getByText('따뜻한 햇살과 골목 풍경이 매력적인 여행지예요'),
    ).toBeTruthy();
  });

  it('여행 코스 추천받기 및 취향 분석 다시받기 버튼 클릭 시 각각 콜백이 호출되어야 한다', async () => {
    const { findByTestId, getByTestId } = await render(
      <TasteProfileScreen
        tasteProfileId='550e8400-e29b-41d4-a716-446655440001'
        onGenerateCourse={mockOnGenerateCourse}
        onReanalyze={mockOnReanalyze}
      />,
    );

    const generateButton = await findByTestId('generate-course-button');
    await act(async () => {
      fireEvent.press(generateButton);
    });
    expect(mockOnGenerateCourse).toHaveBeenCalledTimes(1);
    expect(mockOnGenerateCourse).toHaveBeenCalledWith(
      expect.objectContaining({ countryName: '포르투갈', cityName: '리스본' }),
    );

    const reanalyzeButton = getByTestId('reanalyze-button');
    await act(async () => {
      fireEvent.press(reanalyzeButton);
    });
    expect(mockOnReanalyze).toHaveBeenCalledTimes(1);
  });
});
