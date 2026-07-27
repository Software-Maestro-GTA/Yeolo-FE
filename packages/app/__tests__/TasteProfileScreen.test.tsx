/**
 * @file TasteProfileScreen.test.tsx
 * @description Integration and unit tests for TasteProfileScreen fetching and displaying taste profile.
 * @requirements REQ-11
 * @functional FUN-4
 * @api API-FB-8
 * @author Antigravity Agent
 */
import React from 'react';
import { waitFor, fireEvent } from '@testing-library/react-native';
import { TasteProfileScreen } from '../src/screens/TasteProfileScreen';
import * as commonApi from '@yeolo/common';
import { ApiError, TasteProfile } from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderWithQueryClient as render } from './test-utils';


const mockProfile: TasteProfile = {
  tasteProfileId: '550e8400-e29b-41d4-a716-446655440001',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  sourceType: 'mixed',
  updatedAt: '2026-07-13',
  travelPurpose: {
    relaxation: 4,
    sightseeing: 3,
    culturalExperience: 3,
    gourmet: 5,
    natureExploration: 4,
    activity: 2,
    shopping: 2,
    festivalEvent: 1,
    wellness: 3,
    selfDevelopment: 1,
  },
  travelPaceDensity: 'balanced',
  preferredLocationType: {
    bigCity: 3,
    smallTownAlley: 4,
    natureHinterland: 4,
    beachResort: 5,
    mountainPlateau: 2,
    historicalCity: 3,
    themeParkResort: 1,
    famousSpotPreferred: 3,
    hiddenSpotPreferred: 5,
  },
  activityPreference: {
    viewing: 3,
    experience: 4,
    adventure: 2,
    photographyVideo: 5,
    gourmetExploration: 5,
    nightlife: 2,
    shopping: 2,
    relaxation: 4,
    localInteraction: 3,
  },
  spendingTendency: 'cost_effective',
  companionType: 'friends',
  foodPreference: {
    localFoodActive: 5,
    famousRestaurantCentered: 4,
    streetFood: 4,
    cafeDessert: 5,
    fineDining: 2,
    familiarFoodPreferred: 2,
    dietaryRestriction: 1,
    sightseeingOverFood: 2,
  },
  seasonalEnvironmentPreference: [
    'warm_region',
    'spring_flower_autumn_foliage',
    'off_season',
  ],
};

describe('TasteProfileScreen Integration Tests (REQ-11 / FUN-4 / API-FB-8)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.setItem('accessToken', 'mock-bearer-token');
  });

  it('200 OK: 저장된 성향 프로필 데이터를 정상적으로 불러와 8개 카테고리 정보와 함께 표시해야 한다', async () => {
    const fetchSpy = jest.spyOn(commonApi, 'fetchTasteProfileApi').mockResolvedValue(mockProfile);

    const { findByText, getByText } = await render(
      <TasteProfileScreen
        tasteProfileId="550e8400-e29b-41d4-a716-446655440001"
      />
    );

    const sectionTitle = await findByText('여행 성향 분석');
    expect(sectionTitle).toBeTruthy();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      'mock-bearer-token',
      '550e8400-e29b-41d4-a716-446655440001'
    );

    expect(getByText('균형형')).toBeTruthy();
    expect(getByText('친구 여행형')).toBeTruthy();
    expect(getByText('가성비형')).toBeTruthy();
    expect(getByText('미식 탐험')).toBeTruthy();
  });

  it('404 Not Found: 저장된 프로필이 없을 경우 안내 메시지와 다시 시도 버튼이 표시되어야 한다', async () => {
    jest.spyOn(commonApi, 'fetchTasteProfileApi').mockRejectedValue(new ApiError(404, '저장된 성향 프로필이 없습니다.'));

    const { findByText, getByText } = await render(
      <TasteProfileScreen />
    );

    const notFoundText = await findByText('저장된 여행 성향 분석 결과가 없습니다.');
    expect(notFoundText).toBeTruthy();

    const retryButton = getByText('다시 시도');
    expect(retryButton).toBeTruthy();
  });

  it('500 Server Error: 서버 에러 발생 시 에러 메세지와 "다시 시도" 버튼이 노출되어야 한다', async () => {
    jest
      .spyOn(commonApi, 'fetchTasteProfileApi')
      .mockRejectedValueOnce(new ApiError(500, '서버 에러가 발생했습니다.'))
      .mockResolvedValueOnce({
        ...mockProfile,
        spendingTendency: 'luxury',
      });

    const { findByText, getByText } = await render(
      <TasteProfileScreen />
    );

    const errorText = await findByText('성향 프로필을 불러오지 못했습니다.');
    expect(errorText).toBeTruthy();

    const retryButton = getByText('다시 시도');
    expect(retryButton).toBeTruthy();

    fireEvent.press(retryButton);

    const updatedTitle = await findByText('여행 성향 분석');
    expect(updatedTitle).toBeTruthy();
    expect(getByText('럭셔리형')).toBeTruthy();
  });
});
