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
