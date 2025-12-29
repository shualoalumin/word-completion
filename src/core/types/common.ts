// Common types used across the app

export interface TimeState {
  remaining: number;
  overtime: number;
  isOvertime: boolean;
  isActive: boolean;
}

export interface DarkModeState {
  darkMode: boolean;
  toggle: () => void;
}

export type ExerciseStatus = 'loading' | 'active' | 'completed';

export type Section = 'reading' | 'writing' | 'listening' | 'speaking';



