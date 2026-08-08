/**
 * @file photoConsent.test.ts
 * @description Unit tests for savePhotoConsentApi function (API-PREF-2).
 */
import { savePhotoConsentApi } from '../user';
import { ApiError } from '../errors';

const API_URL = 'https://api.yeolo.com';

describe('savePhotoConsentApi Unit Tests (API-PREF-2)', () => {
  let fetchSpy: any;

  afterEach(() => {
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });

  it('동의 상태 및 버전이 전송되었을 때 POST /api/users/me/consents/photo 200 OK 성공 응답을 반환해야 한다', async () => {
    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (input: any, init: any) => {
        const url = typeof input === 'string' ? input : input.url;
        expect(url).toContain('api/users/me/consents/photo');
        expect(init?.method).toBe('POST');

        const body = JSON.parse(init?.body || '{}');
        expect(body.agreed).toBe(true);
        expect(body.consentVersion).toBe('v1.0');

        return new Response(
          JSON.stringify({
            status: 200,
            message: '사진 데이터 분석 동의 저장 성공',
            data: {
              consent: {
                agreed: true,
                agreedAt: '2026-08-08T10:00:00.000Z',
                consentVersion: 'v1.0',
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      });

    const result = await savePhotoConsentApi(API_URL, 'mock-access-token', {
      agreed: true,
      consentVersion: 'v1.0',
    });

    expect(result.status).toBe(200);
    expect(result.message).toBe('사진 데이터 분석 동의 저장 성공');
    expect(result.data.consent.agreed).toBe(true);
    expect(result.data.consent.consentVersion).toBe('v1.0');
  });

  it('잘못된 입력값 전달 시 400 ApiError를 던져야 한다', async () => {
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          status: 400,
          message: '사진 데이터 분석 동의 입력값을 확인해주세요.',
          data: null,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    });

    await expect(
      savePhotoConsentApi(API_URL, 'mock-access-token', {
        agreed: true,
        consentVersion: '',
      }),
    ).rejects.toThrow(ApiError);
  });
});
