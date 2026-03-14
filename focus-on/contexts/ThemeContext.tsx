import React, { createContext, useContext } from 'react';
import { DarkTheme, LightTheme, type ThemeColors } from '@/constants/theme';
import { useStudy } from '@/contexts/StudyContext';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
<<<<<<< HEAD
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: LightTheme, isDark: false, toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state, updateSettings } = useStudy();
  const isDark = state.settings.theme === 'dark';
  const colors = isDark ? DarkTheme : LightTheme;
  const toggleTheme = () => updateSettings({ theme: isDark ? 'light' : 'dark' });
  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
=======
}

const ThemeContext = createContext<ThemeContextValue>({ colors: LightTheme, isDark: false });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state } = useStudy();
  const isDark = state.settings.theme === 'dark';
  const colors = isDark ? DarkTheme : LightTheme;
  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
>>>>>>> b93ddc6cdfd0366af8025e7a43d07f99ca6de32d
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
