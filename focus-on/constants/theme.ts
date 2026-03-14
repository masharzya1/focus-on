// constants/theme.ts
// Duolingo-inspired design system — soft violet palette (not Duolingo green)

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

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 999,
};
// ── Typography ──────────────────────────────────────────────────────────────
// Use these in StyleSheet instead of hardcoding fontWeight strings.
// Inter loads via _layout.tsx useFonts() — always use fontFamily, not fontWeight alone.
export const FONTS = {
  regular:   'Inter_400Regular',
  medium:    'Inter_500Medium',
  semibold:  'Inter_600SemiBold',
  bold:      'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};
