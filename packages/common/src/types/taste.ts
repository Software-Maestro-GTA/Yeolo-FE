/**
 * @file taste.ts
 * @description Shared taste preference analysis types and interfaces across Web and Mobile.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-2
 * @author Antigravity Agent
 */

export interface ImageMetadata {
  sourceImageId: string;
  capturedAt: string; // ISO-8601
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface AnalyzeTastePayload {
  images: ImageMetadata[];
}

export interface TasteProgressData {
  step: 'PREPROCESSING_IMAGE_METADATA' | 'ANALYZING_PREFERENCE';
  message: string;
}

export interface TasteCompleteData {
  status: number;
  message: string;
  data: {
    tasteProfileId: string;
    sourceType: 'behavior';
  };
}

export interface StreamCallbacks {
  onProgress?: (data: TasteProgressData) => void;
  onComplete?: (data: TasteCompleteData) => void;
  onError?: (error: any) => void;
}
