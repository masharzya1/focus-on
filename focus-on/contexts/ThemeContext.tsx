import React, { createContext, useContext } from 'react';
import { DarkTheme, LightTheme, type ThemeColors } from '@/constants/theme';
import { useStudy } from '@/contexts/StudyContext';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({ colors: LightTheme, isDark: false });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state } = useStudy();
  const isDark = state.settings.theme === 'dark';
  const colors = isDark ? DarkTheme : LightTheme;
  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
