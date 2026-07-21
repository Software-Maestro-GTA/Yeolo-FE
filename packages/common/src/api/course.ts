/**
 * @file course.ts
 * @description API service for initiating course generation SSE stream (API-FB-4).
 * @requirements REQ-7
 * @functional FUN-6
 * @api API-FB-4
 * @author Antigravity Agent
 */
import ky from 'ky';
import { parseServerSentEvents } from 'parse-sse';
import { ApiError } from './errors';
import type {
  CourseCreateRequest,
  CourseProgressEvent,
  CourseCompleteEvent,
} from '../types/course';

export interface CourseStreamCallbacks {
  onProgress?: (event: CourseProgressEvent) => void;
  onComplete?: (event: CourseCompleteEvent) => void;
}

/**
 * Sends POST /api/courses request and parses SSE progress & complete events.
 * 
 * @param apiUrl Base backend URL
 * @param accessToken User JWT access token
 * @param payload Course creation parameters
 * @param callbacks Event callbacks for progress and complete
 * @returns Generated courseId string
 */
export async function createCourseStreamApi(
  apiUrl: string,
  accessToken: string,
  payload: CourseCreateRequest,
  callbacks?: CourseStreamCallbacks
): Promise<string> {
  let courseId: string | undefined;

  try {
    const response = await ky.post(`${apiUrl}/api/courses`, {
      json: payload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: false,
    });

    const contentType = response.headers.get('content-type') || '';

    // If response is standard JSON (e.g., in mock/test environment without stream headers)
    if (contentType.includes('application/json')) {
      const json = await response.json<{
        status?: number;
        message?: string;
        data?: { courseId?: string };
      }>();

      if (response.status === 200 && json?.data?.courseId) {
        courseId = json.data.courseId;
        callbacks?.onComplete?.({
          status: 200,
          message: json.message || '여행 코스 생성 성공',
          data: { courseId: json.data.courseId },
        });
        return courseId;
      } else {
        throw new ApiError(
          response.status || 400,
          json?.message || '여행 코스 생성에 실패했습니다.'
        );
      }
    }

    // Process SSE stream
    for await (const event of parseServerSentEvents(response)) {
      if (!event.data) continue;

      try {
        const parsed = JSON.parse(event.data);
        if (event.type === 'progress') {
          callbacks?.onProgress?.(parsed as CourseProgressEvent);
        } else if (event.type === 'complete') {
          callbacks?.onComplete?.(parsed as CourseCompleteEvent);
          courseId = parsed.data?.courseId;
        }
      } catch (jsonError) {
        console.error('Error parsing SSE event in course generation:', jsonError);
      }
    }
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error?.response) {
      let status = 400;
      let message = '여행 코스 생성에 실패했습니다.';
      try {
        status = error.response.status;
        const json = await error.response.json();
        if (json?.message) message = json.message;
      } catch (_) {
        // Fallback message
      }
      throw new ApiError(status, message);
    }
    throw new ApiError(500, error?.message || '네트워크 오류가 발생했습니다.');
  }

  if (!courseId) {
    throw new ApiError(400, '여행 코스 생성이 완료되었으나 Course ID를 수신하지 못했습니다.');
  }

  return courseId;
}
