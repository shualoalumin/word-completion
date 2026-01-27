import { useTheme } from '@/core/contexts/ThemeContext';

export interface UseDarkModeReturn {
  darkMode: boolean;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
}

export function useDarkMode(defaultValue = false): UseDarkModeReturn {
  // Use the global theme context instead of local state
  return useTheme();
}







