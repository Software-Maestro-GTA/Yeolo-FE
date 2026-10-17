/**
 * @file user.ts
 * @description Common user management and preference API services shared across Web and Mobile (API-USER-1~4, API-PREF-1~2).
 */
import {
  createHttpClient,
  getAcceptLanguage,
  setAcceptLanguage,
} from './kyClient';
import type { WithdrawRequest, WithdrawResponse } from '../types/auth';
import type {
  UpdatePreferencesPayload,
  UpdatePreferencesResponse,
  SavePhotoConsentPayload,
  SavePhotoConsentResponse,
  UpdateUserProfilePayload,
  UpdateUserProfileResponse,
  GetUserLanguageResponse,
  UpdateUserLanguagePayload,
  UpdateUserLanguageResponse,
} from '../types/user';
import { ApiError } from './errors';
import { logger } from '../utils/logger';

/**
 * Update user profile details like displayName and profileImage (API-USER-1).
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

  const formData = new FormData();
  if (payload) {
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

  const normalizedApiUrl = apiUrl.replace(/\/$/, '');
  const targetUrl = `${normalizedApiUrl}/api/users/me/profile`;
  const acceptLanguage = getAcceptLanguage();

  return new Promise<UpdateUserProfileResponse>((resolve, reject) => {
    if (typeof XMLHttpRequest !== 'undefined') {
      const xhr = new XMLHttpRequest();
      xhr.open('PATCH', targetUrl);
      xhr.setRequestHeader('Accept-Language', acceptLanguage);

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.onload = () => {
        try {
          const result = JSON.parse(
            xhr.responseText,
          ) as UpdateUserProfileResponse;
          if (xhr.status >= 200 && xhr.status < 300 && result.status === 200) {
            resolve(result);
          } else {
            const errorStatus = result.status || xhr.status;
            const errorMessage = result.message || '프로필 정보 수정 실패';
            logger.error(
              `[UserAPI] updateUserProfileApi error (${errorStatus}):`,
              errorMessage,
            );
            reject(new ApiError(errorStatus, errorMessage));
          }
        } catch (e) {
          reject(new ApiError(xhr.status || 500, '응답 데이터 파싱 실패'));
        }
      };

      xhr.onerror = () => {
        logger.error(
          `[UserAPI] updateUserProfileApi network error (${xhr.status})`,
        );
        reject(
          new ApiError(xhr.status || 500, '네트워크 오류가 발생했습니다.'),
        );
      };

      xhr.send(formData);
    } else {
      const headers: Record<string, string> = {
        'Accept-Language': acceptLanguage,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      fetch(targetUrl, {
        method: 'PATCH',
        headers,
        body: formData,
      })
        .then(async (res) => {
          const result = (await res
            .json()
            .catch(() => null)) as UpdateUserProfileResponse | null;
          if (res.ok && result?.status === 200) {
            resolve(result);
          } else {
            reject(
              new ApiError(
                result?.status || res.status || 500,
                result?.message || '프로필 정보 수정 실패',
              ),
            );
          }
        })
        .catch((err) =>
          reject(
            new ApiError(500, err?.message || '네트워크 오류가 발생했습니다.'),
          ),
        );
    }
  });
}

/**
 * Permanently delete user account and invalidate session (API-USER-2).
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
 * Fetch current user language setting (API-USER-3).
 *
 * @param apiUrl Base backend URL
 * @param token Optional JWT Access token
 */
export async function getUserLanguageApi(
  apiUrl: string,
  token?: string,
): Promise<GetUserLanguageResponse> {
  logger.info('[UserAPI] getUserLanguageApi request');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const client = createHttpClient(apiUrl);
  const response = await client.get('api/users/me/language', {
    headers,
  });

  const result = await response.json<GetUserLanguageResponse>();

  if (!response.ok || result.status !== 200 || !result.data) {
    const errorStatus = result?.status || response.status;
    const errorMessage = result?.message || '언어 정보 조회 실패';
    logger.error(
      `[UserAPI] getUserLanguageApi error (${errorStatus}):`,
      errorMessage,
    );
    throw new ApiError(errorStatus, errorMessage);
  }

  if (result.data.language) {
    setAcceptLanguage(result.data.language);
  }

  return result;
}

/**
 * Update user language setting (API-USER-4).
 *
 * @param apiUrl Base backend URL
 * @param token Optional JWT Access token
 * @param payload Language code payload
 */
export async function updateUserLanguageApi(
  apiUrl: string,
  token?: string,
  payload?: UpdateUserLanguagePayload,
): Promise<UpdateUserLanguageResponse> {
  logger.info('[UserAPI] updateUserLanguageApi request:', payload);
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const client = createHttpClient(apiUrl);
  const response = await client.post('api/users/me/language', {
    headers,
    json: payload,
  });

  const result = await response.json<UpdateUserLanguageResponse>();

  if (!response.ok || result.status !== 200 || !result.data) {
    const errorStatus = result?.status || response.status;
    const errorMessage = result?.message || '지원하지 않는 언어 코드입니다.';
    logger.error(
      `[UserAPI] updateUserLanguageApi error (${errorStatus}):`,
      errorMessage,
    );
    throw new ApiError(errorStatus, errorMessage);
  }

  if (result.data.language) {
    setAcceptLanguage(result.data.language);
  }

  return result;
}

/**
 * Register/Update user preferences including MBTI (API-PREF-1).
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
 * Save user consent for photo data analysis (API-PREF-2).
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
