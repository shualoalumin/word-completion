// Text Completion specific types
// Import from core and re-export
import type {
  TextCompletionBlank as CoreTextCompletionBlank,
  TextCompletionText as CoreTextCompletionText,
  TextCompletionPart as CoreTextCompletionPart,
  TextCompletionPassage as CoreTextCompletionPassage,
} from '@/core/types/exercise';

import {
  isBlankPart as coreIsBlankPart,
  isTextPart as coreIsTextPart,
} from '@/core/types/exercise';

// Re-export types
export type TextCompletionBlank = CoreTextCompletionBlank;
export type TextCompletionText = CoreTextCompletionText;
export type TextCompletionPart = CoreTextCompletionPart;
export type TextCompletionPassage = CoreTextCompletionPassage;

// Re-export functions
export const isBlankPart = coreIsBlankPart;
export const isTextPart = coreIsTextPart;

// Local types specific to this feature
export type UserAnswers = Record<number, string>;

export interface BlankInputRef {
  wordId: number;
  charIndex: number;
}
