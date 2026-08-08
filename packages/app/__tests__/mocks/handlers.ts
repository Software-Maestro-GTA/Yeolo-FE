/**
 * @file handlers.ts
 * @description MSW handlers for mocking backend API endpoints in @yeolo/app.
 */
import { http, HttpResponse } from 'msw';
import type { CourseSummary } from '@yeolo/common';

export const MOCK_COURSE_LIST: CourseSummary[] = [
  {
    courseId: '550e8400-e29b-41d4-a716-446655440030',
    title: '2박 3일 서귀포 감성 가득 힐링 코스',
    destinationCountry: '대한민국',
    destinationCity: '제주',
    startDate: '2026-08-01',
    totalDays: 3,
    tags: ['힐링', '카페', '자연', '오션뷰'],
    recommendationReason:
      '자연 경관과 감성 카페를 선호하는 여행 성향을 반영하여 여유로운 서귀포 동선으로 추천합니다.',
    createdAt: '2026-07-20T10:00:00Z',
  },
  {
    courseId: '550e8400-e29b-41d4-a716-446655440031',
    title: '도쿄 3박 4일 미식 & 쇼핑 투어',
    destinationCountry: '일본',
    destinationCity: '도쿄',
    startDate: '2026-09-10',
    totalDays: 4,
    tags: ['미식', '쇼핑', '도시', '디저트'],
    recommendationReason:
      '도심 미식 탐방 및 긴자·시부야 쇼핑 거리 중심의 알찬 추천 코스입니다.',
    createdAt: '2026-07-18T14:30:00Z',
  },
  {
    courseId: '550e8400-e29b-41d4-a716-446655440032',
    title: '파리 4박 5일 미술관 & 로맨틱 시티 투어',
    destinationCountry: '프랑스',
    destinationCity: '파리',
    startDate: '2026-10-05',
    totalDays: 5,
    tags: ['미술관', '문화체험', '야경', '와인'],
    recommendationReason:
      '루브르·오르세 미술관과 세느강 크루즈, 로맨틱 야경을 만끽하는 감성 예술 코스입니다.',
    createdAt: '2026-07-15T09:20:00Z',
  },
  {
    courseId: '550e8400-e29b-41d4-a716-446655440033',
    title: '방콕 3박 4일 스트리트 푸드 & 루프탑 힐링',
    destinationCountry: '태국',
    destinationCity: '방콕',
    startDate: '2026-11-12',
    totalDays: 4,
    tags: ['휴양', '스트리트푸드', '야시장', '스파'],
    recommendationReason:
      '가성비 높은 호텔 스파와 야시장 스트리트 푸드, 야경 루프탑 바 중심으로 구성된 힐링 일정입니다.',
    createdAt: '2026-07-10T16:45:00Z',
  },
  {
    courseId: '550e8400-e29b-41d4-a716-446655440034',
    title: '교토 2박 3일 사찰 & 대나무 숲 힐링 산책',
    destinationCountry: '일본',
    destinationCity: '교토',
    startDate: '2026-11-20',
    totalDays: 3,
    tags: ['고즈넉함', '사찰', '자연', '말차'],
    recommendationReason:
      '아라시야마 대나무 숲과 기요미즈데라 사찰, 전통 찻집 중심의 아늑하고 조용한 추천 코스입니다.',
    createdAt: '2026-07-05T11:10:00Z',
  },
];

