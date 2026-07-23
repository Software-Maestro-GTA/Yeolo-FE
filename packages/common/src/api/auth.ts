/**
 * @file auth.ts
 * @description Common authentication API services shared across Web and Mobile.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-1
 * @author Antigravity Agent
 */
import ky from 'ky';
import type { GoogleLoginPayload, GoogleLoginResponse, LogoutRequest, LogoutResponse } from '../types/auth';
import { ApiError } from './errors';

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

  const result = await response.json<GoogleLoginResponse>();

  if (!response.ok || result.status !== 200) {
    throw new ApiError(result.status || response.status, result.message || '인가 코드가 유효하지 않습니다.');
  }

  return result;
}

/**
 * Log out user session and invalidate refresh token (API-FB-11)
 */
async function logoutApi(
  apiUrl: string,
  token?: string,
  payload?: LogoutRequest
): Promise<LogoutResponse> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await ky.post(`${apiUrl}/api/auth/logout`, {
    headers,
    json: payload || {},
    throwHttpErrors: false,
  });

  const result = await response.json<LogoutResponse>();

  if (!response.ok || result.status !== 200) {
    throw new ApiError(result.status || response.status, result.message || '로그아웃 실패');
  }

  return result;
}

export { loginWithGoogleApi, logoutApi };
