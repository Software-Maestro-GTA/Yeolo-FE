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
  | 'slow_stay'
  | 'balanced'
  | 'dense_schedule'
  | 'spontaneous'
  | 'long_stay';

export interface TasteProfile {
  tasteProfileId: string;
  userId: string;
  sourceType: 'onboarding_survey' | 'behavior' | 'mixed';
  updatedAt: string;
  travelPurpose: TravelPurposePreference;
  travelPaceDensity: TravelPaceDensity;
  preferredLocationType: PreferredLocationType;
  activityPreference: ActivityPreference;
  spendingTendency: 'cost_effective' | 'moderate' | 'luxury';
  companionType: 'alone' | 'couple' | 'family' | 'friends';
  foodPreference: FoodPreference;
  seasonalEnvironmentPreference: string[];
}