export const handlers = [
  // Mock Google OAuth login API-AUTH-1
  http.post('*/api/auth/google', async ({ request }) => {
    const body = (await request.json()) as {
      code?: string;
      redirectUri?: string;
    };

    if (!body.code) {
      return HttpResponse.json(
        {
          status: 400,
          message: '인가 코드가 유효하지 않습니다.',
          data: null,
        },
        { status: 400 },
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
      { status: 200 },
    );
  }),

  // Mock Apple OAuth login API-AUTH-2
  http.post('*/api/auth/apple', async ({ request }) => {
    const body = (await request.json()) as {
      code?: string;
      redirectUri?: string;
      idToken?: string | null;
    };

    if (!body.code) {
      return HttpResponse.json(
        {
          status: 400,
          message: '유효하지 않은 Apple OAuth 인가 코드입니다.',
          data: null,
        },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      {
        status: 200,
        message: '로그인 성공',
        data: {
          user: {
            userId: '550e8400-e29b-41d4-a716-446655440001',
            provider: 'apple',
            email: 'appleuser@privacy.apple.com',
            displayName: 'Apple User',
            profileImageUrl: null,
            status: 'active',
            lastLoginAt: '2026-08-04T10:00:00Z',
          },
          doOnboarding: false,
          accessToken: 'mock-apple-access-token',
          refreshToken: 'mock-apple-refresh-token',
        },
      },
      { status: 200 },
    );
  }),

  // Mock Refresh Token API-AUTH-3
  http.post('*/api/auth/refresh', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    let refreshToken: string | undefined;

    try {
      const body = (await request.json()) as { refreshToken?: string };
      refreshToken = body.refreshToken;
    } catch (_) {
      // Body might be empty, check Authorization header
    }

    if (!refreshToken && authHeader && authHeader.startsWith('Bearer ')) {
      refreshToken = authHeader.replace('Bearer ', '');
    }

    if (
      !refreshToken ||
      refreshToken === 'mock-expired-refresh-token' ||
      refreshToken === 'invalid-refresh-token'
    ) {
      return HttpResponse.json(
        {
          status: 401,
          message: 'Refresh Token이 유효하지 않거나 만료되었습니다.',
          data: null,
        },
        { status: 401 },
      );
    }

    return HttpResponse.json(
      {
        status: 200,
        message: '토큰 재발급 성공',
        data: {
          accessToken: 'new-refreshed-access-token',
          refreshToken: 'new-refreshed-refresh-token',
        },
      },
      { status: 200 },
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
      { status: 200 },
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
        { status: 400 },
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
      { status: 200 },
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
            recommendationReason:
              '자연 경관과 감성 카페를 선호하는 여행 성향을 반영하여 여유로운 서귀포 동선으로 추천합니다.',
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
      { status: 200 },
    );
  }),

  // Mock Course List GET API-FB-10
  http.get('*/api/courses', () => {
    return HttpResponse.json(
      {
        status: 200,
        message: '이전 생성 코스 목록 조회 성공',
        data: {
          courses: MOCK_COURSE_LIST,
        },
      },
      { status: 200 },
    );
  }),

  // Mock User Preferences PATCH API-PREF-1
  http.patch('*/api/users/me/preferences', async ({ request }) => {
    const body = (await request.json()) as { mbti?: string };
    if (!body.mbti || body.mbti.length !== 4) {
      return HttpResponse.json(
        {
          status: 400,
          message: 'MBTI 입력값을 확인해주세요.',
          data: null,
        },
        { status: 400 },
      );
    }
    return HttpResponse.json(
      {
        status: 200,
        message: '사용자 MBTI 수정 성공',
        data: null,
      },
      { status: 200 },
    );
  }),

  // Mock Photo Consent POST API-PREF-2
  http.post('*/api/users/me/consents/photo', async ({ request }) => {
    const body = (await request.json()) as {
      agreed?: boolean;
      consentVersion?: string;
    };
    if (typeof body.agreed !== 'boolean' || !body.consentVersion) {
      return HttpResponse.json(
        {
          status: 400,
          message: '사진 데이터 분석 동의 입력값을 확인해주세요.',
          data: null,
        },
        { status: 400 },
      );
    }
    return HttpResponse.json(
      {
        status: 200,
        message: '사진 데이터 분석 동의 저장 성공',
        data: {
          consent: {
            agreed: body.agreed,
            agreedAt: '2026-08-08T10:00:00.000Z',
            consentVersion: body.consentVersion,
          },
        },
      },
      { status: 200 },
    );
  }),

  // Mock Account Withdrawal DELETE API-USER-2
  http.delete('*/api/users/me', async () => {
    return HttpResponse.json(
      {
        status: 200,
        message: '회원탈퇴 성공',
        data: null,
      },
      { status: 200 },
    );
  }),
];
