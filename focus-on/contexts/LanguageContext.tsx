import React, {
  createContext, useContext, useState, useEffect, useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en, { type Locale } from '@/locales/en';
import bn from '@/locales/bn';

export type Language = 'en' | 'bn';

export const LANGUAGE_STORAGE_KEY = 'focuson_language';

const LOCALES: Record<Language, Locale> = { en, bn };

// ── Read language without React (for notifications service) ───────────────────
export async function getStoredLanguage(): Promise<Language> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'bn') return 'bn';
  } catch {}
  return 'en';
}

export async function getLocale(): Promise<Locale> {
  const lang = await getStoredLanguage();
  return LOCALES[lang];
}

// ── Context ───────────────────────────────────────────────────────────────────
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: Locale;
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: en,
  ready: false,
});

// ── Provider ──────────────────────────────────────────────────────────────────
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>('en');
  const [ready, setReady] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    getStoredLanguage().then(lang => {
      setLangState(lang);
      setReady(true);
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLangState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {}
  }, []);

  const t = LOCALES[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, ready }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Returns translation object — use as `const t = useT()` then `t.homeTitle` */
export function useT(): Locale {
  return useContext(LanguageContext).t;
}

/** Returns full language context */
export function useLanguage() {
  return useContext(LanguageContext);
}