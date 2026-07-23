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

  // Mock Course Detail GET API-FB-7
  http.get('*/api/courses/:courseId', () => {
    return HttpResponse.json(
      {
        status: 200,
        message: '여행 코스 상세 조회 성공',
        data: {
          course: {
            courseId: 'mock-course-id-1',
            userId: 'mock-user-123',
            title: '2박 3일 제주 서귀포 감성 힐링 코스',
            destinationCountry: '대한민국',
            destinationCity: '제주',
            startDate: '2026-08-01',
            totalDays: 2,
            totalCost: 66000,
            tags: ['힐링', '해변', '카페', '자연'],
            recommendationReason: '자연 경관과 감성 카페를 선호하는 여행 성향을 반영하여 여유로운 서귀포 동선으로 추천합니다.',
            itinerary: {
              days: [
                {
                  day: 1,
                  date: '2026-08-01',
                  memo: '1일차: 함덕 해변 & 감성 카페 & 아르떼뮤지엄',
                  stops: [
                    {
                      sequence: 1,
                      placeId: 'place-1',
                      placeName: '함덕 해수욕장',
                      category: '해변',
                      arrivalTime: '10:00',
                      stayMinutes: 90,
                      memo: '탁 트인 에메랄드빛 바다 산책',
                      transportToNext: 'transit',
                      travelMinutesToNext: 30,
                      cost: 0,
                      reason: '에메랄드빛 바다 풍경과 산책로 추천',
                    },
                    {
                      sequence: 2,
                      placeId: 'place-2',
                      placeName: '카페 델문도',
                      category: '카페',
                      arrivalTime: '12:00',
                      stayMinutes: 60,
                      memo: '시그니처 제주 우도 땅콩 라떼',
                      transportToNext: 'driving',
                      travelMinutesToNext: 40,
                      cost: 15000,
                      reason: '바다 전망 오션뷰 카페 추천',
                    },
                    {
                      sequence: 3,
                      placeId: 'place-3',
                      placeName: '아르떼뮤지엄 제주',
                      category: '미술관',
                      arrivalTime: '14:30',
                      stayMinutes: 120,
                      memo: '몰입형 몰디브 미디어아트 관람',
                      transportToNext: 'none',
                      travelMinutesToNext: 0,
                      cost: 17000,
                      reason: '감성 실내 전시 및 사진 촬영 추천',
                    },
                  ],
                },
                {
                  day: 2,
                  date: '2026-08-02',
                  memo: '2일차: 비자림 숲길 힐링 & 제주 전복 맛집',
                  stops: [
                    {
                      sequence: 1,
                      placeId: 'place-4',
                      placeName: '비자림',
                      category: '관광',
                      arrivalTime: '10:30',
                      stayMinutes: 90,
                      memo: '천년의 숲 피톤치드 산책',
                      transportToNext: 'driving',
                      travelMinutesToNext: 20,
                      cost: 4000,
                      reason: '자연 휴양 숲길 산책로',
                    },
                    {
                      sequence: 2,
                      placeId: 'place-5',
                      placeName: '명진전복',
                      category: '관광',
                      arrivalTime: '12:30',
                      stayMinutes: 60,
                      memo: '전복돌솥밥과 고등어 구이',
                      transportToNext: 'none',
                      travelMinutesToNext: 0,
                      cost: 30000,
                      reason: '해안가 싱싱한 전복요리 맛집',
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      { status: 200 }
    );
  }),
];




