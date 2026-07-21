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
import type { AnalyzeTastePayload, StreamCallbacks } from '../types/taste';

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

  if (!tasteProfileId) {
    throw new Error('성향 분석이 완료되었으나 Profile ID를 수신하지 못했습니다.');
  }

  return tasteProfileId;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/**
 * Fetches user taste profile from backend (API-FB-8).
 * 
 * @param apiUrl Base backend URL
 * @param accessToken User JWT access token
 */
export async function fetchTasteProfileApi(
  apiUrl: string,
  accessToken?: string
): Promise<import('../types/taste').TasteProfile> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${apiUrl}/api/me/taste-profile`, {
      method: 'GET',
      headers,
    });

    const json = await response.json();

    if (response.status === 200 && json?.data?.tasteProfile) {
      return json.data.tasteProfile;
    }

    throw new ApiError(response.status, json?.message || '성향 프로필 조회 실패');
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error?.message || '서버 에러가 발생했습니다.');
  }
}

