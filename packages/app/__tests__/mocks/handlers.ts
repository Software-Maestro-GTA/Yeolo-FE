/**
 * @file handlers.ts
 * @description MSW handlers for mocking backend API endpoints in @yeolo/app.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-1
 * @author Antigravity Agent
 */
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Google OAuth login API-FB-1
  http.post('*/api/auth/google', async ({ request }) => {
    const body = (await request.json()) as { code?: string; redirectUri?: string };

    if (!body.code) {
      return HttpResponse.json(
        {
          status: 400,
          message: '인가 코드가 유효하지 않습니다.',
          data: null,
        },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      {
        status: 200,
        message: '로그인 성공',
        data: {
          user: {
            userId: '550e8400-e29b-41d4-a716-446655440000',
            provider: 'google',
            email: 'user@gmail.com',
            displayName: '최고민수',
            profileImageUrl: 'https://lh3.googleusercontent.com/avatar',
            status: 'active',
            lastLoginAt: '2026-07-16T11:00:00Z',
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      },
      { status: 200 }
    );
  }),

  // Mock Taste Profile GET API-FB-8
  http.get('https://api.yeolo.com/api/me/taste-profile', () => {

    return HttpResponse.json(
      {
        status: 200,
        message: '성향 프로필 조회 성공',
        data: {
          tasteProfile: {
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
          },
        },
      },
      { status: 200 }
    );
  }),

  // Mock SSE Course Generation API-FB-4
  http.post('*/api/courses', async ({ request }) => {
    const body = (await request.json()) as {
      destinationCountry?: string;
      destinationCity?: string;
      startDate?: string;
      totalDays?: number;
      budgetType?: string;
    };

    if (
      !body.destinationCountry ||
      !body.destinationCity ||
      !body.startDate ||
      !body.totalDays ||
      !body.budgetType
    ) {
      return HttpResponse.json(
        {
          status: 400,
          message: '여행 조건 입력값이 올바르지 않습니다.',
          data: null,
        },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      {
        status: 200,
        message: '여행 코스 생성 성공',
        data: {
          courseId: '550e8400-e29b-41d4-a716-446655440030',
        },
      },
      { status: 200 }
    );
  }),
];



