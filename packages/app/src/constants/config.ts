/**
 * @file config.ts
 * @description Centralized app configuration, limits, and network default constants.
 */

import { Platform } from 'react-native';

export const APP_CONFIG = {
  DEFAULT_API_URL: 'https://api.yeolo.com',
  DEFAULT_REDIRECT_URI: 'yeolo-app',
  DEFAULT_USER_EMAIL: 'user@yeolo.com',
  DEFAULT_SUPPORT_EMAIL: 'ksk85628781@gmail.com',
  PRIVACY_POLICY_URL:
    'https://app.notion.com/p/sunq925/Yeolo-3ad1d7341cda80c592faf203e9db0ed5?source=copy_link',
  /** Maximum number of recent photos retrieved from media library for taste analysis */
  ANALYSIS_PHOTO_LIMIT: 100,
  /** Default staleTime for TanStack Query (5 minutes) */
  QUERY_STALE_TIME: 5 * 60 * 1000,
  /** Trip.com Affiliate booking URLs */
  TRIP_HOTEL_URL:
    'https://kr.trip.com/hotels/w/home?Allianceid=9936872&SID=327895947',
  TRIP_FLIGHT_URL:
    'https://kr.trip.com/flights/?locale=ko-KR&curr=KRW&Allianceid=9936872&SID=327895947',
  TRIP_TRAIN_URL:
    'https://kr.trip.com/trains/?locale=ko-KR&curr=KRW&Allianceid=9936872&SID=327895947',
  TRIP_TICKET_URL:
    'https://kr.trip.com/things-to-do/?locale=ko-KR&curr=KRW&Allianceid=9936872&SID=327895947',
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

export const TRIP_HOTEL_URL = APP_CONFIG.TRIP_HOTEL_URL;
export const TRIP_FLIGHT_URL = APP_CONFIG.TRIP_FLIGHT_URL;
export const TRIP_TRAIN_URL = APP_CONFIG.TRIP_TRAIN_URL;
export const TRIP_TICKET_URL = APP_CONFIG.TRIP_TICKET_URL;

export const ANALYSIS_PHOTO_LIMIT = APP_CONFIG.ANALYSIS_PHOTO_LIMIT;
export const DEFAULT_MAP_REGION = APP_CONFIG.DEFAULT_MAP_REGION;
export const DEFAULT_SUPPORT_EMAIL = APP_CONFIG.DEFAULT_SUPPORT_EMAIL;
export const DEFAULT_API_URL = APP_CONFIG.DEFAULT_API_URL;

export default APP_CONFIG;
