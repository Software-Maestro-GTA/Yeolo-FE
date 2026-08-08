/**
 * @file user.ts
 * @description Common user management API services shared across Web and Mobile.
 */
import { createHttpClient } from './kyClient';
import type { WithdrawRequest, WithdrawResponse } from '../types/auth';
import type {
  UpdatePreferencesPayload,
  UpdatePreferencesResponse,
  SavePhotoConsentPayload,
  SavePhotoConsentResponse,
} from '../types/user';
import { ApiError } from './errors';
import { logger } from '../utils/logger';

/**
 * Permanently delete user account and invalidate session (API-USER-2)
 */
export async function withdrawApi(
  apiUrl: string,
  token?: string,
  payload?: WithdrawRequest,
): Promise<WithdrawResponse> {
  logger.info('[UserAPI] withdrawApi request:', payload);
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const requestOptions: Record<string, unknown> = {
    headers,
  };
  if (payload && Object.keys(payload).length > 0) {
    requestOptions.json = payload;
  }

  const client = createHttpClient(apiUrl);
  const response = await client.delete('api/users/me', requestOptions);

  const result = await response.json<WithdrawResponse>();

  if (!response.ok || result.status !== 200) {
    const errorStatus = result.status || response.status;
    const errorMessage = result.message || '회원탈퇴 실패';
    logger.error(`[UserAPI] withdrawApi error (${errorStatus}):`, errorMessage);
    throw new ApiError(errorStatus, errorMessage);
  }

  return result;
}

/**
 * Register/Update user preferences including MBTI (API-PREF-1)
 *
 * @param apiUrl Base backend URL
 * @param token Optional JWT Access token
 * @param payload MBTI update payload
 */
export async function updatePreferencesApi(
  apiUrl: string,
  token?: string,
  payload?: UpdatePreferencesPayload,
): Promise<UpdatePreferencesResponse> {
  logger.info('[UserAPI] updatePreferencesApi request:', payload);
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const client = createHttpClient(apiUrl);
  const response = await client.patch('api/users/me/preferences', {
    headers,
    json: payload,
  });

  const result = await response.json<UpdatePreferencesResponse>();

  if (!response.ok || result.status !== 200) {
    const errorStatus = result.status || response.status;
    const errorMessage = result.message || '사용자 MBTI 수정 실패';
    logger.error(
      `[UserAPI] updatePreferencesApi error (${errorStatus}):`,
      errorMessage,
    );
    throw new ApiError(errorStatus, errorMessage);
  }

  return result;
}

/**
 * Save user consent for photo data analysis (API-PREF-2)
 *
 * @param apiUrl Base backend URL
 * @param token Optional JWT Access token
 * @param payload Consent status and version payload
 */
export async function savePhotoConsentApi(
  apiUrl: string,
  token?: string,
  payload?: SavePhotoConsentPayload,
): Promise<SavePhotoConsentResponse> {
  logger.info('[UserAPI] savePhotoConsentApi request:', payload);
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const client = createHttpClient(apiUrl);
  const response = await client.post('api/users/me/consents/photo', {
    headers,
    json: payload,
  });

  const result = await response.json<SavePhotoConsentResponse>();

  if (!response.ok || result.status !== 200) {
    const errorStatus = result.status || response.status;
    const errorMessage = result.message || '사진 데이터 분석 동의 저장 실패';
    logger.error(
      `[UserAPI] savePhotoConsentApi error (${errorStatus}):`,
      errorMessage,
    );
    throw new ApiError(errorStatus, errorMessage);
  }

  return result;
}
