/**
 * @file colors.ts
 * @description Centralized design tokens for colors, palettes, and semantic theme values across the app.
 * @requirements REQ-11
 * @functional FUN-1
 * @author Antigravity Agent
 */

/**
 * Raw color palette values.
 */
export const palette = {
  // Brand / Primary (Ocean Sky Blue)
  blue500: '#0284C7',
  blue600: '#0369A1',
  blue50: '#F0F9FF',
  indigo500: '#6366F1',
  cyan400: '#38BDF8',

  // Accent & Secondary
  emerald500: '#10B981',
  emerald50: '#ECFDF5',
  green400: '#4EDEA3',

  // Slate / Grays (Neutral scale)
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',

  // Specific grays for legacy screens
  gray900: '#030612',
  gray700: '#171C1F',
  gray500: '#76777C',
  gray200: '#EAEEF2',

  // Status & Feedback
  red500: '#EF4444',
  red600: '#D32F2F',
  red50: '#FEF2F2',
  amber500: '#F59E0B',

  // Base
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Gradients
  screenBgStart: '#F0F9FF',
  screenBgEnd: '#FFFFFF',
  gradientBottomStart: '#F0F9FF',
  gradientBottomEnd: 'rgba(240, 249, 255, 0)',
  borderLight: 'rgba(198, 198, 204, 0.5)',
  buttonGlass: 'rgba(255, 255, 255, 0.7)',
} as const;

/**
 * Semantic theme tokens mapped to palette values for dark/light mode consistency.
 */
export const theme = {
  colors: {
    primary: palette.blue500,
    primaryDark: palette.blue600,
    primaryContainer: palette.blue50,
    secondary: palette.emerald500,
    aiAccent: palette.indigo500,

    text: {
      primary: palette.slate900,
      secondary: palette.slate700,
      subtle: palette.slate500,
      placeholder: palette.slate400,
      muted: palette.gray500,
      inverse: palette.white,
      danger: palette.red500,
    },

    bg: {
      screen: palette.screenBgStart,
      card: palette.white,
      input: palette.slate50,
      secondary: palette.slate100,
      glass: palette.buttonGlass,
      error: palette.red50,
    },

    border: {
      default: palette.slate200,
      light: palette.borderLight,
      active: palette.blue500,
      error: palette.red500,
    },

    status: {
      error: palette.red500,
      errorBg: palette.red50,
      warning: palette.amber500,
      success: palette.emerald500,
      successBg: palette.emerald50,
    },

    gradient: {
      background: [palette.screenBgStart, palette.gradientBottomEnd] as const,
      bottom: [palette.gradientBottomStart, palette.gradientBottomEnd] as const,
      primary: [palette.blue500, palette.cyan400] as const,
      ai: [palette.indigo500, palette.cyan400] as const,
    },

    shadow: palette.black,
  },
} as const;

export default theme;
