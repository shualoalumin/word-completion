import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TextCompletionBlank, TextCompletionPassage, isTextPart } from '../types';
import { cn } from '@/lib/utils';
import { addWordToVocabulary } from '../api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export interface ResultsPanelProps {
  blanks: TextCompletionBlank[];
  userAnswers: Record<number, string>;
  darkMode: boolean;
  topic?: string;
  elapsedTime?: number;
  passage?: TextCompletionPassage;
  exerciseId?: string;
}

// Word popup component for clicking words in passage
interface WordPopupProps {
  word: string;
  position: { x: number; y: number };
  darkMode: boolean;
  onClose: () => void;
  onAddToVocabulary: () => void;
  isAdding: boolean;
  isAdded: boolean;
  context: string;
}

const WordPopup: React.FC<WordPopupProps> = ({
  word,
  position,
  darkMode,
  onClose,
  onAddToVocabulary,
  isAdding,
  isAdded,
  context,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className={cn(
        'fixed z-50 p-4 rounded-xl shadow-2xl border max-w-xs animate-in fade-in zoom-in-95 duration-200',
        darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'
      )}
      style={{
        left: Math.min(position.x, window.innerWidth - 320),
        top: position.y + 10,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className={cn('font-bold text-lg', darkMode ? 'text-white' : 'text-gray-900')}>
          {word}
        </h4>
        <button
          onClick={onClose}
          className={cn(
            'p-1 rounded hover:bg-opacity-20',
            darkMode ? 'hover:bg-white text-zinc-400' : 'hover:bg-gray-100 text-gray-500'
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className={cn('text-sm mb-3', darkMode ? 'text-zinc-400' : 'text-gray-600')}>
        Click below to add this word to your vocabulary list for spaced repetition review.
      </p>

      <Button
        size="sm"
        className={cn(
          'w-full',
          isAdded 
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        )}
        disabled={isAdding || isAdded}
        onClick={onAddToVocabulary}
      >
        {isAdding ? (
          <>
            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Adding...
          </>
        ) : isAdded ? (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Added to Vocabulary
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add to Vocabulary
          </>
        )}
      </Button>
    </div>
  );
};

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  blanks,
  userAnswers,
  darkMode,
  topic,
  elapsedTime,
  passage,
  exerciseId,
}) => {
  const [addingWords, setAddingWords] = useState<Set<string>>(new Set());
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    position: { x: number; y: number };
    context: string;
  } | null>(null);

  // Extract full passage text from content_parts
  const fullPassageText = useMemo(() => {
    if (!passage) return '';
    return passage.content_parts
      .map((part) => {
        if (isTextPart(part)) {
          return part.value;
        } else {
          return part.full_word;
        }
      })
      .join('');
  }, [passage]);

  // Handle word click in passage
  const handleWordClick = (e: React.MouseEvent, word: string) => {
    // Clean the word (remove punctuation)
    const cleanWord = word.replace(/[.,!?;:'"()]/g, '').trim();
    if (cleanWord.length < 2) return; // Skip very short words

    setSelectedWord({
      word: cleanWord.toLowerCase(),
      position: { x: e.clientX, y: e.clientY },
      context: fullPassageText,
    });
  };

  const handleAddWord = async (word: string, context: string) => {
    if (!exerciseId) {
      toast.error('Exercise ID not available');
      return;
    }

    setAddingWords((prev) => new Set(prev).add(word));

    const result = await addWordToVocabulary({
      word: word,
      sourceContext: context,
      sourcePassageId: exerciseId,
      addedFrom: 'manual',
    });

    setAddingWords((prev) => {
      const next = new Set(prev);
      next.delete(word);
      return next;
    });

    if (result.success) {
      setAddedWords((prev) => new Set(prev).add(word));
      toast.success(`"${word}" added to your vocabulary!`);
      setSelectedWord(null);
    } else {
      toast.error(result.error?.message || 'Failed to add word');
    }
  };

  // Calculate score
  const correctCount = blanks.filter((blank) => {
    const userSuffix = userAnswers[blank.id] || '';
    const correctSuffix = blank.full_word.slice(blank.prefix.length);
    return userSuffix.toLowerCase() === correctSuffix.toLowerCase();
  }).length;

  const totalCount = blanks.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get performance message
  const getPerformanceMessage = () => {
    if (percentage >= 90) return { text: "Excellent! 🎉", color: "text-emerald-400" };
    if (percentage >= 70) return { text: "Good job! 👍", color: "text-blue-400" };
    if (percentage >= 50) return { text: "Keep practicing! 💪", color: "text-amber-400" };
    return { text: "Don't give up! 📚", color: "text-red-400" };
  };

  const performance = getPerformanceMessage();

  // Circular progress component
  const CircularProgress = ({ value, size = 120 }: { value: number; size?: number }) => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={darkMode ? '#27272a' : '#e5e7eb'}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={value >= 70 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold", darkMode ? "text-white" : "text-gray-900")}>
            {value}%
          </span>
          <span className={cn("text-xs", darkMode ? "text-zinc-400" : "text-gray-500")}>
            {correctCount}/{totalCount}
          </span>
        </div>
      </div>
    );
  };

  // Render clickable passage text
  const renderClickablePassage = () => {
    // Split text into words while preserving spaces and punctuation
    const words = fullPassageText.split(/(\s+)/);
    
    return words.map((segment, index) => {
      // Check if it's whitespace
      if (/^\s+$/.test(segment)) {
        return <span key={index}>{segment}</span>;
      }
      
      // It's a word - make it clickable
      const cleanWord = segment.replace(/[.,!?;:'"()]/g, '').trim();
      const isClickable = cleanWord.length >= 2;
      const isWordAdded = addedWords.has(cleanWord.toLowerCase());
      
      return (
        <span
          key={index}
          onClick={isClickable ? (e) => handleWordClick(e, segment) : undefined}
          className={cn(
            isClickable && 'cursor-pointer hover:bg-blue-500/20 hover:text-blue-400 rounded px-0.5 transition-colors',
            isWordAdded && 'bg-emerald-500/20 text-emerald-400'
          )}
        >
          {segment}
        </span>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Word Popup */}
      {selectedWord && (
        <WordPopup
          word={selectedWord.word}
          position={selectedWord.position}
          darkMode={darkMode}
          onClose={() => setSelectedWord(null)}
          onAddToVocabulary={() => handleAddWord(selectedWord.word, selectedWord.context)}
          isAdding={addingWords.has(selectedWord.word)}
          isAdded={addedWords.has(selectedWord.word)}
          context={selectedWord.context}
        />
      )}

      {/* Score Summary Card */}
      <div className={cn(
        "p-6 rounded-2xl border",
        darkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-gray-50 border-gray-200"
      )}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <CircularProgress value={percentage} />

          <div className="flex-1 text-center sm:text-left">
            <h2 className={cn("text-2xl font-bold mb-1", performance.color)}>
              {performance.text}
            </h2>
            <p className={cn("text-sm mb-4", darkMode ? "text-zinc-400" : "text-gray-600")}>
              You got {correctCount} out of {totalCount} correct
            </p>

            <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
              {elapsedTime !== undefined && (
                <div className={cn(
                  "px-4 py-2 rounded-lg",
                  darkMode ? "bg-zinc-800" : "bg-gray-100"
                )}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={cn("text-sm font-medium", darkMode ? "text-white" : "text-gray-900")}>
                      {formatTime(elapsedTime)}
                    </span>
                  </div>
                  <p className={cn("text-xs mt-1", darkMode ? "text-zinc-500" : "text-gray-500")}>
                    Time Taken
                  </p>
                </div>
              )}

              {topic && (
                <div className={cn(
                  "px-4 py-2 rounded-lg",
                  darkMode ? "bg-zinc-800" : "bg-gray-100"
                )}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className={cn("text-sm font-medium", darkMode ? "text-white" : "text-gray-900")}>
                      {topic}
                    </span>
                  </div>
                  <p className={cn("text-xs mt-1", darkMode ? "text-zinc-500" : "text-gray-500")}>
                    Topic
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Answers */}
      <div className={cn('border-t pt-6', darkMode ? 'border-zinc-800' : 'border-gray-200')}>
        <h3 className={cn('text-lg font-bold mb-4', darkMode ? 'text-gray-100' : 'text-gray-900')}>
          Answers & Explanations
        </h3>
        <div className="grid gap-3">
          {blanks.map((blank) => {
            const userSuffix = userAnswers[blank.id] || '';
            const correctSuffix = blank.full_word.slice(blank.prefix.length);
            const isCorrect = userSuffix.toLowerCase() === correctSuffix.toLowerCase();

            return (
              <div
                key={blank.id}
                className={cn(
                  'p-3 rounded-lg border',
                  isCorrect
                    ? darkMode
                      ? 'bg-emerald-900/20 border-emerald-800'
                      : 'bg-green-50 border-green-200'
                    : darkMode
                      ? 'bg-red-900/20 border-red-800'
                      : 'bg-red-50 border-red-200'
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1',
                      isCorrect
                        ? darkMode
                          ? 'bg-emerald-800 text-emerald-200'
                          : 'bg-green-200 text-green-800'
                        : darkMode
                          ? 'bg-red-800 text-red-200'
                          : 'bg-red-200 text-red-800'
                    )}
                  >
                    {isCorrect ? '✓' : '✗'} {blank.id}
                  </span>
                  <div className="flex-1">
                    <p className={cn('font-semibold', darkMode ? 'text-gray-100' : 'text-gray-900')}>
                      {blank.prefix}
                      <span className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                        {correctSuffix}
                      </span>
                      {!isCorrect && userSuffix && (
                        <span className="text-red-400 line-through ml-2 opacity-60">
                          {blank.prefix}{userSuffix}
                        </span>
                      )}
                    </p>
                    <p className={cn('text-sm mt-1', darkMode ? 'text-zinc-400' : 'text-gray-600')}>
                      {blank.clue || 'Common word used in academic contexts.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Passage Interpretation - Clickable Words */}
      {fullPassageText && (
        <div className={cn('border-t pt-6', darkMode ? 'border-zinc-800' : 'border-gray-200')}>
          <h3 className={cn('text-lg font-bold mb-4 flex items-center gap-2', darkMode ? 'text-gray-100' : 'text-gray-900')}>
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            Passage Interpretation
          </h3>
          
          {/* English Original - Clickable */}
          <div className={cn(
            'p-4 rounded-lg border mb-3',
            darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-200'
          )}>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded',
                darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
              )}>
                English
              </span>
              <span className={cn('text-xs', darkMode ? 'text-zinc-500' : 'text-gray-500')}>
                Click any word to add to vocabulary
              </span>
            </div>
            <p className={cn('text-sm leading-relaxed', darkMode ? 'text-zinc-300' : 'text-gray-700')}>
              {renderClickablePassage()}
            </p>
          </div>

          {/* Korean Translation */}
          <div className={cn(
            'p-4 rounded-lg border',
            darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-200'
          )}>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded',
                darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
              )}>
                한국어
              </span>
            </div>
            <p className={cn('text-sm leading-relaxed italic', darkMode ? 'text-zinc-400' : 'text-gray-600')}>
              💡 AI 기반 한국어 번역이 곧 제공될 예정입니다. 지금은 원문의 단어를 클릭하여 단어장에 추가할 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
