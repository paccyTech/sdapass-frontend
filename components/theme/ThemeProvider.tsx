'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

const isValidTheme = (value: string | null): value is Theme => value === 'light' || value === 'dark';

const resolveInitialTheme = (storageKey: string, fallback: Theme): Theme => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const stored = window.localStorage.getItem(storageKey);
  if (isValidTheme(stored)) {
    return stored;
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
};

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'sda-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => resolveInitialTheme(storageKey, defaultTheme));

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey && isValidTheme(event.newValue)) {
        setThemeState(event.newValue);
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (event: MediaQueryListEvent) => {
      const stored = window.localStorage.getItem(storageKey);
      if (!isValidTheme(stored)) {
        setThemeState(event.matches ? 'dark' : 'light');
      }
    };

    window.addEventListener('storage', handleStorage);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [storageKey]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
