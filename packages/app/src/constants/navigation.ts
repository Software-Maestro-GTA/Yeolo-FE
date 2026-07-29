export const NAV_STEPS = {
  LOGIN: 'LOGIN',
  INTRO: 'INTRO',
  PHOTO: 'PHOTO',
  TASTE: 'TASTE',
  TASTE_PROFILE: 'TASTE_PROFILE',
  PROFILE: 'PROFILE',
  HOME: 'HOME',
  COURSE_LIST: 'COURSE_LIST',
  CREATE_COURSE: 'CREATE_COURSE',
  GENERATING_COURSE: 'GENERATING_COURSE',
  COURSE_DETAIL: 'COURSE_DETAIL',
} as const;

export type NavStep = (typeof NAV_STEPS)[keyof typeof NAV_STEPS];

export const NAV_TABS = {
  HOME: 'home',
  EXPLORE: 'explore',
  CREATE: 'create',
  PROFILE: 'profile',
} as const;
