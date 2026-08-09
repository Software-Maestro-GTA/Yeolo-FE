/**
 * @file kyClient.ts
 * @description HTTP client instance with automatic 401 error interception and silent token refresh (API-AUTH-3).
 */
import ky, { type KyInstance, type Options } from 'ky';
import type { RefreshTokenResponse } from '../types/auth';
import { ApiError } from './errors';
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
    'Content-Type': 'application/json',
    Authorization: `Bearer ${refreshToken}`,
  };

  logger.info(`[AuthAPI] refreshTokenApi -> POST ${targetUrl}`, {
    headers: {
      'Content-Type': 'application/json',
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
 * Creates an HTTP client (ky instance) configured with 401 interceptor and Silent Refresh logic.
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
      ],
      afterResponse: [
        async ({ request, response }) => {
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
                const newHeaders = new Headers(request.headers);
                newHeaders.set(
                  'Authorization',
                  `Bearer ${newTokens.accessToken}`,
                );
                return ky(request.url, {
                  method: request.method,
                  headers: newHeaders,
                });
              } else {
                logger.warn(
                  '[HttpClient] No Refresh Token available for silent refresh.',
                );
              }
            } catch (refreshError) {
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
      ],
    },
  };

  if (baseUrl) {
    options.prefix = baseUrl.replace(/\/$/, '');
  }

  return ky.create(options);
}
