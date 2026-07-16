/**
 * @file auth.ts
 * @description Shared authentication types and interfaces across Web and Mobile.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-1
 * @author Antigravity Agent
 */

export interface GoogleLoginPayload {
  code: string;
  redirectUri: string;
}

export interface GoogleLoginResponse {
  status: number;
  message: string;
  data: {
    user: {
      userId: string;
      provider: string;
      email: string;
      displayName: string;
      profileImageUrl: string | null;
      status: string;
      lastLoginAt: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}
