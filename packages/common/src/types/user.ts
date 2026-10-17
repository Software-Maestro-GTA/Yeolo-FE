/**
 * @file user.ts
 * @description Shared user preference, profile, and language types matching API-USER-1~4 and API-PREF-1~2.
 */

export interface UpdateUserProfilePayload {
  displayName?: string | null;
  profileImage?: string | File | null;
}

export interface UserProfileData {
  userId: string;
  provider: 'google' | 'apple' | string;
  email: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  status: 'active' | string;
  lastLoginAt: string;
}

export interface UpdateUserProfileResponse {
  status: number;
  message: string;
  data: {
    user: UserProfileData;
  };
}

export interface UpdatePreferencesPayload {
  mbti: string;
}

export interface UpdatePreferencesResponse {
  status: number;
  message: string;
  data: null;
}

export interface PhotoConsentData {
  agreed: boolean;
  agreedAt: string;
  consentVersion: string;
}

export interface SavePhotoConsentPayload {
  agreed: boolean;
  consentVersion: string;
}

export interface SavePhotoConsentResponse {
  status: number;
  message: string;
  data: {
    consent: PhotoConsentData;
  };
}

export interface UserLanguageData {
  language: string;
}

export interface GetUserLanguageResponse {
  status: number;
  message: string;
  data: UserLanguageData;
}

export interface UpdateUserLanguagePayload {
  language: string;
}

export interface UpdateUserLanguageResponse {
  status: number;
  message: string;
  data: UserLanguageData;
}
