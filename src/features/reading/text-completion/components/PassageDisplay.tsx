import React from 'react';
import { TextCompletionPassage, TextCompletionBlank, isBlankPart } from '../types';
import { WordCompletion } from './WordCompletion';
import { cn } from '@/lib/utils';

export interface PassageDisplayProps {
  passage: TextCompletionPassage;
  userAnswers: Record<number, string>;
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

export const PassageDisplay: React.FC<PassageDisplayProps> = ({
  passage,
  userAnswers,
  showResults,
  darkMode,
  onSetRef,
  onInput,
}) => {
  return (
    <div
      className={cn(
        'text-[17px] leading-[1.9] text-justify tracking-normal',
        darkMode ? 'text-gray-100' : 'text-gray-900'
      )}
      style={{ fontFamily: "'Arial Narrow', 'Helvetica Condensed', Arial, sans-serif" }}
    >
      {passage.content_parts.map((part, index) => {
        if (isBlankPart(part)) {
          const blank = part as TextCompletionBlank;
          return (
            <WordCompletion
              key={index}
              blank={blank}
              userAnswer={userAnswers[blank.id] || ''}
              showResults={showResults}
              darkMode={darkMode}
              onSetRef={onSetRef}
              onInput={onInput}
            />
          );
        } else {
          return <span key={index}>{part.value}</span>;
        }
      })}
    </div>
  );
};




