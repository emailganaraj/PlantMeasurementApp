/**
 * src/theme/index.ts
 *
 * Single source of truth for the design system.
 * Covers colors, typography, spacing, shadows, and border radii.
 */
import { Platform } from 'react-native';

// ─────────────────────────────────────────────
// COLOR PALETTE
// ─────────────────────────────────────────────
export const Colors = {
  // Brand – Green (primary)
  primary:       '#16a34a',
  primaryDark:   '#15803d',
  primaryDeep:   '#14532d',
  primaryLight:  '#dcfce7',
  primaryBg:     '#f0fdf4',

  // Brand – Orange (accent)
  accent:        '#fb923c',
  accentDark:    '#ea580c',
  accentLight:   '#fed7aa',
  accentBg:      '#fff7ed',

  // Semantic
  success:       '#16a34a',
  warning:       '#f59e0b',
  error:         '#dc2626',
  errorDark:     '#b91c1c',
  info:          '#3b82f6',
  infoDark:      '#1d4ed8',
  infoLight:     '#eff6ff',

  // Purple – special accents
  purple:        '#8b5cf6',
  purpleDark:    '#6d28d9',
  purpleLight:   '#f3e8ff',
  purpleAccent:  '#c4b5fd',

  // Neutrals
  white:         '#ffffff',
  black:         '#000000',
  dark:          '#1e293b',

  // Gray scale
  gray50:        '#f9fafb',
  gray100:       '#f3f4f6',
  gray200:       '#e5e7eb',
  gray300:       '#d1d5db',
  gray400:       '#9ca3af',
  gray500:       '#6b7280',
  gray600:       '#4b5563',
  gray700:       '#374151',
  gray800:       '#1f2937',
  gray900:       '#111827',

  // Surfaces
  surface:       '#ffffff',
  surfaceWarm:   '#fff5e6',
  surfaceGreen:  '#f0fdf4',

  // Overlay
  overlay:       'rgba(0,0,0,0.4)',
} as const;

// ─────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────
export const Typography = {
  sizes: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   16,
    lg:   18,
    xl:   22,
    '2xl': 26,
    '3xl': 32,
    '4xl': 40,
  },
  weights: {
    regular:   '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
    extrabold: '800' as const,
    black:     '900' as const,
  },
  families: {
    sans: Platform.OS === 'ios' ? 'System' : 'Roboto',
    mono: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  lineHeights: {
    tight:   16,
    snug:    20,
    normal:  24,
    relaxed: 28,
    loose:   32,
  },
  letterSpacing: {
    tighter: -0.5,
    tight:   -0.2,
    normal:   0,
    wide:     0.3,
    wider:    0.5,
    widest:   0.8,
  },
} as const;

// ─────────────────────────────────────────────
// SPACING  (4 px base scale)
// ─────────────────────────────────────────────
export const Spacing = {
  0:   0,
  1:   2,
  2:   4,
  3:   6,
  4:   8,
  5:   10,
  6:   12,
  7:   14,
  8:   16,
  9:   18,
  10:  20,
  12:  24,
  14:  28,
  16:  32,
  20:  40,
  24:  48,
  32:  64,
} as const;

// ─────────────────────────────────────────────
// SHADOW PRESETS
// ─────────────────────────────────────────────
export const Shadows = {
  none: {},

  xs: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  2,
    elevation:     1,
  },
  sm: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius:  4,
    elevation:     3,
  },
  md: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius:  8,
    elevation:     6,
  },
  lg: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius:  12,
    elevation:     10,
  },
  xl: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius:  20,
    elevation:     14,
  },

  // Colored shadows
  green: {
    shadowColor:   Colors.primary,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius:  8,
    elevation:     6,
  },
  greenLg: {
    shadowColor:   Colors.primary,
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius:  12,
    elevation:     10,
  },
  orange: {
    shadowColor:   Colors.accent,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius:  8,
    elevation:     6,
  },
  orangeLg: {
    shadowColor:   Colors.accent,
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius:  12,
    elevation:     10,
  },
  blue: {
    shadowColor:   Colors.info,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius:  8,
    elevation:     6,
  },
  purple: {
    shadowColor:   Colors.purple,
    shadowOffset:  { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius:  6,
    elevation:     4,
  },
} as const;

// ─────────────────────────────────────────────
// BORDER RADIUS PRESETS
// ─────────────────────────────────────────────
export const BorderRadius = {
  none:  0,
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 24,
  '3xl': 32,
  full:  9999,
} as const;

// ─────────────────────────────────────────────
// COMPOSITE THEME OBJECT
// ─────────────────────────────────────────────
export const Theme = {
  colors:       Colors,
  typography:   Typography,
  spacing:      Spacing,
  shadows:      Shadows,
  borderRadius: BorderRadius,
} as const;

export type ThemeType = typeof Theme;
export default Theme;
