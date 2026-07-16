/**
 * @file auth.ts
 * @description Constants and theme configurations for the Google authentication flow and screens.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-1
 * @author Antigravity Agent
 */

export const AUTH_CONSTANTS = {
  SUB_TITLE: '당신의 여행을 데이터로 그리다,',
  MAIN_TITLE: '여로',
  GOOGLE_BUTTON_TEXT: 'Google 계정으로 계속하기',
  CUSTOMER_SUPPORT_TEXT: '도움이 필요하신가요? ',
  CUSTOMER_SUPPORT_LINK: '고객 지원',
  DEFAULT_API_URL: 'https://api.yeolo.com',
  DEFAULT_REDIRECT_URI: 'yeolo-app',
};

export const BRAND_COLORS = {
  PRIMARY: '#4648d4',
  GRADIENT_GREEN: '#4edea3',
  TEXT_DARK: '#030612',
  TEXT_MUTED: '#76777c',
  BUTTON_TEXT: '#171c1f',
  BORDER_LIGHT: 'rgba(198,198,204,0.5)',
  BACKGROUND_GRADIENT: ['#f6fafe', '#ffffff'] as const,
  BOTTOM_GRADIENT: ['#f6fafe', 'rgba(246,250,254,0)'] as const,
  BUTTON_BACKGROUND: 'rgba(255,255,255,0.7)',
  SHADOW: '#000000',
};
