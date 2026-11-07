/**
 * @file kyClient.ts
 * @description Shared language/version headers, HTTP 426 update handling, and single-flight authentication refresh.
 */
import ky, { type KyInstance, type Options } from 'ky';
import type { RefreshTokenResponse } from '../types/auth';
import { ApiError, AppVersionMismatchError } from './errors';
import { logger } from '../utils/logger';

export type TokenGetter = () => Promise<{
  accessToken?: string | null;
  refreshToken?: string | null;
}>;
export type TokenSetter = (
  accessToken: string,
  refreshToken: string,
) => Promise<void>;
export type UnauthorizedHandler = () => void | Promise<void>;

let globalTokenGetter: TokenGetter | null = null;
let globalTokenSetter: TokenSetter | null = null;
let globalUnauthorizedHandler: UnauthorizedHandler | null = null;
let globalAcceptLanguage = 'ko';
let globalAppVersion = '';
let globalVersionMismatchHandler:
  ((error: AppVersionMismatchError) => void | Promise<void>) | null = null;

/** Sets the running platform's release version before its first API request. */
export function setAppVersion(version: string): void {
  globalAppVersion = version.trim();
}

/** Returns the configured release version for native upload and streaming transports. */
export function getAppVersion(): string {
  return globalAppVersion;
}

/** Registers platform update guidance; null removes the handler on teardown. */
export function setVersionMismatchHandler(
  handler: ((error: AppVersionMismatchError) => void | Promise<void>) | null,
): void {
  globalVersionMismatchHandler = handler;
}

function injectAppVersion(request: Request): void {
  if (globalAppVersion && !request.headers.has('X-App-Version')) {
    request.headers.set('X-App-Version', globalAppVersion);
  }
}

async function checkAppVersion(response: Response): Promise<void> {
  if (response.status !== 426) return;
  const result: unknown = await response
    .clone()
    .json()
    .catch(() => null);
  await assertCompatibleAppVersion(response.status, result);
}

/**
 * Applies the same HTTP 426 contract to transports that cannot use ky (native uploads/SSE).
 * @param status HTTP response status, independent of a JSON envelope's status field.
 * @param result Parsed error body, or null when the server did not send JSON.
 * @throws AppVersionMismatchError after notifying the platform update handler on HTTP 426.
 */
export async function assertCompatibleAppVersion(
  status: number,
  result?: unknown,
): Promise<void> {
  if (status !== 426) return;
  const message =
    result &&
    typeof result === 'object' &&
    'message' in result &&
    typeof result.message === 'string' &&
    result.message.trim()
      ? result.message
      : undefined;
  const error = new AppVersionMismatchError(message);
  try {
    await globalVersionMismatchHandler?.(error);
  } catch (handlerError) {
    logger.error('[HttpClient] Update notice handler failed:', handlerError);
  }
  throw error;
}

let refreshPromise: Promise<{
  accessToken: string;
  refreshToken: string;
}> | null = null;

/**
 * Configure global token getter callback.
 * @param getter Function returning stored access and refresh tokens.
 */
export function setTokenGetter(getter: TokenGetter): void {
  globalTokenGetter = getter;
}

/**
 * Configure global token setter callback.
 * @param setter Function updating stored access and refresh tokens.
 */
export function setTokenSetter(setter: TokenSetter): void {
  globalTokenSetter = setter;
}

/**
 * Configure global 401 unauthorized error callback handler.
 * @param handler Function executing session cleanup and redirect to login.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  globalUnauthorizedHandler = handler;
}

/**
 * Configure default Accept-Language header value for API requests.
 * @param language BCP 47 language code (defaults to 'ko').
 */
export function setAcceptLanguage(language: string): void {
  globalAcceptLanguage = language || 'ko';
}

/**
 * Retrieve current default Accept-Language header value.
 * @returns Current BCP 47 language code.
 */
export function getAcceptLanguage(): string {
  return globalAcceptLanguage;
}

