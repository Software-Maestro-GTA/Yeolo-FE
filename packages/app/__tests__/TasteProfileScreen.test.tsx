/**
 * @file TasteProfileScreen.test.tsx
 * @description Integration and unit tests for TasteProfileScreen fetching and displaying taste profile.
 * @requirements REQ-11
 * @functional FUN-4
 * @api API-FB-8
 * @author Antigravity Agent
 */
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { TasteProfileScreen } from '../src/screens/TasteProfileScreen';
import { ApiError, TasteProfile } from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const mockNavigateToAnalysis = jest.fn();
  const mockNavigateToLogin = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.setItem('accessToken', 'mock-bearer-token');
  });

  it('200 OK: 저장된 성향 프로필 데이터를 정상적으로 불러와 8개 카테고리 정보와 함께 표시해야 한다', async () => {
    const mockFetcher = jest.fn().mockResolvedValue(mockProfile);

    const { findByText, getByText } = await render(
      <TasteProfileScreen
        tasteProfileId="550e8400-e29b-41d4-a716-446655440001"
        fetcher={mockFetcher}
        onNavigateToAnalysis={mockNavigateToAnalysis}
        onNavigateToLogin={mockNavigateToLogin}
      />
    );

    // Wait for the profile data to be rendered (section title from Figma UI v1)
    const sectionTitle = await findByText('여행 성향 분석');
    expect(sectionTitle).toBeTruthy();

    expect(mockFetcher).toHaveBeenCalledWith(
      expect.any(String),
      'mock-bearer-token',
      '550e8400-e29b-41d4-a716-446655440001'
    );

    // Check specific taste profile fields rendered on screen
    expect(getByText('균형형')).toBeTruthy(); // travelPaceDensity: balanced
    expect(getByText('친구 여행형')).toBeTruthy(); // companionType: friends
    expect(getByText('가성비형')).toBeTruthy(); // spendingTendency: cost_effective
    expect(getByText('미식 탐험')).toBeTruthy(); // travelPurpose gourmet
  });

  it('404 Not Found: 성향 프로필이 없을 경우 유도 문구와 "성향 분석 시작하기" 버튼이 표시되어야 한다', async () => {
    const mockFetcher = jest
      .fn()
      .mockRejectedValue(new ApiError(404, '저장된 성향 프로필이 없습니다.'));

    const { findByText, getByText } = await render(
      <TasteProfileScreen
        fetcher={mockFetcher}
        onNavigateToAnalysis={mockNavigateToAnalysis}
        onNavigateToLogin={mockNavigateToLogin}
      />
    );

    const notFoundText = await findByText('저장된 여행 성향 분석 결과가 없습니다.');
    expect(notFoundText).toBeTruthy();

    const startButton = getByText('성향 분석 시작하기');
    expect(startButton).toBeTruthy();

    fireEvent.press(startButton);
    expect(mockNavigateToAnalysis).toHaveBeenCalled();
  });

  it('500 Server Error: 서버 에러 발생 시 에러 메세지와 "다시 시도" 버튼이 노출되어야 한다', async () => {
    const mockFetcher = jest
      .fn()
      .mockRejectedValueOnce(new ApiError(500, '서버 에러가 발생했습니다.'))
      .mockResolvedValueOnce({
        ...mockProfile,
        spendingTendency: 'luxury',
      });

    const { findByText, getByText } = await render(
      <TasteProfileScreen
        fetcher={mockFetcher}
        onNavigateToAnalysis={mockNavigateToAnalysis}
        onNavigateToLogin={mockNavigateToLogin}
      />
    );

    const errorText = await findByText('성향 프로필을 불러오지 못했습니다.');
    expect(errorText).toBeTruthy();

    const retryButton = getByText('다시 시도');
    expect(retryButton).toBeTruthy();

    fireEvent.press(retryButton);

    // After retry, successful profile must render
    const updatedTitle = await findByText('여행 성향 분석');
    expect(updatedTitle).toBeTruthy();
    expect(getByText('럭셔리형')).toBeTruthy();
  });


  it('401 Unauthorized: 인증 에러 발생 시 로그인 화면으로 리다이렉트되어야 한다', async () => {
    const mockFetcher = jest
      .fn()
      .mockRejectedValue(new ApiError(401, '인증 필요/토큰 만료'));

    await render(
      <TasteProfileScreen
        fetcher={mockFetcher}
        onNavigateToAnalysis={mockNavigateToAnalysis}
        onNavigateToLogin={mockNavigateToLogin}
      />
    );

    await waitFor(() => {
      expect(mockNavigateToLogin).toHaveBeenCalled();
    });
  });
});
