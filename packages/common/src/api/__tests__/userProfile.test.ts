/**
 * @file userProfile.test.ts
 * @description Unit tests for updateUserProfileApi function (API-USER-1).
 */
import { updateUserProfileApi } from '../user';
import { ApiError } from '../errors';

const API_URL = 'https://api.yeolo.com';

describe('updateUserProfileApi Unit Tests (API-USER-1)', () => {
  let fetchSpy: any;

  afterEach(() => {
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });

  it('displayName과 profileImage가 전송되었을 때 FormData에 email 없이 정상 포함하여 PATCH /api/users/me/profile 성공 응답을 반환해야 한다', async () => {
    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (input: any, init: any) => {
        const url = typeof input === 'string' ? input : input.url;
        expect(url).toContain('api/users/me/profile');
        expect(init?.method).toBe('PATCH');

        const formData = init?.body as FormData;
        expect(formData).toBeDefined();
        // Check that email is not present in FormData
        expect(formData.get('email')).toBeNull();
        expect(formData.get('displayName')).toBe('새닉네임');

        return new Response(
          JSON.stringify({
            status: 200,
            message: '사용자 프로필 수정 성공',
            data: {
              user: {
                userId: '550e8400-e29b-41d4-a716-446655440000',
                provider: 'google',
                email: 'user@gmail.com',
                displayName: '새닉네임',
                profileImageUrl: 'https://images.unsplash.com/avatar.jpg',
                status: 'active',
                lastLoginAt: '2026-08-15T00:00:00Z',
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      });

    const result = await updateUserProfileApi(API_URL, 'mock-access-token', {
      displayName: '새닉네임',
      profileImage: null,
    });

    expect(result.status).toBe(200);
    expect(result.message).toBe('사용자 프로필 수정 성공');
    expect(result.data.user.displayName).toBe('새닉네임');
  });

  it('서버에서 400 에러를 반환하는 경우 ApiError를 발생시켜야 한다', async () => {
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          status: 400,
          message: '사용자 프로필 입력값을 확인해주세요.',
          data: null,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    });

    await expect(
      updateUserProfileApi(API_URL, 'mock-access-token', {
        displayName: '   ',
        profileImage: null,
      }),
    ).rejects.toThrow(ApiError);
  });
});
