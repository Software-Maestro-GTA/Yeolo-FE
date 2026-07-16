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
];
