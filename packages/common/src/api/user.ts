/**
 * @file user.ts
 * @description Common user management API services shared across Web and Mobile.
 * @requirements REQ-12
 * @functional FUN-1
 * @api API-FB-12
 * @author Antigravity Agent
 */
import ky from 'ky';
import type { WithdrawRequest, WithdrawResponse } from '../types/auth';
import { ApiError } from './errors';
import { logger } from '../utils/logger';

/**
 * Permanently delete user account and invalidate session (API-FB-12)
 */
export async function withdrawApi(
  apiUrl: string,
  token?: string,
  payload?: WithdrawRequest
): Promise<WithdrawResponse> {
  logger.info('[UserAPI] withdrawApi request:', payload);
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await ky.delete(`${apiUrl}/api/users/me`, {
    headers,
    json: payload || {},
    throwHttpErrors: false,
  });

  const result = await response.json<WithdrawResponse>();

  if (!response.ok || result.status !== 200) {
    const errorStatus = result.status || response.status;
    const errorMessage = result.message || '회원탈퇴 실패';
    logger.error(`[UserAPI] withdrawApi error (${errorStatus}):`, errorMessage);
    throw new ApiError(errorStatus, errorMessage);
  }

  return result;
}
