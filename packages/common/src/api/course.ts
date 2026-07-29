/**
 * @file course.ts
 * @description API service for initiating course generation SSE stream (API-FB-4) and retrieving course details (API-FB-7).
 * @requirements REQ-7, REQ-9
 * @functional FUN-6, FUN-3
 * @api API-FB-4, API-FB-7
 * @author Antigravity Agent
 */
import ky from 'ky';
import { parseServerSentEvents } from 'parse-sse';
import { ApiError } from './errors';
import { logger } from '../utils/logger';
import type {
  CourseCreateRequest,
  CourseProgressEvent,
  CourseCompleteEvent,
  CourseDetail,
  CourseDetailApiResponse,
  CourseSummary,
  CourseListApiResponse,
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
    logger.info('[CourseAPI] createCourseStreamApi request:', payload.destinationCity);
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
        logger.error('[CourseAPI] Error parsing SSE event in course generation:', jsonError);
      }
    }
  } catch (error: any) {
    logger.error('[CourseAPI] createCourseStreamApi error:', error);
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
    logger.error('[CourseAPI] Course generation finished without courseId');
    throw new ApiError(400, '여행 코스 생성이 완료되었으나 Course ID를 수신하지 못했습니다.');
  }

  return courseId;
}

/**
 * Sends GET /api/courses/{courseId} request to retrieve course details and full itinerary.
 * 
 * @param apiUrl Base backend URL
 * @param accessToken User JWT access token
 * @param courseId Unique ID of the course to retrieve
 * @returns Promise resolving to CourseDetail object
 */
export async function getCourseDetailApi(
  apiUrl: string,
  accessToken: string,
  courseId: string
): Promise<CourseDetail> {
  try {
    logger.info('[CourseAPI] getCourseDetailApi request, courseId:', courseId);
    const response = await ky.get(`${apiUrl}/api/courses/${courseId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const json = (await response.json()) as CourseDetailApiResponse;

    if (json && json.data && json.data.course) {
      return json.data.course;
    }

    throw new ApiError(response.status || 500, json?.message || '여행 코스 정보를 찾을 수 없습니다.');
  } catch (error: any) {
    logger.error(`[CourseAPI] getCourseDetailApi error (courseId: ${courseId}):`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    if (error?.response) {
      let status = error.response.status || 400;
      let message = '여행 코스 정보를 불러오지 못했습니다.';
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
 * Sends GET /api/courses request to retrieve list of user's previously generated course recommendations.
 * 
 * @param apiUrl Base backend URL
 * @param accessToken User JWT access token
 * @returns Promise resolving to array of CourseSummary objects
 */
export async function getCourseListApi(
  apiUrl: string,
  accessToken: string
): Promise<CourseSummary[]> {
  try {
    logger.info('[CourseAPI] getCourseListApi request');
    const response = await ky.get(`${apiUrl}/api/courses`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const json = (await response.json()) as CourseListApiResponse;

    if (json && json.data && Array.isArray(json.data.courses)) {
      return json.data.courses;
    }

    throw new ApiError(response.status || 500, json?.message || '코스 목록을 불러올 수 없습니다.');
  } catch (error: any) {
    logger.error('[CourseAPI] getCourseListApi error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    if (error?.response) {
      let status = error.response.status || 400;
      let message = '코스 목록을 불러오지 못했습니다.';
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

