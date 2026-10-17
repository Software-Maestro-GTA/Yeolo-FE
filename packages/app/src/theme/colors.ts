/**
 * @file colors.ts
 * @description Core color design tokens for Yeolo Mobile App, extracted directly from Figma Design Tokens.
 */

/**
 * Yeolo Core Figma Design Tokens
 */
export const palette = {
  // UI v3 COLOR, ICON (1231:452), confirmed 2026-10-16
  primary: '#54A9F5', // Main Blue - CTA 버튼, 주요 액션, 브랜드 강조
  accent: '#2589DC', // Sub Blue - 그래디언트, 보조 강조, 아이콘 하이라이트
  lightTeal: '#DDEEFF', // Blue Tint - 카드 배경, 선택 상태, 태그 배경
  softMint: '#FFFFFF', // White - 페이지 배경, 구분선 영역
  deepNavy: '#101722', // Text - 제목, 본문 텍스트, 핵심 정보
  subText: '#526174', // SubTitle & Secondary Text - 부제목 및 서브 설명문 텍스트
  mutedText: '#98A5B5', // Muted SubText - 보조 캡션 및 메타 정보 텍스트
  darkBlue: '#2589DC', // Darker Blue - 항공권 CTA 그래디언트 종단색
  darkTeal: '#2589DC', // Darker Teal - 호텔 CTA 그래디언트 종단색
  purple: '#9966CC', // Purple - 투어/티켓 강조색
  googleBlue: '#4285F4', // Google Brand Blue

  // Base Neutrals & Statuses
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  gray100: '#EFF2F6',
  gray200: '#E8EDF3',
  gray300: '#D0D8E2',
  gray950: '#101722',
  subBlue: '#2589DC',
  primaryTint: '#DDEEFF',
  privacyRed: '#E24D40',
  previewClose: '#3F3F3F',
  mediaPlaceholder: '#D9D9D9',
  legacyText: '#373737',
  legacyCaption: '#797979',
  gray400: '#98A5B5',
  gray500: '#6C7C90',
  gray600: '#526174',
  warning: '#F59E0B',
  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red200: '#FCA5A5',
  red500: '#E24D40',
  red700: '#B91C1C',
  red800: '#991B1B',
} as const;

/**
 * Convert a 6-digit hex color string to an RGBA string with the given alpha opacity.
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Semantic theme tokens
 */
export const theme = {
  colors: {
    primary: palette.primary,
    accent: palette.accent,
    lightTeal: palette.lightTeal,
    softMint: palette.softMint,
    deepNavy: palette.deepNavy,
    subText: palette.subText,
    mutedText: palette.mutedText,
    primaryDark: palette.darkBlue,
    primaryContainer: palette.lightTeal,
    secondary: palette.accent,
    aiAccent: palette.accent,

    text: {
      primary: palette.deepNavy,
      subTitle: palette.subText,
      secondary: palette.subText,
      subtle: palette.mutedText,
      muted: palette.mutedText,
      placeholder: palette.gray400,
      inverse: palette.white,
      danger: palette.red500,
    },

    bg: {
      screen: palette.softMint,
      card: palette.white,
      input: palette.white,
      tint: palette.lightTeal,
      secondary: '#EFF2F6',
      glass: 'rgba(255, 255, 255, 0.85)',
      overlay: hexToRgba(palette.deepNavy, 0.45),
      error: '#FEF2F2',
    },

    border: {
      default: palette.gray200,
      active: palette.primary,
      light: palette.lightTeal,
      error: '#E24D40',
    },

    status: {
      error: '#E24D40',
      errorBg: '#FEF2F2',
      warning: '#F59E0B',
      success: '#10B981',
      successBg: '#ECFDF5',
    },

    gradient: {
      background: [palette.softMint, palette.lightTeal] as const,
      bottom: [palette.softMint, palette.white] as const,
      primary: [palette.primary, palette.accent] as const,
      ai: [palette.primary, palette.accent] as const,
      loginBackground: [
        hexToRgba(palette.softMint, 0),
        hexToRgba(palette.softMint, 0.8),
        palette.softMint,
      ] as const,
    },

    shadow: palette.deepNavy,
  },
} as const;

export default theme;
