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

  const mockTasteProfile = {
    tasteProfileId: '550e8400-e29b-41d4-a716-446655440001',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    sourceType: 'mixed' as const,
    updatedAt: '2026-07-13',
    travelPurpose: {
      relaxation: 4,
      sightseeing: 3,
      culturalExperience: 3,
      gourmet: 5,
      natureExploration: 4,
    },
    travelPaceDensity: 'balanced' as const,
    preferredLocationType: {
      beachResort: 5,
      smallTownAlley: 4,
      hiddenSpotPreferred: 4,
      bigCity: 3,
    },
    activityPreference: {
      photographyVideo: 5,
      experience: 4,
      viewing: 3,
    },
    spendingTendency: 'cost_effective' as const,
    companionType: 'friends' as const,
    foodPreference: {
      localFoodActive: 5,
      cafeDessert: 5,
      famousRestaurantCentered: 4,
    },
    seasonalEnvironmentPreference: [
      'warm_region',
      'spring_flower_autumn_foliage',
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Figma 스펙 타이틀 및 섹션 영역이 정상 렌더링되어야 한다', async () => {
    const { getByText, getByTestId } = await render(
      <TasteProfileScreen
        tasteProfileId="550e8400-e29b-41d4-a716-446655440001"
        onGenerateCourse={mockOnGenerateCourse}
      />,
    );

    expect(getByText(UI_STRINGS.TASTE_PROFILE.MAIN_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.TASTE_PROFILE.PURPOSES_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.TASTE_PROFILE.FOODS_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.TASTE_PROFILE.SPACES_TITLE)).toBeTruthy();

    expect(getByTestId('summary-chips-row')).toBeTruthy();
    expect(getByTestId('ranked-purposes-section')).toBeTruthy();
    expect(getByTestId('favorite-foods-section')).toBeTruthy();
    expect(getByTestId('best-spaces-section')).toBeTruthy();
  });

  it('여행 코스 생성하기 버튼 클릭 시 onGenerateCourse가 호출되어야 한다', async () => {
    const { getByTestId } = await render(
      <TasteProfileScreen
        tasteProfileId="550e8400-e29b-41d4-a716-446655440001"
        onGenerateCourse={mockOnGenerateCourse}
      />,
    );

    await act(async () => {
      fireEvent.press(getByTestId('generate-course-button'));
    });

    expect(mockOnGenerateCourse).toHaveBeenCalledTimes(1);
  });
});
