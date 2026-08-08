/**
 * @file auth.ts
 * @description Common authentication API services shared across Web and Mobile.
 */
import { createHttpClient } from './kyClient';

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
export async function loginWithGoogleApi(
  apiUrl: string,
  payload: GoogleLoginPayload,
): Promise<GoogleLoginResponse> {
  logger.info('[AuthAPI] loginWithGoogleApi request:', payload);
  const client = createHttpClient(apiUrl);
  const response = await client.post('api/auth/google', {
    json: payload,
  });

  const result = await response.json<GoogleLoginResponse>();

  if (!response.ok || result.status !== 200) {
    const errorStatus = result.status || response.status;
    const errorMessage = result.message || '인가 코드가 유효하지 않습니다.';
    logger.error(
      `[AuthAPI] loginWithGoogleApi error (${errorStatus}):`,
      errorMessage,
    );
    throw new ApiError(errorStatus, errorMessage);
  }

  return result;
}

/**
 * Sends authorization code and idToken to backend to complete Apple OAuth login (API-AUTH-2)
 */
export async function loginWithAppleApi(
  apiUrl: string,
  payload: AppleLoginPayload,
): Promise<AppleLoginResponse> {
  logger.info('[AuthAPI] loginWithAppleApi request:', payload);
  const client = createHttpClient(apiUrl);
  const response = await client.post('api/auth/apple', {
    json: payload,
  });

  const result = await response.json<AppleLoginResponse>();

  if (!response.ok || result.status !== 200) {
    const errorStatus = result.status || response.status;
    const errorMessage =
      result.message || '유효하지 않은 Apple OAuth 인가 코드입니다.';
    logger.error(
      `[AuthAPI] loginWithAppleApi error (${errorStatus}):`,
      errorMessage,
    );
    throw new ApiError(errorStatus, errorMessage);
  }

  return result;
}

/**
 * Log out user session and invalidate refresh token (API-FB-11)
 */
export async function logoutApi(
  apiUrl: string,
  token?: string,
  payload?: LogoutRequest,
): Promise<LogoutResponse> {
  logger.info('[AuthAPI] logoutApi request:', payload);
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const client = createHttpClient(apiUrl);
  const response = await client.post('api/auth/logout', {
    headers,
    json: payload || {},
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
