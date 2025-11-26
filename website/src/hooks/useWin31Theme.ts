import { useState, useEffect, useCallback } from 'react';

// Windows 3.1 Color Schemes
export const COLOR_SCHEMES = {
  'Windows Default': {
    desktop: '#008080',
    gray: '#c0c0c0',
    navy: '#000080',
    highlight: '#000080',
  },
  'Hot Dog Stand': {
    desktop: '#FF0000',
    gray: '#FFFF00',
    navy: '#FF0000',
    highlight: '#FF0000',
  },
  'Fluorescent': {
    desktop: '#FF00FF',
    gray: '#00FFFF',
    navy: '#FF00FF',
    highlight: '#00FF00',
  },
  'Ocean': {
    desktop: '#000080',
    gray: '#c0c0c0',
    navy: '#000040',
    highlight: '#0000FF',
  },
  'Plasma Power Saver': {
    desktop: '#000000',
    gray: '#404040',
    navy: '#800080',
    highlight: '#FF00FF',
  },
  'Pumpkin (Large)': {
    desktop: '#804000',
    gray: '#FF8000',
    navy: '#804000',
    highlight: '#FFFF00',
  },
  'Rugby': {
    desktop: '#004000',
    gray: '#c0c0c0',
    navy: '#004000',
    highlight: '#008000',
  },
};

export type ThemeName = keyof typeof COLOR_SCHEMES;

const STORAGE_KEY = 'win31-theme';

export function useWin31Theme() {
  const [colorScheme, setColorScheme] = useState<ThemeName>('Windows Default');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved in COLOR_SCHEMES) {
        setColorScheme(saved as ThemeName);
      }
      setIsLoaded(true);
    }
  }, []);

  // Apply theme to CSS variables
  useEffect(() => {
    if (!isLoaded) return;

    const scheme = COLOR_SCHEMES[colorScheme];
    if (scheme) {
      document.documentElement.style.setProperty('--win31-desktop', scheme.desktop);
      document.documentElement.style.setProperty('--win31-gray', scheme.gray);
      document.documentElement.style.setProperty('--win31-navy', scheme.navy);
      document.documentElement.style.setProperty('--win31-active-title', scheme.highlight);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, colorScheme);
    }
  }, [colorScheme, isLoaded]);

  const setTheme = useCallback((theme: ThemeName) => {
    setColorScheme(theme);
  }, []);

  return {
    colorScheme,
    setTheme,
    themes: Object.keys(COLOR_SCHEMES) as ThemeName[],
    isLoaded,
  };
}
