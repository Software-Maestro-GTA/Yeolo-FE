/**
 * @file share.ts
 * @description API service functions for creating, retrieving, and accepting course share links (API-SHARE-1, API-SHARE-2, API-SHARE-3).
 */
import { createHttpClient } from './kyClient';
import { ApiError } from './errors';
import { logger } from '../utils/logger';
import type {
  ShareLinkCreateResponseData,
  ShareLinkCreateApiResponse,
  ShareLinkDetailResponseData,
  ShareLinkDetailApiResponse,
  ShareLinkAcceptResponseData,
  ShareLinkAcceptApiResponse,
} from '../types/share';

/**
 * Creates a travel course share link (API-SHARE-1).
 *
 * @param apiUrl Base backend URL
 * @param token User JWT access token
 * @param courseId ID of the course to share
 * @returns Promise resolving to ShareLinkCreateResponseData
 */
export async function createShareLinkApi(
  apiUrl: string,
  token: string,
  courseId: string,
): Promise<ShareLinkCreateResponseData> {
  logger.info('[ShareAPI] createShareLinkApi request, courseId:', courseId);
  try {
    const client = createHttpClient(apiUrl);
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await client.post(`api/courses/${courseId}/share-links`, {
      headers,
      json: {},
    });

    const json = (await response
      .json()
      .catch(() => null)) as ShareLinkCreateApiResponse | null;
    logger.info(
      '[ShareAPI] createShareLinkApi response status:',
      response.status,
      'body:',
      json,
    );

    if (response.ok && json && json.data) {
      return json.data;
    }

    const errorStatus = json?.status || response.status || 500;
    const errorMessage =
      json?.message || '해당 여행 코스를 공유할 권한이 없습니다.';
    throw new ApiError(errorStatus, errorMessage);
  } catch (error: any) {
    logger.error(`[ShareAPI] createShareLinkApi error:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    if (error?.response) {
      let status = error.response.status || 400;
      let message = '여행 코스 공유 링크 생성 실패';
      try {
        const json = await error.response.json();
        if (json?.message) message = json.message;
      } catch (_) {
        // Fallback message
      }
      throw new ApiError(status, message);
    }
    throw new ApiError(500, error?.message || '네트워크 오류가 발생했습니다.');
  }
}

/**
 * Retrieves details of a shared course link (API-SHARE-2).
 *
 * @param apiUrl Base backend URL
 * @param shareToken Share token string
 * @returns Promise resolving to ShareLinkDetailResponseData
 */
export async function getShareLinkApi(
  apiUrl: string,
  shareToken: string,
): Promise<ShareLinkDetailResponseData> {
  logger.info('[ShareAPI] getShareLinkApi request, shareToken:', shareToken);
  try {
    const client = createHttpClient(apiUrl);
    const response = await client.get(`api/share-links/${shareToken}`);

    const json = (await response
      .json()
      .catch(() => null)) as ShareLinkDetailApiResponse | null;
    logger.info(
      '[ShareAPI] getShareLinkApi response status:',
      response.status,
      'body:',
      json,
    );

    if (response.ok && json && json.data) {
      return json.data;
    }

    const errorStatus = json?.status || response.status || 500;
    const errorMessage = json?.message || '유효하지 않은 공유 링크입니다.';
    throw new ApiError(errorStatus, errorMessage);
  } catch (error: any) {
    logger.error(`[ShareAPI] getShareLinkApi error:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    if (error?.response) {
      let status = error.response.status || 400;
      let message = '유효하지 않은 공유 링크입니다.';
      try {
        const json = await error.response.json();
        if (json?.message) message = json.message;
      } catch (_) {
        // Fallback message
      }
      throw new ApiError(status, message);
    }
    throw new ApiError(500, error?.message || '네트워크 오류가 발생했습니다.');
  }
}

/**
 * Accepts a shared course link and saves it to user's course list (API-SHARE-3).
 *
 * @param apiUrl Base backend URL
 * @param token User JWT access token
 * @param shareToken Share token string
 * @returns Promise resolving to ShareLinkAcceptResponseData
 */
export async function acceptShareLinkApi(
  apiUrl: string,
  token: string,
  shareToken: string,
): Promise<ShareLinkAcceptResponseData> {
  logger.info('[ShareAPI] acceptShareLinkApi request, shareToken:', shareToken);
  try {
    const client = createHttpClient(apiUrl);
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await client.post(`api/share-links/${shareToken}/accept`, {
      headers,
      json: {},
    });

    const json = (await response
      .json()
      .catch(() => null)) as ShareLinkAcceptApiResponse | null;
    logger.info(
      '[ShareAPI] acceptShareLinkApi response status:',
      response.status,
      'body:',
      json,
    );

    if (response.ok && json && json.data) {
      return json.data;
    }

    const errorStatus = json?.status || response.status || 500;
    const errorMessage = json?.message || '수락할 수 없는 공유 링크입니다.';
    throw new ApiError(errorStatus, errorMessage);
  } catch (error: any) {
    logger.error(`[ShareAPI] acceptShareLinkApi error:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    if (error?.response) {
      let status = error.response.status || 400;
      let message = '수락할 수 없는 공유 링크입니다.';
      try {
        const json = await error.response.json();
        if (json?.message) message = json.message;
      } catch (_) {
        // Fallback message
      }
      throw new ApiError(status, message);
    }
    throw new ApiError(500, error?.message || '네트워크 오류가 발생했습니다.');
  }
}
