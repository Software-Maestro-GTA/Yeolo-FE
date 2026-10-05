/**
 * @file config.ts
 * @description Centralized app configuration, limits, and network default constants.
 */

import { Platform } from 'react-native';

export const APP_CONFIG = {
  DEFAULT_API_URL: 'https://api.yeolo.app',
  WEB_BASE_URL: 'https://www.yeolo.app',
  INVITE_BASE_URL: 'https://www.yeolo.app/invite',
  PRIVACY_POLICY_URL: 'https://www.yeolo.app/privacy',
  TERMS_OF_SERVICE_URL: 'https://www.yeolo.app/terms',
  MYREALTRIP_HOME_URL: 'https://www.myrealtrip.com/',
  MYREALTRIP_TICKET_COUPONS: [
    { code: 'PACKMKTP1000', minimumPrice: 50000, discount: 1000 },
    { code: 'PACKMKTP3000', minimumPrice: 100000, discount: 3000 },
    { code: 'PACKMKTP5000', minimumPrice: 150000, discount: 5000 },
  ],
  DEFAULT_REDIRECT_URI: 'yeolo-app',
  DEFAULT_USER_EMAIL: 'user@yeolo.com',
  DEFAULT_SUPPORT_EMAIL: 'ksk85628781@gmail.com',
  /** Maximum representative metadata records sent for taste analysis */
  ANALYSIS_PHOTO_LIMIT: 100,
  /** Initial sampling heuristics; calibrate against real libraries and recommendation quality. */
  PHOTO_SAMPLING: {
    LOOKBACK_DAYS: 365,
    PERIOD_COUNT: 12,
    CANDIDATES_PER_PERIOD: 250,
    PAGE_SIZE: 100,
    METADATA_CONCURRENCY: 4,
    VISIT_RADIUS_METERS: 100,
    VISIT_WINDOW_MINUTES: 120,
    MAX_PER_DAY: 5,
    MIN_REPRESENTATIVES: 5,
    MIN_DAYS: 3,
  },
  /** Default staleTime for TanStack Query (5 minutes) */
  QUERY_STALE_TIME: 5 * 60 * 1000,
  /** Default fallback map region (Seoul City Hall) for in-app mini map view */
  DEFAULT_MAP_REGION: {
    latitude: 37.5665,
    longitude: 126.978,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
} as const;

/**
 * Platform Detection & Helpers
 */
export const IS_ANDROID = Platform.OS === 'android';
export const IS_IOS = Platform.OS === 'ios';
export const IS_WEB = Platform.OS === 'web';

/**
 * Helper to safely disable Android GPU elevation artifacts during opacity animation transitions
 */
export const getPlatformElevation = (elevation: number): number => {
  return IS_ANDROID ? 0 : elevation;
};

export const ANALYSIS_PHOTO_LIMIT = APP_CONFIG.ANALYSIS_PHOTO_LIMIT;
export const DEFAULT_MAP_REGION = APP_CONFIG.DEFAULT_MAP_REGION;
export const DEFAULT_SUPPORT_EMAIL = APP_CONFIG.DEFAULT_SUPPORT_EMAIL;
export const DEFAULT_API_URL = APP_CONFIG.DEFAULT_API_URL;
export const INVITE_BASE_URL = APP_CONFIG.INVITE_BASE_URL;
export const WEB_BASE_URL = APP_CONFIG.WEB_BASE_URL;
export const PRIVACY_POLICY_URL = APP_CONFIG.PRIVACY_POLICY_URL;
export const TERMS_OF_SERVICE_URL = APP_CONFIG.TERMS_OF_SERVICE_URL;

export default APP_CONFIG;
