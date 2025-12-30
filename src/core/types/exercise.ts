// Exercise-related types

import { Section, ExerciseStatus } from './common';

/**
 * Base configuration for all exercise types
 */
export interface ExerciseConfig {
  id: string;
  section: Section;
  type: string;
  timerDuration: number;  // in seconds
  totalQuestions: number;
}

/**
 * Generic exercise state
 */
export interface ExerciseState<TQuestion = unknown, TAnswer = unknown> {
  config: ExerciseConfig;
  questions: TQuestion[];
  answers: Record<number, TAnswer>;
  status: ExerciseStatus;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Result after completing an exercise
 */
export interface ExerciseResult {
  score: number;
  total: number;
  duration: number;      // in seconds
  isOvertime: boolean;
  overtimeDuration: number;
}

/**
 * Answer detail for review
 */
export interface AnswerDetail<TQuestion = unknown, TAnswer = unknown> {
  questionId: number;
  question: TQuestion;
  userAnswer: TAnswer;
  correctAnswer: TAnswer;
  isCorrect: boolean;
  explanation?: string;
}

// ============================================
// Text Completion specific types
// ============================================

export interface TextCompletionBlank {
  type: 'blank';
  id: number;
  full_word: string;
  prefix: string;
  clue?: string;
}

export interface TextCompletionText {
  type: 'text';
  value: string;
}

export type TextCompletionPart = TextCompletionText | TextCompletionBlank;

export interface TextCompletionPassage {
  topic: string;
  content_parts: TextCompletionPart[];
}

// Type guard for blank parts
export function isBlankPart(part: TextCompletionPart): part is TextCompletionBlank {
  return part.type === 'blank';
}

// Type guard for text parts
export function isTextPart(part: TextCompletionPart): part is TextCompletionText {
  return part.type === 'text';
}







