/**
 * @file taste.ts
 * @description Shared taste analysis API with terminal SSE completion, bounded idle waits, and profile retrieval (API-PREF-3, API-PREF-4).
 */
import { createHttpClient, getAcceptLanguage } from './kyClient';
import { parseServerSentEvents, type ServerSentEvent } from 'parse-sse';
import type {
  AnalyzeTastePayload,
  StreamCallbacks,
  TasteProfile,
  TasteProfileApiResponse,
} from '../types/taste';
import { ApiError } from './errors';
import { logger } from '../utils/logger';

export type { TasteProfileApiResponse } from '../types/taste';

const TASTE_STREAM_IDLE_TIMEOUT_MS = 120_000;
const TASTE_STREAM_TIMEOUT_MESSAGE =
  '취향 분석 응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.';

/**
 * Initiates the taste preference analysis SSE stream based on photo metadata (API-PREF-3).
 *
 * @param apiUrl Base backend URL
 * @param accessToken User JWT access token
 * @param payload Photo metadata array
 * @param callbacks Event listeners for stream updates
 * @returns The profile ID as soon as a successful completion event is received
 * @throws ApiError for server rejection, missing completion, or an idle timeout
 */
export async function analyzeTastePreferenceStream(
  apiUrl: string,
  accessToken: string,
  payload: AnalyzeTastePayload,
  callbacks: StreamCallbacks,
): Promise<string> {
  logger.info(
    '[TasteAPI] analyzeTastePreferenceStream request, images count:',
    payload.images?.length,
  );
  const normalizedUrl = apiUrl.replace(/\/$/, '');
  const headers: Record<string, string> = {
    'Accept-Language': getAcceptLanguage(),
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const requestBody: AnalyzeTastePayload = {
    images: (payload.images || []).map((img) => ({
      sourceImageId: img.sourceImageId,
      capturedAt: img.capturedAt,
      latitude: img.latitude,
      longitude: img.longitude,
    })),
  };

  const controller = new AbortController();
  let reader: ReadableStreamDefaultReader<ServerSentEvent> | undefined;
  const waitForResponse = async <T>(pending: Promise<T>): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new ApiError(504, TASTE_STREAM_TIMEOUT_MESSAGE));
      }, TASTE_STREAM_IDLE_TIMEOUT_MS);
    });
    try {
      return await Promise.race([pending, timeout]);
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    const response = await waitForResponse(
      fetch(`${normalizedUrl}/api/users/me/taste-profile/analysis`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }),
    );

    if (!response.ok) {
      let errorStatus = response.status;
      let errorMessage =
        '사진 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.';
      try {
        const errorBody = await waitForResponse(response.json());
        if (errorBody?.status) errorStatus = errorBody.status;
        if (errorBody?.message) errorMessage = errorBody.message;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        // An unreadable error body uses the HTTP status and fallback message.
      }
      throw new ApiError(errorStatus, errorMessage);
    }

    reader = parseServerSentEvents(response).getReader();
    while (true) {
      const { done, value: event } = await waitForResponse(reader.read());
      if (done) break;
      if (!event.data) continue;

      let parsed;
      try {
        parsed = JSON.parse(event.data);
      } catch (error) {
        logger.error('[TasteAPI] Error parsing SSE event data:', error);
        continue;
      }
      if (!parsed || typeof parsed !== 'object') continue;
      const extractedId =
        parsed.data?.tasteProfileId ||
        parsed.tasteProfileId ||
        parsed.data?.id ||
        parsed.id;

      if (event.type === 'progress' || parsed.step) {
        callbacks.onProgress?.(parsed);
      }

      if (event.type === 'complete' || extractedId) {
        if (parsed.status !== undefined && parsed.status !== 200) {
          throw new ApiError(
            parsed.status || 500,
            parsed.message ||
              '사진 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          );
        }
        if (typeof extractedId !== 'string' || !extractedId.trim()) {
          throw new ApiError(
            400,
            '성향 분석 중 Profile ID를 수신하지 못했습니다.',
          );
        }
        callbacks.onComplete?.(parsed);
        return extractedId;
      }
    }

    logger.error('[TasteAPI] Stream completed without tasteProfileId');
    throw new ApiError(400, '성향 분석 중 Profile ID를 수신하지 못했습니다.');
  } finally {
    // Cleanup must not wait for server EOF or replace an already completed result.
    if (reader) {
      try {
        void reader.cancel().catch(() => undefined);
        reader.releaseLock();
      } catch (error) {
        logger.warn('[TasteAPI] Could not release the analysis reader:', error);
      }
    }
    controller.abort();
  }
}

/**
 * Fetches user taste profile from backend (API-PREF-4).
 *
 * @param apiUrl Base backend URL
 * @param accessToken User JWT access token
 */
export async function fetchTasteProfileApi(
  apiUrl: string,
  accessToken?: string,
  _tasteProfileId?: string,
): Promise<TasteProfile> {
  try {
    logger.info('[TasteAPI] fetchTasteProfileApi request');
    const client = createHttpClient(apiUrl);
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await client.get('api/users/me/taste-profile', {
      headers,
    });

    const result = (await response
      .json()
      .catch(() => null)) as TasteProfileApiResponse | null;

    if (response.ok && result?.status === 200 && result.data) {
      logger.info('[TasteAPI] Successfully retrieved TasteProfile');
      return result.data;
    }

    const errorStatus = result?.status || response.status || 400;
    const errorMessage = result?.message || '저장된 성향 프로필이 없습니다.';
    throw new ApiError(errorStatus, errorMessage);
  } catch (error: unknown) {
    logger.error('[TasteAPI] fetchTasteProfileApi error:', error);
    if (error instanceof ApiError) throw error;

    const err = error as { response?: Response; message?: string };
    if (err?.response) {
      const status = err.response.status;
      let message = '저장된 성향 프로필이 없습니다.';
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
