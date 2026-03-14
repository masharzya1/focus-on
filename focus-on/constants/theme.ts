// constants/theme.ts
// Design system — consistent spacing, typography, colors

export interface ThemeColors {
  bg: string;
  bgCard: string;
  bgSecondary: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentDark: string;
  accentFg: string;
  accentSoft: string;
  tabBg: string;
  tabBorder: string;
  inputBg: string;
  destructive: string;
  destructiveDark: string;
  success: string;
  successDark: string;
  streakColor: string;
  xpColor: string;
  xpDark: string;
}

export const LightTheme: ThemeColors = {
  bg:              '#FAFAFF',
  bgCard:          '#FFFFFF',
  bgSecondary:     '#F0EFFF',
  border:          '#E4E2FF',
  text:            '#1E1B4B',
  textMuted:       '#6B7280',
  textFaint:       '#C4BEFF',
  accent:          '#6C63FF',
  accentDark:      '#4B42D6',
  accentFg:        '#FFFFFF',
  accentSoft:      '#EDEAFF',
  tabBg:           '#FFFFFF',
  tabBorder:       '#E4E2FF',
  inputBg:         '#F0EFFF',
  destructive:     '#FF4757',
  destructiveDark: '#CC2233',
  success:         '#2DD4BF',
  successDark:     '#0F9B8E',
  streakColor:     '#FF9500',
  xpColor:         '#FFD700',
  xpDark:          '#E6B800',
};

export const DarkTheme: ThemeColors = {
  bg:              '#12102A',
  bgCard:          '#1C1A3E',
  bgSecondary:     '#252347',
  border:          '#2D2B5A',
  text:            '#F0EFFF',
  textMuted:       '#8B85C1',
  textFaint:       '#3D3B70',
  accent:          '#8C85FF',
  accentDark:      '#6C63FF',
  accentFg:        '#FFFFFF',
  accentSoft:      '#2A2860',
  tabBg:           '#1C1A3E',
  tabBorder:       '#2D2B5A',
  inputBg:         '#1A1835',
  destructive:     '#FF6B7A',
  destructiveDark: '#CC3344',
  success:         '#2DD4BF',
  successDark:     '#0F9B8E',
  streakColor:     '#FF9500',
  xpColor:         '#FFD700',
  xpDark:          '#E6B800',
};

// ── Border radius ────────────────────────────────────────────────────────────
export const RADIUS = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   18,
  xl:   20,
  xxl:  28,
  full: 999,
};

// ── Spacing — use these, never hardcode ──────────────────────────────────────
// Apple HIG: minimum touch target 44pt, consistent 16/20/24 rhythm
export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,   // card padding, list gap
  xl:  20,   // horizontal screen margin
  xxl: 24,   // section gap
  xxxl: 32,
};

// ── Safe area top ────────────────────────────────────────────────────────────
// Consistent across all screens — iOS 56, Android 44
import { Platform } from 'react-native';
export const HEADER_TOP = Platform.OS === 'ios' ? 56 : 44;

// ── Progress bar ─────────────────────────────────────────────────────────────
// One height everywhere
export const PROGRESS_HEIGHT = 6;

// ── Typography ───────────────────────────────────────────────────────────────
export const FONTS = {
  regular:   'Nunito_400Regular',
  medium:    'Nunito_500Medium',
  semibold:  'Nunito_600SemiBold',
  bold:      'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black:     'Nunito_900ExtraBlack',
};

// ── Type scale ───────────────────────────────────────────────────────────────
export const TYPE = {
  largeTitle: { fontSize: 30, fontFamily: FONTS.black,     letterSpacing: -0.5 },
  title1:     { fontSize: 24, fontFamily: FONTS.black,     letterSpacing: -0.3 },
  title2:     { fontSize: 20, fontFamily: FONTS.black,     letterSpacing: -0.2 },
  title3:     { fontSize: 18, fontFamily: FONTS.bold                           },
  headline:   { fontSize: 16, fontFamily: FONTS.bold                           },
  body:       { fontSize: 15, fontFamily: FONTS.regular                        },
  callout:    { fontSize: 14, fontFamily: FONTS.medium                         },
  subhead:    { fontSize: 13, fontFamily: FONTS.semibold                       },
  footnote:   { fontSize: 12, fontFamily: FONTS.regular                        },
  caption:    { fontSize: 11, fontFamily: FONTS.medium,    letterSpacing: 0.5  },
  label:      { fontSize: 11, fontFamily: FONTS.bold,      letterSpacing: 1,   textTransform: 'uppercase' as const },
};