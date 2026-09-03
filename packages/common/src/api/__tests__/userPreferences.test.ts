/**
 * @file userPreferences.test.ts
 * @description Unit test for updatePreferencesApi (API-PREF-1).
 */
import { updatePreferencesApi } from '../user';
import { ApiError } from '../errors';

const API_URL = 'https://api.yeolo.com';

describe('updatePreferencesApi Unit Tests (API-PREF-1)', () => {
  let fetchSpy: any;

  afterEach(() => {
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });

  it('MBTI 값이 전송되었을 때 PATCH /api/users/me/preferences 200 OK 성공 응답을 반환해야 한다', async () => {
    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (input: any, init: any) => {
        const url = typeof input === 'string' ? input : input.url;
        expect(url).toContain('api/users/me/preferences');
        expect(init?.method).toBe('PATCH');

        const body = JSON.parse(init?.body || '{}');
        expect(body.mbti).toBe('ENFP');

        return new Response(
          JSON.stringify({
            status: 200,
            message: '사용자 MBTI 수정 성공',
            data: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      });

    const result = await updatePreferencesApi(API_URL, 'mock-access-token', {
      mbti: 'ENFP',
    });

    expect(result.status).toBe(200);
    expect(result.message).toBe('사용자 MBTI 수정 성공');
  });

  it('잘못된 MBTI 입력 시 400 ApiError를 던져야 한다', async () => {
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          status: 400,
          message: 'MBTI 입력값을 확인해주세요.',
          data: null,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    });

    await expect(
      updatePreferencesApi(API_URL, 'mock-access-token', { mbti: 'INVALID' }),
    ).rejects.toThrow(ApiError);
  });
});
