import React from 'react';
import { TextCompletionBlank } from '../types';
import { CharInput } from './CharInput';
import { cn } from '@/lib/utils';

export interface WordCompletionProps {
  blank: TextCompletionBlank;
  userAnswer: string;
  showResults: boolean;
  darkMode: boolean;
  onSetRef: (key: string, el: HTMLInputElement | null) => void;
  onInput: (
    wordId: number,
    charIndex: number,
    expectedLength: number,
    action: 'type' | 'backspace' | 'delete' | 'left' | 'right' | 'up' | 'down' | 'home' | 'end' | 'tab' | 'shift-tab',
    char?: string
  ) => void;
}

export const WordCompletion: React.FC<WordCompletionProps> = ({
  blank,
  userAnswer,
  showResults,
  darkMode,
  onSetRef,
  onInput,
}) => {
  const { id, full_word, prefix } = blank;
  
  const suffix = full_word.slice(prefix.length);
  const suffixLen = suffix.length;
  const isCorrect = userAnswer.toLowerCase() === suffix.toLowerCase();

  return (
    <span className="inline-flex items-baseline whitespace-nowrap">
      <span className={darkMode ? 'text-gray-100' : 'text-gray-900'}>{prefix}</span>
      {Array.from({ length: suffixLen }).map((_, idx) => {
        const char = userAnswer[idx] || '';
        
        return (
          <CharInput
            key={idx}
            wordId={id}
            charIndex={idx}
            expectedLength={suffixLen}
            value={char}
            isCorrect={isCorrect}
            showResult={showResults}
            darkMode={darkMode}
            disabled={showResults}
            onSetRef={onSetRef}
            onInput={onInput}
          />
        );
      })}
      {showResults && !isCorrect && (
        <span className="ml-1 text-[11px] text-green-500 font-medium">
          ({full_word})
        </span>
      )}
    </span>
  );
};




