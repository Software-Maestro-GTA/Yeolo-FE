/**
 * @file assets.ts
 * @description Centralized static image and media asset exports for Yeolo mobile app.
 */

export const APP_IMAGES = {
  INTRO_PHOTO_ANALYSIS: require('../../assets/images/intro_photo_analysis.jpg'),
  INTRO_MAP_ROUTE: require('../../assets/images/intro_map_route.jpg'),
} as const;

export default APP_IMAGES;
