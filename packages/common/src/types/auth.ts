/**
 * @file auth.ts
 * @description Shared authentication types and interfaces across Web and Mobile (API-AUTH-1~4).
 */

export interface User {
  userId: string;
  provider: 'google' | 'apple' | string;
  email: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  status: 'active' | string;
  lastLoginAt: string;
  providerUserId?: string;
  createdAt?: string;
  deletedAt?: string | null;
  recentCourseId?: string | null;
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
    doOnboarding: boolean;
    recentCourseId: string | null;
    accessToken: string;
    refreshToken: string;
  };
}

export interface AppleLoginPayload {
  code: string;
  redirectUri: string;
  idToken?: string | null;
}

export interface AppleLoginResponse {
  status: number;
  message: string;
  data: {
    user: User;
    doOnboarding: boolean;
    recentCourseId: string | null;
    accessToken: string;
    refreshToken: string;
  };
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  status: number;
  message: string;
  data: {
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
