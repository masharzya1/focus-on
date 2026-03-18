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
  bg:              '#FFFFFF',
  bgCard:          '#F7F8FA',
  bgSecondary:     '#F0F1F5',
  border:          '#E8E9EF',
  text:            '#111318',
  textMuted:       '#6B7280',
  textFaint:       '#B8BAC4',
  accent:          '#5E6AD2',
  accentDark:      '#4A55B8',
  accentFg:        '#FFFFFF',
  accentSoft:      '#EEF0FD',
  tabBg:           '#FFFFFF',
  tabBorder:       '#EBEBF0',
  inputBg:         '#F4F5F8',
  destructive:     '#EF4444',
  destructiveDark: '#DC2626',
  success:         '#22C55E',
  successDark:     '#16A34A',
  streakColor:     '#F97316',
  xpColor:         '#EAB308',
  xpDark:          '#CA8A04',
};

export const DarkTheme: ThemeColors = {
  bg:              '#0F0F13',
  bgCard:          '#1A1A20',
  bgSecondary:     '#222229',
  border:          '#2C2C36',
  text:            '#F0F0F5',
  textMuted:       '#8A8A99',
  textFaint:       '#3C3C4A',
  accent:          '#7B83E0',
  accentDark:      '#5E6AD2',
  accentFg:        '#FFFFFF',
  accentSoft:      '#1E1F3A',
  tabBg:           '#1A1A20',
  tabBorder:       '#2C2C36',
  inputBg:         '#1C1C24',
  destructive:     '#F87171',
  destructiveDark: '#EF4444',
  success:         '#4ADE80',
  successDark:     '#22C55E',
  streakColor:     '#FB923C',
  xpColor:         '#FACC15',
  xpDark:          '#EAB308',
};

export const RADIUS = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  full: 999,
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl: 32,
};

import { Platform } from 'react-native';
export const HEADER_TOP = Platform.OS === 'ios' ? 56 : 44;
export const PROGRESS_HEIGHT = 4;

export const FONTS = {
  light:     'HindSiliguri_300Light',
  regular:   'HindSiliguri_400Regular',
  medium:    'HindSiliguri_500Medium',
  semibold:  'HindSiliguri_600SemiBold',
  bold:      'HindSiliguri_700Bold',
  extrabold: 'HindSiliguri_700Bold',
  black:     'HindSiliguri_700Bold',
};

export const TYPE = {
  largeTitle: { fontSize: 28, fontFamily: FONTS.bold,    letterSpacing: -0.5 },
  title1:     { fontSize: 22, fontFamily: FONTS.bold,    letterSpacing: -0.3 },
  title2:     { fontSize: 18, fontFamily: FONTS.bold,    letterSpacing: -0.2 },
  title3:     { fontSize: 16, fontFamily: FONTS.bold                         },
  headline:   { fontSize: 15, fontFamily: FONTS.bold                         },
  body:       { fontSize: 14, fontFamily: FONTS.regular                      },
  callout:    { fontSize: 13, fontFamily: FONTS.medium                       },
  footnote:   { fontSize: 12, fontFamily: FONTS.regular                      },
  caption:    { fontSize: 11, fontFamily: FONTS.medium,  letterSpacing: 0.3  },
};

export const BN_FONTS = {
  light:     'HindSiliguri_300Light',
  regular:   'HindSiliguri_400Regular',
  medium:    'HindSiliguri_500Medium',
  semibold:  'HindSiliguri_600SemiBold',
  bold:      'HindSiliguri_700Bold',
  extrabold: 'HindSiliguri_700Bold',
  black:     'HindSiliguri_700Bold',
};

export const SOFT_COLORS = {
  mint:    { bg: '#F0FDF8', text: '#166534', dot: '#22C55E' },
  lavender:{ bg: '#EEF0FD', text: '#3730A3', dot: '#5E6AD2' },
  peach:   { bg: '#FFF7ED', text: '#9A3412', dot: '#F97316' },
  rose:    { bg: '#FFF1F2', text: '#9F1239', dot: '#F43F5E' },
  sky:     { bg: '#F0F9FF', text: '#0C4A6E', dot: '#0EA5E9' },
  amber:   { bg: '#FFFBEB', text: '#78350F', dot: '#EAB308' },
};
