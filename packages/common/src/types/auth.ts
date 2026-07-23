/**
 * @file auth.ts
 * @description Shared authentication types and interfaces across Web and Mobile.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-1
 * @author Antigravity Agent
 */

export interface User {
  userId: string;
  provider: string;
  providerUserId?: string;
  email: string;
  displayName: string;
  profileImageUrl: string | null;
  status: string;
  createdAt?: string;
  lastLoginAt?: string;
  deletedAt?: string | null;
}

export interface GoogleLoginPayload {
  code: string;
  redirectUri: string;
}

export interface GoogleLoginResponse {
  status: number;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface LogoutRequest {
  refreshToken?: string;
}

export interface LogoutResponse {
  status: number;
  message: string;
  data: null;
}

export interface WithdrawRequest {
  reason?: string;
}

export interface WithdrawResponse {
  status: number;
  message: string;
  data: null;
}

