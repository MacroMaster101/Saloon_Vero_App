import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePref = 'light' | 'dark' | 'system';
export type ResolvedScheme = 'light' | 'dark';

const STORAGE_KEY = 'saloon_vero_theme_pref';

type ThemePreferenceValue = {
  pref: ThemePref;
  setPref: (pref: ThemePref) => void;
  resolvedScheme: ResolvedScheme;
};

const ThemePreferenceContext = createContext<ThemePreferenceValue | undefined>(undefined);

export function cycleThemePref(pref: ThemePref): ThemePref {
  return pref === 'light' ? 'dark' : pref === 'dark' ? 'system' : 'light';
}

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const system: ResolvedScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [pref, setPrefState] = useState<ThemePref>('system');
  const userActed = useRef(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (cancelled) return;
        if (userActed.current) return;
        if (saved === 'light' || saved === 'dark' || saved === 'system') setPrefState(saved);
      })
      .catch(() => {}); // storage failure -> stay on 'system'
    return () => { cancelled = true; };
  }, []);

  const value = useMemo<ThemePreferenceValue>(() => ({
    pref,
    resolvedScheme: pref === 'system' ? system : pref,
    setPref: (next: ThemePref) => {
      userActed.current = true;
      setPrefState(next);
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    },
  }), [pref, system]);

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference(): ThemePreferenceValue {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  return ctx;
}

// Optional variant for useTheme(): falls back when no provider (tests, isolated renders).
export function useOptionalThemePreference(): ThemePreferenceValue | undefined {
  return useContext(ThemePreferenceContext);
}
