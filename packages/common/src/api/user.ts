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
  UpdateUserProfilePayload,
  UpdateUserProfileResponse,
} from '../types/user';
import { ApiError } from './errors';
import { logger } from '../utils/logger';

/**
 * Update user profile details like displayName and profileImageUrl (API-USER-1)
 *
 * @param apiUrl Base backend URL
 * @param token Optional JWT Access token
 * @param payload Profile update payload
 */
export async function updateUserProfileApi(
  apiUrl: string,
  token?: string,
  payload?: UpdateUserProfilePayload,
): Promise<UpdateUserProfileResponse> {
  logger.info('[UserAPI] updateUserProfileApi request:', payload);

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const client = createHttpClient(apiUrl);

  const formData = new FormData();
  if (payload) {
    if (payload.email !== undefined && payload.email !== null) {
      formData.append('email', payload.email);
    }
    if (payload.displayName !== undefined && payload.displayName !== null) {
      formData.append('displayName', payload.displayName);
    }
    if (payload.profileImage) {
      if (typeof payload.profileImage === 'string') {
        const filename = payload.profileImage.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('profileImage', {
          uri: payload.profileImage,
          name: filename,
          type,
        } as any);
      } else {
        formData.append('profileImage', payload.profileImage as any);
      }
    }
  }

  const response = await client.patch('api/users/me/profile', {
    headers,
    body: formData,
  });

  const result = await response.json<UpdateUserProfileResponse>();

  if (!response.ok || result.status !== 200) {
    const errorStatus = result.status || response.status;
    const errorMessage = result.message || '프로필 정보 수정 실패';
    logger.error(
      `[UserAPI] updateUserProfileApi error (${errorStatus}):`,
      errorMessage,
    );
    throw new ApiError(errorStatus, errorMessage);
  }

  return result;
}

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
