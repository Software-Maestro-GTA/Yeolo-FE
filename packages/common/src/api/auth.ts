/**
 * @file auth.ts
 * @description Common authentication API services shared across Web and Mobile.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-1
 * @author Antigravity Agent
 */
import ky from 'ky';
import type { GoogleLoginPayload, GoogleLoginResponse } from '../types/auth';

/**
 * Sends authorization code to backend to complete Google OAuth login
 */
async function loginWithGoogleApi(
  apiUrl: string,
  payload: GoogleLoginPayload
): Promise<GoogleLoginResponse> {
  const response = await ky.post(`${apiUrl}/api/auth/google`, {
    json: payload,
    throwHttpErrors: false,
  });

  const result: GoogleLoginResponse = await response.json() as any;

  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || '인가 코드가 유효하지 않습니다.');
  }

  return result;
}

export { loginWithGoogleApi };
