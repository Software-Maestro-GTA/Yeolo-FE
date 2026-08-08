/**
 * @file user.ts
 * @description Shared user preference and profile types across Web and Mobile.
 */

export interface UpdatePreferencesPayload {
  mbti: string;
}

export interface UpdatePreferencesResponse {
  status: number;
  message: string;
  data: null;
}
