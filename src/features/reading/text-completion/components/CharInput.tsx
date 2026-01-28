import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface CharInputProps {
  wordId: number;
  charIndex: number;
  expectedLength: number;
  value: string;
  isCorrect: boolean;
  showResult: boolean;
  darkMode: boolean;
  disabled?: boolean;
  onSetRef: (key: string, el: HTMLInputElement | null) => void;
  onInput: (
    wordId: number,
    charIndex: number,
    expectedLength: number,
    action: 'type' | 'backspace' | 'delete' | 'left' | 'right' | 'up' | 'down' | 'home' | 'end' | 'tab' | 'shift-tab',
    char?: string
  ) => void;
}

export const CharInput = React.memo<CharInputProps>(({
  wordId,
  charIndex,
  expectedLength,
  value,
  isCorrect,
  showResult,
  darkMode,
  disabled = false,
  onSetRef,
  onInput,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      onSetRef(`${wordId}-${charIndex}`, inputRef.current);
    }
    return () => {
      onSetRef(`${wordId}-${charIndex}`, null);
    };
  }, [wordId, charIndex, onSetRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    const navKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];
    if (navKeys.includes(e.key)) {
      e.preventDefault();
    }

    switch (e.key) {
      case 'Backspace':
        onInput(wordId, charIndex, expectedLength, 'backspace');
        break;
      case 'Delete':
        onInput(wordId, charIndex, expectedLength, 'delete');
        break;
      case 'ArrowLeft':
        onInput(wordId, charIndex, expectedLength, 'left');
        break;
      case 'ArrowRight':
        onInput(wordId, charIndex, expectedLength, 'right');
        break;
      case 'ArrowUp':
        onInput(wordId, charIndex, expectedLength, 'up');
        break;
      case 'ArrowDown':
        onInput(wordId, charIndex, expectedLength, 'down');
        break;
      case 'Home':
        onInput(wordId, charIndex, expectedLength, 'home');
        break;
      case 'End':
        onInput(wordId, charIndex, expectedLength, 'end');
        break;
      case 'Tab':
        onInput(wordId, charIndex, expectedLength, e.shiftKey ? 'shift-tab' : 'tab');
        break;
    }
  };

  const handleBeforeInput = (e: React.FormEvent<HTMLInputElement>) => {
    // We don't preventDefault here anymore to support all input methods (like IME).
    // Validation is handled in onChange and the parent onInput handler.
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const typedChar = newValue.slice(-1);

    // Double check regex in case onBeforeInput isn't supported
    if (typedChar && /^[a-zA-Z]$/.test(typedChar)) {
      onInput(wordId, charIndex, expectedLength, 'type', typedChar);
    }
  };

  // Determine styling
  let textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  let borderColor = darkMode ? 'border-gray-500' : 'border-gray-600';

  if (showResult) {
    if (isCorrect) {
      textColor = 'text-green-500';
      borderColor = 'border-green-500';
    } else {
      textColor = 'text-red-500';
      borderColor = 'border-red-500';
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="text"
      pattern="[a-zA-Z]*"
      autoCapitalize="off"
      autoCorrect="off"
      autoComplete="off"
      spellCheck={false}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBeforeInput={handleBeforeInput}
      disabled={disabled}
      className={cn(
        'w-[11px] h-[20px]',
        darkMode ? 'mx-[1px]' : 'mx-[0.5px]',
        'text-center text-[17px]',
        'border-b-2',
        borderColor,
        textColor,
        'bg-transparent outline-none',
        'focus:border-blue-500',
        darkMode ? 'focus:bg-blue-900/40' : 'focus:bg-blue-100/60',
        'disabled:cursor-default',
        'p-0 leading-tight',
        'caret-blue-500'
      )}
      style={{
        fontFamily: "'Arial Narrow', 'Helvetica Condensed', Arial, sans-serif",
      }}
    />
  );
});

CharInput.displayName = 'CharInput';
