/**
 * @file share.test.ts
 * @description Unit tests for createShareLinkApi (API-SHARE-1), getShareLinkApi (API-SHARE-2), and acceptShareLinkApi (API-SHARE-3).
 */
import {
  createShareLinkApi,
  getShareLinkApi,
  acceptShareLinkApi,
} from '../share';
import { ApiError } from '../errors';

const API_URL = 'https://api.yeolo.com';

describe('Share API Unit Tests (API-SHARE-1, API-SHARE-2, API-SHARE-3)', () => {
  let fetchSpy: any;

  afterEach(() => {
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });

  describe('createShareLinkApi (API-SHARE-1)', () => {
    it('코스 공유 링크 생성 성공 시 200 OK와 shareUrl, shareToken을 반환해야 한다', async () => {
      fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          expect(url).toContain('api/courses/course-uuid-123/share-links');
          expect(init?.method).toBe('POST');
          expect(init?.headers?.Authorization).toBe('Bearer mock-access-token');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '여행 코스 공유 링크 생성 성공',
              data: {
                shareUrl: 'https://yeolo.app/share/token-xyz',
                shareToken: 'token-xyz',
                expiresAt: '2026-08-17T10:00:00.000Z',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const result = await createShareLinkApi(
        API_URL,
        'mock-access-token',
        'course-uuid-123',
      );

      expect(result.shareUrl).toBe('https://yeolo.app/share/token-xyz');
      expect(result.shareToken).toBe('token-xyz');
      expect(result.expiresAt).toBe('2026-08-17T10:00:00.000Z');
    });

    it('권한이 없을 경우(403) ApiError를 던져야 한다', async () => {
      fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            status: 403,
            message: '해당 여행 코스를 공유할 권한이 없습니다.',
            data: null,
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } },
        );
      });

      await expect(
        createShareLinkApi(API_URL, 'invalid-token', 'course-uuid-123'),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getShareLinkApi (API-SHARE-2)', () => {
    it('공유 링크 조회 성공 시 200 OK와 초대자 및 코스 요약 정보를 반환해야 한다', async () => {
      fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          expect(url).toContain('api/share-links/token-xyz');
          expect(init?.method).toBe('GET');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '여행 코스 공유 링크 조회 성공',
              data: {
                course: {
                  title: '서귀포 감성 힐링 코스',
                  destinationCountry: '대한민국',
                  destinationCity: '제주',
                  startDate: '2026-08-19',
                  totalDays: 3,
                },
                inviter: {
                  displayName: '김선규',
                  profileImageUrl: 'https://example.com/avatar.jpg',
                },
                expiresAt: '2026-08-17T10:00:00.000Z',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const result = await getShareLinkApi(API_URL, 'token-xyz');

      expect(result.course.title).toBe('서귀포 감성 힐링 코스');
      expect(result.inviter.displayName).toBe('김선규');
    });

    it('유효하지 않거나 만료된 링크인 경우(404/410) ApiError를 던져야 한다', async () => {
      fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            status: 404,
            message: '유효하지 않은 공유 링크입니다.',
            data: null,
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        );
      });

      await expect(getShareLinkApi(API_URL, 'invalid-token')).rejects.toThrow(
        ApiError,
      );
    });
  });

  describe('acceptShareLinkApi (API-SHARE-3)', () => {
    it('공유 링크 수락 성공 시 200 OK와 수락된 courseId를 반환해야 한다', async () => {
      fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(async (input: any, init: any) => {
          const url = typeof input === 'string' ? input : input.url;
          expect(url).toContain('api/share-links/token-xyz/accept');
          expect(init?.method).toBe('POST');
          expect(init?.headers?.Authorization).toBe('Bearer mock-access-token');

          return new Response(
            JSON.stringify({
              status: 200,
              message: '여행 코스 공유 수락 성공',
              data: {
                courseId: 'accepted-course-id-999',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        });

      const result = await acceptShareLinkApi(
        API_URL,
        'mock-access-token',
        'token-xyz',
      );

      expect(result.courseId).toBe('accepted-course-id-999');
    });

    it('이미 수락하였거나 본인의 링크인 경우(400) ApiError를 던져야 한다', async () => {
      fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            status: 400,
            message: '수락할 수 없는 공유 링크입니다.',
            data: null,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      });

      await expect(
        acceptShareLinkApi(API_URL, 'mock-access-token', 'token-xyz'),
      ).rejects.toThrow(ApiError);
    });
  });
});
