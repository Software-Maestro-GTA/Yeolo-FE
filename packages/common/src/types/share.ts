/**
 * @file share.ts
 * @description Types and DTOs for travel course sharing (API-SHARE-1, API-SHARE-2, API-SHARE-3, DOM-6).
 */

export interface ShareLinkCreateResponseData {
  shareUrl: string;
  shareToken: string;
  expiresAt: string | null;
}

export interface ShareLinkCreateApiResponse {
  status: number;
  message: string;
  data: ShareLinkCreateResponseData;
}

export interface ShareInviter {
  displayName: string | null;
  profileImageUrl: string | null;
}

export interface ShareCourseSummary {
  title: string;
  destinationCountry: string;
  destinationCity: string;
  startDate: string;
  totalDays: number;
}

export interface ShareLinkDetailResponseData {
  course: ShareCourseSummary;
  inviter: ShareInviter;
  expiresAt: string | null;
}

export interface ShareLinkDetailApiResponse {
  status: number;
  message: string;
  data: ShareLinkDetailResponseData;
}

export interface ShareLinkAcceptResponseData {
  courseId: string;
}

export interface ShareLinkAcceptApiResponse {
  status: number;
  message: string;
  data: ShareLinkAcceptResponseData;
}