/**
 * Execute POST /api/auth/refresh API request to renew access token using refresh token (API-AUTH-3).
 *
 * @param apiUrl Base backend URL
 * @param refreshToken Stored JWT refresh token
 * @returns Promise resolving to RefreshTokenResponse
 */
export async function refreshTokenApi(
  apiUrl: string,
  refreshToken: string,
): Promise<RefreshTokenResponse> {
  const normalizedApiUrl = apiUrl.replace(/\/$/, '');
  const targetUrl = `${normalizedApiUrl}/api/auth/refresh`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${refreshToken}`,
    'Content-Type': 'application/json',
    'Accept-Language': globalAcceptLanguage,
    ...(globalAppVersion ? { 'X-App-Version': globalAppVersion } : {}),
  };

  logger.info(`[AuthAPI] refreshTokenApi -> POST ${targetUrl}`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': globalAcceptLanguage,
      Authorization: `Bearer ${refreshToken ? `${refreshToken.slice(0, 15)}...` : 'none'}`,
    },
    body: {
      refreshToken: refreshToken ? `${refreshToken.slice(0, 15)}...` : 'none',
    },
  });

  const response = await ky.post(targetUrl, {
    headers,
    json: { refreshToken },
    throwHttpErrors: false,
  });

  await checkAppVersion(response);

  const result = (await response
    .json()
    .catch(() => null)) as RefreshTokenResponse | null;

  logger.info(
    `[AuthAPI] refreshTokenApi <- Response Status: ${response.status}`,
    {
      status: response.status,
      ok: response.ok,
      body: result,
    },
  );

  if (!response.ok || !result || result.status !== 200) {
    const errorStatus = result?.status || response.status;
    const errorMessage =
      result?.message ||
      (result as any)?.error ||
      'Refresh Token이 유효하지 않거나 만료되었습니다.';
    logger.error(
      `[AuthAPI] refreshTokenApi error (${errorStatus}):`,
      errorMessage,
      'body:',
      result,
    );
    throw new ApiError(errorStatus, errorMessage);
  }

  return result;
}

/**
 * Executes a single-flight token refresh process to prevent concurrent duplicate refresh requests.
 *
 * @param apiUrl Base backend API URL
 * @param refreshToken Current refresh token
 * @returns Promise<{ accessToken: string; refreshToken: string }>
 */
async function executeTokenRefresh(
  apiUrl: string,
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshResponse = await refreshTokenApi(apiUrl, refreshToken);
        const { accessToken: newAccess, refreshToken: newRefresh } =
          refreshResponse.data;

        if (globalTokenSetter) {
          await globalTokenSetter(newAccess, newRefresh);
        }

        return { accessToken: newAccess, refreshToken: newRefresh };
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

/**
 * Creates an HTTP client (ky instance) configured with Accept-Language header, 401 interceptor, and Silent Refresh logic.
 *
 * @param baseUrl Base API URL
 * @param customOptions Additional ky configuration options
 * @returns KyInstance
 */
export function createHttpClient(
  baseUrl?: string,
  customOptions?: Options,
): KyInstance {
  const options: Options = {
    throwHttpErrors: false,
    ...customOptions,
    hooks: {
      beforeRequest: [
        async ({ request }) => {
          injectAppVersion(request);
          if (!request.headers.has('Accept-Language') && globalAcceptLanguage) {
            request.headers.set('Accept-Language', globalAcceptLanguage);
          }
          if (!request.headers.has('Authorization') && globalTokenGetter) {
            try {
              const tokens = await globalTokenGetter();
              if (tokens.accessToken) {
                request.headers.set(
                  'Authorization',
                  `Bearer ${tokens.accessToken}`,
                );
              }
            } catch (err) {
              logger.error('[HttpClient] Error getting access token:', err);
            }
          }
        },
        ...(customOptions?.hooks?.beforeRequest ?? []),
      ],
      afterResponse: [
        async ({ request, response, options: requestOptions }) => {
          await checkAppVersion(response);
          if (
            response.status === 401 &&
            !request.url.includes('/api/auth/refresh')
          ) {
            logger.warn(
              '[HttpClient] 401 Unauthorized detected! Attempting Silent Refresh...',
            );

            try {
              let currentRefreshToken: string | null | undefined;
              if (globalTokenGetter) {
                const tokens = await globalTokenGetter();
                currentRefreshToken = tokens.refreshToken;
              }

              if (currentRefreshToken) {
                const targetApiUrl =
                  (baseUrl && baseUrl.replace(/\/$/, '')) ||
                  new URL(request.url).origin;
                const newTokens = await executeTokenRefresh(
                  targetApiUrl,
                  currentRefreshToken,
                );

                // Retry original request with new access token
                const newHeaders: Record<string, string> = {};
                request.headers.forEach((value, key) => {
                  newHeaders[key.toLowerCase()] = value;
                });
                newHeaders.authorization = `Bearer ${newTokens.accessToken}`;
                if (globalAppVersion && !newHeaders['x-app-version']) {
                  newHeaders['x-app-version'] = globalAppVersion;
                }
                if (!newHeaders['accept-language'] && globalAcceptLanguage) {
                  newHeaders['accept-language'] = globalAcceptLanguage;
                }
                const retriedResponse = await ky(request.url, {
                  method: request.method,
                  headers: newHeaders,
                  body: requestOptions.body ?? null,
                  signal: request.signal,
                  credentials: request.credentials,
                  timeout: customOptions?.timeout ?? 10000,
                  retry: 0,
                  throwHttpErrors: false,
                });
                await checkAppVersion(retriedResponse);
                if (retriedResponse.status !== 401) return retriedResponse;
              } else {
                logger.warn(
                  '[HttpClient] No Refresh Token available for silent refresh.',
                );
              }
            } catch (refreshError) {
              if (
                refreshError instanceof AppVersionMismatchError ||
                request.signal.aborted
              ) {
                throw refreshError;
              }
              logger.error('[HttpClient] Silent Refresh failed:', refreshError);
            }

            // If refresh failed or no refresh token was present, notify unauthorized
            if (globalUnauthorizedHandler) {
              try {
                await globalUnauthorizedHandler();
              } catch (e) {
                logger.error(
                  '[HttpClient] Error executing unauthorized handler:',
                  e,
                );
              }
            }
          }

          return response;
        },
        ...(customOptions?.hooks?.afterResponse ?? []),
      ],
    },
  };

  if (baseUrl) {
    options.prefix = baseUrl.replace(/\/$/, '');
  }

  return ky.create(options);
}

/**
 * Creates an HTTP client (ky instance) for public endpoints that do not require Authorization header.
 *
 * @param baseUrl Base API URL
 * @param options Additional ky configuration. skipAppVersionCheck omits the version header and update handling.
 * @returns KyInstance
 */
export function createPublicHttpClient(
  baseUrl?: string,
  {
    skipAppVersionCheck = false,
    ...customOptions
  }: Options & {
    skipAppVersionCheck?: boolean;
  } = {},
): KyInstance {
  const options: Options = {
    throwHttpErrors: false,
    ...customOptions,
    hooks: {
      ...customOptions.hooks,
      beforeRequest: [
        ({ request }) => {
          if (!skipAppVersionCheck) injectAppVersion(request);
          if (!request.headers.has('Accept-Language') && globalAcceptLanguage) {
            request.headers.set('Accept-Language', globalAcceptLanguage);
          }
        },
        ...(customOptions.hooks?.beforeRequest ?? []),
      ],
      afterResponse: [
        async ({ response }) => {
          if (!skipAppVersionCheck) await checkAppVersion(response);
        },
        ...(customOptions.hooks?.afterResponse ?? []),
      ],
    },
  };

  if (baseUrl) {
    options.prefix = baseUrl.replace(/\/$/, '');
  }

  return ky.create(options);
}
