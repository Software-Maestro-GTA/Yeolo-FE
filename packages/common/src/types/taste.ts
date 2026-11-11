/**
 * @file taste.ts
 * @description Shared taste preference analysis and query types matching API-PREF-3 and API-PREF-4.
 */

export interface ImageMetadata {
  sourceImageId: string;
  capturedAt: string; // ISO-8601 UTC
  latitude: number;
  longitude: number;
  timezone?: string;
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
  };
}

export interface TasteAnalysisState {
  isAnalyzing: boolean;
  progressStep: string | null;
  progressMessage: string | null;
  error: string | null;
  errorCode: number | null;
}

export interface StreamCallbacks {
  onProgress?: (event: TasteProgressData) => void;
  onComplete?: (event: TasteCompleteData) => void;
  onError?: (error: Error) => void;
}

export interface TasteProfileTypeItem {
  typeCode: string;
  typeName: string;
  lowName: string;
  highName: string;
  score: number;
}

export interface TasteRecommendCity {
  countryName: string;
  cityName: string;
  imageUrl: string;
  reason: string;
}

export interface TasteProfile {
  intro: string;
  hashtags: string[];
  types: TasteProfileTypeItem[];
  recommendCity: TasteRecommendCity;
}

export interface TasteProfileApiResponse {
  status: number;
  message: string;
  data: TasteProfile;
}

export interface TravelPurposePreference {
  relaxation?: number;
  sightseeing?: number;
  culturalExperience?: number;
  gourmet?: number;
  natureExploration?: number;
  activity?: number;
  shopping?: number;
  festivalEvent?: number;
  wellness?: number;
  selfDevelopment?: number;
}

export interface PreferredLocationType {
  bigCity?: number;
  smallTownAlley?: number;
  natureHinterland?: number;
  beachResort?: number;
  mountainPlateau?: number;
  historicalCity?: number;
  themeParkResort?: number;
  famousSpotPreferred?: number;
  hiddenSpotPreferred?: number;
}

export interface ActivityPreference {
  viewing?: number;
  experience?: number;
  adventure?: number;
  photographyVideo?: number;
  gourmetExploration?: number;
  nightlife?: number;
  shopping?: number;
  relaxation?: number;
  localInteraction?: number;
}

export interface FoodPreference {
  localFoodActive?: number;
  famousRestaurantCentered?: number;
  streetFood?: number;
  cafeDessert?: number;
  fineDining?: number;
  familiarFoodPreferred?: number;
  dietaryRestriction?: number;
  sightseeingOverFood?: number;
}

export type TravelPaceDensity =
  'slow_stay' | 'balanced' | 'dense_schedule' | 'spontaneous' | 'long_stay';

export type CompanionType =
  | 'solo'
  | 'couple'
  | 'friends'
  | 'family'
  | 'with_children'
  | 'with_parents'
  | 'group'
  | 'with_pet'
  | 'social';
