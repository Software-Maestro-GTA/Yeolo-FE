/**
 * @file taste.ts
 * @description Shared taste analysis API service utilizing ky and parse-sse for progressive SSE streams.
 */
import { createHttpClient } from './kyClient';
import { parseServerSentEvents } from 'parse-sse';
import type { AnalyzeTastePayload, StreamCallbacks, TasteProfile } from '../types/taste';
import { ApiError } from './errors';
import { logger } from '../utils/logger';


export interface TasteProfileApiResponse {
  status: number;
  message: string;
  data: {
    tasteProfile: TasteProfile;
  };
}

/**
 * Initiates the taste preference analysis SSE stream based on photo metadata.
 * 
 * @param apiUrl Base backend URL
 * @param accessToken User JWT access token
 * @param payload Photo metadata array
 * @param callbacks Event listeners for stream updates
 */
export async function analyzeTastePreferenceStream(
  apiUrl: string,
  accessToken: string,
  payload: AnalyzeTastePayload,
  callbacks: StreamCallbacks
): Promise<string> {
  let tasteProfileId: string | undefined;

  try {
    logger.info('[TasteAPI] analyzeTastePreferenceStream request, images count:', payload.images?.length);
    const client = createHttpClient(apiUrl);
    const response = await client.post('api/taste-profile/behavior', {
      json: payload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      // Disable default timeout to support long-lived AI analysis streams
      timeout: false,
    });



    // Parse the Server-Sent Events stream from the Response object
    for await (const event of parseServerSentEvents(response)) {
      if (!event.data) continue;

      try {
        const parsed = JSON.parse(event.data);
        if (event.type === 'progress') {
          callbacks.onProgress?.(parsed);
        } else if (event.type === 'complete') {
          callbacks.onComplete?.(parsed);
          tasteProfileId = parsed.data?.tasteProfileId;
        }
      } catch (jsonError) {
        logger.error('[TasteAPI] Error parsing SSE event data:', jsonError);
      }
    }
  } catch (error: unknown) {
    logger.error('[TasteAPI] analyzeTastePreferenceStream error:', error);
    const err = error as { response?: Response; message?: string };
    if (err?.response) {
      const status = err.response.status;
      let message = '성향 분석 도중 오류가 발생했습니다.';
      try {
        const body = await err.response.json();
        if (body?.message) message = body.message;
      } catch (_) {
        // Fallback message
      }
      throw new ApiError(status, message);
    }
    throw new ApiError(500, err?.message || '성향 분석 도중 오류가 발생했습니다.');
  }

  if (!tasteProfileId) {
    logger.error('[TasteAPI] Stream completed without tasteProfileId');
    throw new ApiError(400, '성향 분석 중 Profile ID를 수신하지 못했습니다.');
  }

  return tasteProfileId;
}

/**
 * Fetches user taste profile from backend (API-FB-8).
 * Supports optional tasteProfileId query parameter using ky HTTP client.
 * 
 * @param apiUrl Base backend URL
 * @param accessToken User JWT access token
 * @param tasteProfileId Optional taste profile ID parameter
 */
export async function fetchTasteProfileApi(
  apiUrl: string,
  accessToken?: string,
  tasteProfileId?: string
): Promise<TasteProfile> {
  try {
    logger.info('[TasteAPI] fetchTasteProfileApi request:', { tasteProfileId });
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const searchParams = tasteProfileId ? { tasteProfileId } : undefined;

    const client = createHttpClient(apiUrl);
    const response = await client.get('api/me/taste-profile', {
      headers,
      searchParams,
    });

    const json = await response.json<TasteProfileApiResponse>();


    if (json?.data?.tasteProfile) {
      logger.info('[TasteAPI] Successfully retrieved TasteProfile:', json.data.tasteProfile.tasteProfileId);
      return json.data.tasteProfile;
    }

    throw new ApiError(400, '성향 프로필 데이터가 올바르지 않습니다.');
  } catch (error: unknown) {
    logger.error('[TasteAPI] fetchTasteProfileApi error:', error);
    if (error instanceof ApiError) throw error;

    const err = error as { response?: Response; message?: string };
    if (err?.response) {
      const status = err.response.status;
      let message = '성향 프로필을 불러오지 못했습니다.';
      try {
        const body = await err.response.json();
        if (body?.message) message = body.message;
      } catch (_) {
        // Fallback message
      }
      throw new ApiError(status, message);
    }

    throw new ApiError(500, err?.message || '네트워크 오류가 발생했습니다.');
  }
}
