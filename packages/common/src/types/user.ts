/**
 * @file user.ts
 * @description Shared user preference and profile types across Web and Mobile matching API-USER-1 spec.
 */

export interface UpdateUserProfilePayload {
  displayName?: string | null;
  profileImage?: string | File | null;
}

export interface UserProfileData {
  userId: string;
  provider: string;
  email: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  status: string;
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
