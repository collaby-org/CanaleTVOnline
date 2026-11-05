'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lang } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Theme — forced dark (layout script sets localStorage theme=dark and removes
// theme_manual). Toggle is a noop to keep the upstream appearance.
// ---------------------------------------------------------------------------

interface ThemeContextValue {
  theme: 'dark';
  setTheme: (t: 'dark') => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  toggle: () => {},
});

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme] = useState<'dark'>('dark');

  useEffect(() => {
    try {
      localStorage.setItem('theme', 'dark');
      localStorage.removeItem('theme_manual');
      document.documentElement.setAttribute('data-theme', 'dark');
    } catch {
      /* ignore */
    }
  }, []);

  const setTheme = useCallback((_t: 'dark') => {
    /* noop — forced dark */
  }, []);

  const toggle = useCallback(() => {
    /* noop — forced dark */
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);

// ---------------------------------------------------------------------------
// Language — tv_lang in localStorage, default 'ro'.
// ---------------------------------------------------------------------------

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const LangContext = createContext<LangContextValue>({
  lang: 'ro',
  setLang: () => {},
  toggle: () => {},
});

function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'ro';
    try {
      const v = localStorage.getItem('tv_lang');
      return v === 'en' || v === 'ro' ? v : 'ro';
    } catch {
      return 'ro';
    }
  });

  useEffect(() => {
    try {
      const v = localStorage.getItem('tv_lang');
      if (v === 'en' || v === 'ro') setLangState(v);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('tv_lang', l);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute('lang', l);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === 'ro' ? 'en' : 'ro');
  }, [lang, setLang]);

  return <LangContext.Provider value={{ lang, setLang, toggle }}>{children}</LangContext.Provider>;
}

export const useLang = (): LangContextValue => useContext(LangContext);

// ---------------------------------------------------------------------------
// Combined Providers (used by app/layout.tsx).
// ---------------------------------------------------------------------------

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LangProvider>{children}</LangProvider>
    </ThemeProvider>
  );
}
