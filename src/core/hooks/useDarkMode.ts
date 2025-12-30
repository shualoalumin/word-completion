import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'app-dark-mode';

export interface UseDarkModeReturn {
  darkMode: boolean;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
}

export function useDarkMode(defaultValue = false): UseDarkModeReturn {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
      // Check system preference
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return true;
      }
    }
    return defaultValue;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(darkMode));
  }, [darkMode]);

  const toggle = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const enable = useCallback(() => {
    setDarkMode(true);
  }, []);

  const disable = useCallback(() => {
    setDarkMode(false);
  }, []);

  return {
    darkMode,
    toggle,
    enable,
    disable,
  };
}







