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
} as const;

export const ANALYSIS_PHOTO_LIMIT = APP_CONFIG.ANALYSIS_PHOTO_LIMIT;

export default APP_CONFIG;
