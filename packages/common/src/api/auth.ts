/**
 * @file auth.ts
 * @description Common authentication API services shared across Web and Mobile.
 * @requirements REQ-1, REQ-11
 * @functional FUN-1
 * @api API-AUTH-1, API-AUTH-2
 * @author Antigravity Agent
 */
import ky from 'ky';
import type {
  GoogleLoginPayload,
  GoogleLoginResponse,
  AppleLoginPayload,
  AppleLoginResponse,
  LogoutRequest,
  LogoutResponse,
} from '../types/auth';
import { ApiError } from './errors';
import { logger } from '../utils/logger';

/**
 * Sends authorization code to backend to complete Google OAuth login
 */
async function loginWithGoogleApi(
  apiUrl: string,
  payload: GoogleLoginPayload
): Promise<GoogleLoginResponse> {
  logger.info('[AuthAPI] loginWithGoogleApi request:', payload);
  const response = await ky.post(`${apiUrl}/api/auth/google`, {
    json: payload,
    throwHttpErrors: false,
  });

  const result = await response.json<GoogleLoginResponse>();

  if (!response.ok || result.status !== 200) {
    const errorStatus = result.status || response.status;
    const errorMessage = result.message || '인가 코드가 유효하지 않습니다.';
    logger.error(`[AuthAPI] loginWithGoogleApi error (${errorStatus}):`, errorMessage);
    throw new ApiError(errorStatus, errorMessage);
  }

  return result;
}

/**
 * Sends authorization code and idToken to backend to complete Apple OAuth login (API-AUTH-2)
 */
async function loginWithAppleApi(
  apiUrl: string,
  payload: AppleLoginPayload
): Promise<AppleLoginResponse> {
  logger.info('[AuthAPI] loginWithAppleApi request:', payload);
  const response = await ky.post(`${apiUrl}/api/auth/apple`, {
    json: payload,
    throwHttpErrors: false,
  });

  const result = await response.json<AppleLoginResponse>();

  if (!response.ok || result.status !== 200) {
    const errorStatus = result.status || response.status;
    const errorMessage = result.message || '유효하지 않은 Apple OAuth 인가 코드입니다.';
    logger.error(`[AuthAPI] loginWithAppleApi error (${errorStatus}):`, errorMessage);
    throw new ApiError(errorStatus, errorMessage);
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
  logger.info('[AuthAPI] logoutApi request:', payload);
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
    const errorStatus = result.status || response.status;
    const errorMessage = result.message || '로그아웃 실패';
    logger.error(`[AuthAPI] logoutApi error (${errorStatus}):`, errorMessage);
    throw new ApiError(errorStatus, errorMessage);
  }

  return result;
}

export { loginWithGoogleApi, loginWithAppleApi, logoutApi };

