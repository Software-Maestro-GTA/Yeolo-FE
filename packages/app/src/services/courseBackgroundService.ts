/**
 * @file courseBackgroundService.ts
 * @description Protects the shared course SSE request with a native execution lease independent of screen lifecycle.
 */
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import {
  createCourseStreamApi,
  logger,
  type CourseStreamCallbacks,
  type CourseCreateRequest,
} from '@yeolo/common';
import { UI_STRINGS } from '../constants/strings';

interface CourseBackgroundModule {
  startAsync(
    jobId: string,
    title: string,
    message: string,
    channel: string,
  ): Promise<string>;
  updateAsync(
    jobId: string,
    message: string,
    completed: number,
    total: number,
  ): Promise<void>;
  finishAsync(jobId: string, success: boolean): Promise<void>;
  addListener(
    event: 'onExpired',
    listener: (event: { jobId: string }) => void,
  ): { remove(): void };
}

/**
 * Acquires native background execution before sending the existing authenticated course request.
 * @param apiUrl Backend URL
 * @param accessToken Access token passed to the common API
 * @param payload Travel conditions
 * @param callbacks Store progress and completion callbacks
 * @returns Generated course ID; rejects on API failure, unavailable execution, or OS cancellation
 */
export async function createBackgroundCourseStreamApi(
  apiUrl: string,
  accessToken: string,
  payload: CourseCreateRequest,
  callbacks?: CourseStreamCallbacks,
): Promise<string> {
  if (Platform.OS === 'web')
    return createCourseStreamApi(apiUrl, accessToken, payload, callbacks);
  const native = requireOptionalNativeModule<CourseBackgroundModule>(
    'YeoloCourseBackground',
  );
  const strings = UI_STRINGS.COURSE_GENERATING;
  if (!native) throw new Error(strings.BACKGROUND_UNAVAILABLE);

  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const controller = new AbortController();
  let expired = false;
  let completed = false;
  let mode = '';
  const subscription = native.addListener('onExpired', (event) => {
    if (event.jobId !== jobId || completed) return;
    expired = true;
    controller.abort();
  });

  try {
    try {
      mode = await native.startAsync(
        jobId,
        strings.BACKGROUND_TITLE,
        strings.BACKGROUND_MESSAGE,
        strings.BACKGROUND_CHANNEL,
      );
    } catch (error) {
      logger.error('[CourseBackground] Could not acquire execution:', error);
      throw new Error(strings.BACKGROUND_START_ERROR);
    }
    if (expired) throw new Error(strings.BACKGROUND_EXPIRED);
    logger.info('[CourseBackground] Started', jobId, Platform.OS, mode);
    const courseId = await createCourseStreamApi(
      apiUrl,
      accessToken,
      payload,
      {
        onProgress: (event) => {
          callbacks?.onProgress?.(event);
          // Report completed work from real server events, never from the visual progress animation.
          const units = event.step === 'GENERATING_COURSE' ? 1 : 0;
          void native
            .updateAsync(jobId, event.message, units, 2)
            .catch((error) => {
              logger.warn(
                '[CourseBackground] Could not update progress:',
                error,
              );
            });
        },
        onComplete: (event) => {
          completed = true;
          callbacks?.onComplete?.(event);
        },
      },
      { signal: controller.signal },
    );
    completed = true;
    return courseId;
  } catch (error) {
    if (expired) throw new Error(strings.BACKGROUND_EXPIRED);
    throw error;
  } finally {
    subscription.remove();
    // Cleanup failures must not overwrite the API outcome.
    try {
      await native.finishAsync(jobId, completed);
    } catch (error) {
      logger.error('[CourseBackground] Could not release execution:', error);
    }
    logger.info('[CourseBackground] Finished', jobId, completed);
  }
}
