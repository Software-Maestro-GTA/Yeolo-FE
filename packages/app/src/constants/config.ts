/**
 * @file config.ts
 * @description Centralized app configuration, limits, and network default constants.
 * @requirements REQ-8, REQ-11
 * @functional FUN-1
 * @author Antigravity Agent
 */

export const APP_CONFIG = {
  DEFAULT_API_URL: 'https://api.yeolo.com',
  DEFAULT_REDIRECT_URI: 'yeolo-app',
  DEFAULT_USER_EMAIL: 'user@yeolo.com',
  /** Maximum number of recent photos retrieved from media library for taste analysis */
  ANALYSIS_PHOTO_LIMIT: 100,
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

export const ANALYSIS_PHOTO_LIMIT = APP_CONFIG.ANALYSIS_PHOTO_LIMIT;
export const DEFAULT_MAP_REGION = APP_CONFIG.DEFAULT_MAP_REGION;

export default APP_CONFIG;

