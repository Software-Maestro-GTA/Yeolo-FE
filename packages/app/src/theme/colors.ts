/**
 * @file colors.ts
 * @description Core color design tokens for Yeolo Mobile App, extracted directly from Figma Design Tokens.
 */

/**
 * Yeolo Core Figma Design Tokens
 */
export const palette = {
  // Figma Design Tokens
  primary: '#2D7DD2', // Ocean Blue - CTA 버튼, 주요 액션, 브랜드 강조
  accent: '#00C9A7', // Teal Green - 그래디언트, 보조 강조, 아이콘 하이라이트
  lightTeal: '#E0F7F1', // Tint - 카드 배경, 선택 상태, 태그 배경
  softMint: '#F5FAF8', // Background - 페이지 배경, 구분선 영역
  deepNavy: '#0D2137', // Text - 제목, 본문 텍스트, 핵심 정보
  subText: '#59616B', // SubTitle & Secondary Text - 부제목 및 서브 설명문 텍스트
  mutedText: '#8C949E', // Muted SubText - 보조 캡션 및 메타 정보 텍스트
  darkBlue: '#1E5FA6', // Darker Blue - 항공권 CTA 그래디언트 종단색
  darkTeal: '#0D7361', // Darker Teal - 호텔 CTA 그래디언트 종단색
  purple: '#9966CC', // Purple - 투어/티켓 강조색

  // Base Neutrals & Statuses
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#59616B',
  warning: '#F59E0B',
  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red200: '#FCA5A5',
  red500: '#EF4444',
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
    primaryDark: '#1D4ED8',
    primaryContainer: palette.lightTeal,
    secondary: palette.accent,
    aiAccent: palette.accent,

    text: {
      primary: palette.deepNavy,
      subTitle: palette.subText,
      secondary: palette.subText,
      subtle: palette.mutedText,
      muted: palette.mutedText,
      placeholder: '#9CA3AF',
      inverse: palette.white,
      danger: palette.red500,
    },

    bg: {
      screen: palette.softMint,
      card: palette.white,
      input: palette.white,
      tint: palette.lightTeal,
      secondary: '#F1F5F9',
      glass: 'rgba(255, 255, 255, 0.85)',
      overlay: hexToRgba(palette.deepNavy, 0.45),
      error: '#FEF2F2',
    },

    border: {
      default: palette.gray200,
      active: palette.primary,
      light: palette.lightTeal,
      error: '#EF4444',
    },

    status: {
      error: '#EF4444',
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
