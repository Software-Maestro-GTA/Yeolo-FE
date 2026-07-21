/**
 * @file taste.ts
 * @description Shared taste analysis API service utilizing ky and parse-sse for progressive SSE streams.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-2
 * @author Antigravity Agent
 */
import ky from 'ky';
import { parseServerSentEvents } from 'parse-sse';
import type { AnalyzeTastePayload, StreamCallbacks, TasteProfile } from '../types/taste';
import { ApiError } from './errors';

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
    const response = await ky.post(`${apiUrl}/api/taste-profile/behavior`, {
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
        console.log('SSE Event:', parsed.step, parsed.message);
        if (event.type === 'progress') {
          callbacks.onProgress?.(parsed);
        } else if (event.type === 'complete') {
          callbacks.onComplete?.(parsed);
          tasteProfileId = parsed.data?.tasteProfileId;
        }
      } catch (jsonError) {
        console.error('Error parsing SSE event data:', jsonError);
      }
    }
  } catch (error: any) {
    if (error?.response) {
      const status = error.response.status;
      let message = '성향 분석 도중 오류가 발생했습니다.';
      try {
        const body = await error.response.json();
        if (body?.message) message = body.message;
      } catch (_) {
        // Fallback message
      }
      throw new ApiError(status, message);
    }
    throw new ApiError(500, error?.message || '성향 분석 도중 오류가 발생했습니다.');
  }

  if (!tasteProfileId) {
    throw new ApiError(400, '성향 분석이 완료되었으나 Profile ID를 수신하지 못했습니다.');
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
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const searchParams = tasteProfileId ? { tasteProfileId } : undefined;

    const json: any = await ky
      .get(`${apiUrl}/api/me/taste-profile`, {
        headers,
        searchParams,
      })
      .json();

    if (json?.data?.tasteProfile) {
      return json.data.tasteProfile;
    }

    throw new ApiError(400, '성향 프로필 데이터가 올바르지 않습니다.');
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    if (error?.response) {
      const status = error.response.status;
      let message = '성향 프로필을 불러오지 못했습니다.';
      try {
        const body = await error.response.json();
        if (body?.message) message = body.message;
      } catch (_) {
        // Fallback message
      }
      throw new ApiError(status, message);
    }

    throw new ApiError(500, error?.message || '네트워크 오류가 발생했습니다.');
  }
}
