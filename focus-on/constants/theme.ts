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
  bg:              '#F5F4FF',
  bgCard:          '#FFFFFF',
  bgSecondary:     '#EEF0FF',
  border:          '#E8E6FF',
  text:            '#1A1240',
  textMuted:       '#6E6A90',
  textFaint:       '#B8B4D8',
  accent:          '#7C6FF7',
  accentDark:      '#5B50D6',
  accentFg:        '#FFFFFF',
  accentSoft:      '#EAE8FF',
  tabBg:           '#FFFFFF',
  tabBorder:       '#EAE8FF',
  inputBg:         '#F0EFFE',
  destructive:     '#FF5F6D',
  destructiveDark: '#D63A47',
  success:         '#30D9A4',
  successDark:     '#14B888',
  streakColor:     '#FF8C42',
  xpColor:         '#FFCB47',
  xpDark:          '#E8A800',
};

export const DarkTheme: ThemeColors = {
  bg:              '#100D26',
  bgCard:          '#1A1740',
  bgSecondary:     '#232050',
  border:          '#2C2860',
  text:            '#EDEAFF',
  textMuted:       '#8A84C0',
  textFaint:       '#3E3A70',
  accent:          '#9B90FF',
  accentDark:      '#7C6FF7',
  accentFg:        '#FFFFFF',
  accentSoft:      '#28245A',
  tabBg:           '#1A1740',
  tabBorder:       '#2C2860',
  inputBg:         '#1A1738',
  destructive:     '#FF7080',
  destructiveDark: '#CC3344',
  success:         '#30D9A4',
  successDark:     '#14B888',
  streakColor:     '#FF8C42',
  xpColor:         '#FFCB47',
  xpDark:          '#E8A800',
};

export const RADIUS = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   18,
  xl:   22,
  xxl:  28,
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

export const PROGRESS_HEIGHT = 6;

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
  largeTitle: { fontSize: 30, fontFamily: FONTS.bold,     letterSpacing: -0.5 },
  title1:     { fontSize: 24, fontFamily: FONTS.bold,     letterSpacing: -0.3 },
  title2:     { fontSize: 20, fontFamily: FONTS.bold,     letterSpacing: -0.2 },
  title3:     { fontSize: 18, fontFamily: FONTS.bold                          },
  headline:   { fontSize: 16, fontFamily: FONTS.bold                          },
  body:       { fontSize: 15, fontFamily: FONTS.regular                       },
  callout:    { fontSize: 14, fontFamily: FONTS.medium                        },
  subhead:    { fontSize: 13, fontFamily: FONTS.semibold                      },
  footnote:   { fontSize: 12, fontFamily: FONTS.regular                       },
  caption:    { fontSize: 11, fontFamily: FONTS.medium,   letterSpacing: 0.5  },
  label:      { fontSize: 11, fontFamily: FONTS.bold,     letterSpacing: 1,   textTransform: 'uppercase' as const },
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
  mint:    { bg: '#E4FAF3', text: '#0C6E4E', dot: '#30D9A4' },
  lavender:{ bg: '#EAE8FF', text: '#3730A3', dot: '#7C6FF7' },
  peach:   { bg: '#FFF0E6', text: '#954A00', dot: '#FF8C42' },
  rose:    { bg: '#FFE8EE', text: '#9B1239', dot: '#FF5F6D' },
  sky:     { bg: '#E4F4FF', text: '#1A4E7B', dot: '#40AEFF' },
  amber:   { bg: '#FFF8E0', text: '#8A5C00', dot: '#FFCB47' },
};
