/**
 * @file course.test.ts
 * @description Unit tests for Course API (API-COURSE-1, API-COURSE-2, API-COURSE-3, API-COURSE-4).
 */
import {
  createCourseStreamApi,
  getCourseDetailApi,
  getCourseListApi,
  deleteCourseApi,
} from '../course';
import { ApiError } from '../errors';

const API_URL = 'https://api.yeolo.com';

describe('Course API Unit Tests (API-COURSE-1~4)', () => {
  let fetchSpy: jest.SpyInstance;

  afterEach(() => {
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });

  describe('1. createCourseStreamApi (API-COURSE-1)', () => {
    it('POST /api/courses 호출 시 숫자형 budget과 Accept-Language 헤더를 전송하고 courseId를 반환해야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          const headers =
            input instanceof Request
              ? input.headers
              : new Headers(init?.headers);
          const rawBody =
            input instanceof Request ? await input.text() : init?.body;
          const body = JSON.parse(rawBody || '{}');

          expect(url).toContain('api/courses');
          expect(headers.get('Authorization')).toBe('Bearer mock-token');
          expect(headers.get('Accept-Language')).toBe('ko');
          expect(body).toEqual({
            destinationCountry: '일본',
            destinationCity: '도쿄',
            startDate: '2026-11-01',
            totalDays: 3,
            budget: 1500000,
          });

          return new Response(
            JSON.stringify({
              status: 200,
              message: '여행 코스 생성 성공',
              data: {
                courseId: 'course-uuid-001',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const courseId = await createCourseStreamApi(API_URL, 'mock-token', {
        destinationCountry: '일본',
        destinationCity: '도쿄',
        startDate: '2026-11-01',
        totalDays: 3,
        budget: 1500000,
      });

      expect(courseId).toBe('course-uuid-001');
    });
  });

  describe('2. getCourseDetailApi (API-COURSE-2)', () => {
    it('GET /api/courses/{courseId} 호출 시 totalCost, totalCostExRate, exRateIcon 등이 포함된 CourseDetail을 반환해야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          const headers =
            input instanceof Request
              ? input.headers
              : new Headers(init?.headers);

          expect(url).toContain('api/courses/course-uuid-001');
          expect(headers.get('Authorization')).toBe('Bearer mock-token');
          expect(headers.get('Accept-Language')).toBe('ko');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '여행 코스 조회 성공',
              data: {
                course: {
                  courseId: 'course-uuid-001',
                  userId: 'user-uuid-001',
                  title: '도쿄 3일 여행 코스',
                  destinationCountry: '일본',
                  destinationCity: '도쿄',
                  startDate: '2026-11-01',
                  totalDays: 3,
                  totalCost: 450000,
                  totalCostExRate: 49500,
                  exRateIcon: '¥',
                  tags: ['미식', '도시'],
                  itinerary: {
                    days: [
                      {
                        day: 1,
                        date: '2026-11-01',
                        stops: [
                          {
                            sequence: 1,
                            stayMinutes: 90,
                            memo: '전망대 관람 팁',
                            reason: '도쿄 야경 명소',
                            cost: 25000,
                            place: {
                              googlePlaceId: 'ChIJ_course_test_place',
                              placeName: '시부야 스카이',
                              category: '관광명소',
                              latitude: 35.658,
                              longitude: 139.7016,
                            },
                            transportToNext: {
                              type: 'none',
                              distance: null,
                              minutes: null,
                              cost: null,
                              memo: null,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const detail = await getCourseDetailApi(
        API_URL,
        'mock-token',
        'course-uuid-001',
      );

      expect(detail.courseId).toBe('course-uuid-001');
      expect(detail.totalCost).toBe(450000);
      expect(detail.totalCostExRate).toBe(49500);
      expect(detail.exRateIcon).toBe('¥');
      expect(detail.itinerary.days[0].stops[0].cost).toBe(25000);
      expect(detail.itinerary.days[0].stops[0].place.googlePlaceId).toBe(
        'ChIJ_course_test_place',
      );
    });
  });

  describe('3. getCourseListApi (API-COURSE-3)', () => {
    it('GET /api/courses 호출 시 CourseSummary 배열을 반환해야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          const headers =
            input instanceof Request
              ? input.headers
              : new Headers(init?.headers);

          expect(url).toBe('https://api.yeolo.com/api/courses');
          expect(headers.get('Accept-Language')).toBe('ko');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '여행 코스 목록 조회 성공',
              data: {
                courses: [
                  {
                    courseId: 'course-uuid-001',
                    title: '도쿄 3일 여행 코스',
                    destinationCountry: '일본',
                    destinationCity: '도쿄',
                    coverImageUrl: 'https://example.com/tokyo.jpg',
                    startDate: '2026-11-01',
                    totalDays: 3,
                    tags: ['미식', '도시'],
                    createdAt: '2026-10-14T12:00:00Z',
                  },
                ],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const list = await getCourseListApi(API_URL, 'mock-token');
      expect(list).toHaveLength(1);
      expect(list[0].courseId).toBe('course-uuid-001');
      expect(list[0].coverImageUrl).toBe('https://example.com/tokyo.jpg');
    });
  });

  describe('4. deleteCourseApi (API-COURSE-4)', () => {
    it('DELETE /api/courses/{courseId} 성공 시 정상 종료되어야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const method =
            typeof input === 'string' ? init?.method : input.method;
          expect(method.toUpperCase()).toBe('DELETE');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '여행 코스 삭제 성공',
              data: null,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      await expect(
        deleteCourseApi(API_URL, 'mock-token', 'course-uuid-001'),
      ).resolves.toBeUndefined();
    });

    it('403 권한 없음 시 ApiError를 던져야 한다', async () => {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async () => {
          return new Response(
            JSON.stringify({
              status: 403,
              message: '해당 여행 코스를 삭제할 권한이 없습니다.',
              data: null,
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } },
          );
        });

      await expect(
        deleteCourseApi(API_URL, 'mock-token', 'course-uuid-001'),
      ).rejects.toThrow(ApiError);
    });
  });
});
