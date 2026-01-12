import React, { useState, useMemo } from 'react';
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
  elapsedTime?: number; // in seconds
  passage?: TextCompletionPassage; // 전체 passage (해석 및 어휘 추출용)
  exerciseId?: string; // exercise ID (단어장 추가용)
}

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

  // Extract full passage text from content_parts
  const fullPassageText = useMemo(() => {
    if (!passage) return '';
    return passage.content_parts
      .map((part) => {
        if (isTextPart(part)) {
          return part.value;
        } else {
          // For blanks, use the full word
          return part.full_word;
        }
      })
      .join('');
  }, [passage]);

  // Extract key vocabulary from blanks
  const keyVocabulary = useMemo(() => {
    return blanks.map((blank) => {
      // Find the sentence context for this word
      let context = '';
      if (passage) {
        const blankIndex = passage.content_parts.findIndex(
          (p) => p.type === 'blank' && (p as TextCompletionBlank).id === blank.id
        );
        
        // Get surrounding text (previous and next text parts)
        let sentenceStart = blankIndex;
        let sentenceEnd = blankIndex;
        
        // Find sentence boundaries (look for periods, exclamation, question marks)
        for (let i = blankIndex - 1; i >= 0; i--) {
          if (isTextPart(passage.content_parts[i])) {
            const text = passage.content_parts[i].value;
            if (/[.!?]\s*$/.test(text)) {
              sentenceStart = i;
              break;
            }
          }
          if (i === 0) sentenceStart = 0;
        }
        
        for (let i = blankIndex + 1; i < passage.content_parts.length; i++) {
          if (isTextPart(passage.content_parts[i])) {
            const text = passage.content_parts[i].value;
            if (/[.!?]/.test(text)) {
              sentenceEnd = i;
              break;
            }
          }
          if (i === passage.content_parts.length - 1) sentenceEnd = passage.content_parts.length - 1;
        }
        
        // Build context sentence
        context = passage.content_parts
          .slice(sentenceStart, sentenceEnd + 1)
          .map((p) => {
            if (isTextPart(p)) return p.value;
            if ((p as TextCompletionBlank).id === blank.id) return blank.full_word;
            return (p as TextCompletionBlank).full_word;
          })
          .join('')
          .trim();
      }
      
      return {
        word: blank.full_word,
        definition: blank.clue || undefined,
        context: context || fullPassageText,
      };
    });
  }, [blanks, passage, fullPassageText]);

  const handleAddWord = async (word: string, context: string) => {
    if (!exerciseId) {
      toast.error('Exercise ID not available');
      return;
    }

    setAddingWords((prev) => new Set(prev).add(word));

    const vocabWord = keyVocabulary.find((v) => v.word === word);
    const result = await addWordToVocabulary({
      word: word,
      definition: vocabWord?.definition,
      exampleSentence: vocabWord?.context,
      sourceContext: context,
      sourcePassageId: exerciseId,
      addedFrom: 'auto_extract',
    });

    setAddingWords((prev) => {
      const next = new Set(prev);
      next.delete(word);
      return next;
    });

    if (result.success) {
      setAddedWords((prev) => new Set(prev).add(word));
      toast.success(`"${word}" added to your vocabulary!`);
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
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={darkMode ? '#27272a' : '#e5e7eb'}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
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

  return (
    <div className="space-y-6">
      {/* Score Summary Card */}
      <div className={cn(
        "p-6 rounded-2xl border",
        darkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-gray-50 border-gray-200"
      )}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Circular Progress */}
          <CircularProgress value={percentage} />

          {/* Stats */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className={cn("text-2xl font-bold mb-1", performance.color)}>
              {performance.text}
            </h2>
            <p className={cn("text-sm mb-4", darkMode ? "text-zinc-400" : "text-gray-600")}>
              You got {correctCount} out of {totalCount} correct
            </p>

            <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
              {/* Time */}
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

              {/* Topic */}
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

      {/* Interpretation Section */}
      {fullPassageText && (
        <div className={cn('border-t pt-6', darkMode ? 'border-zinc-800' : 'border-gray-200')}>
          <h3 className={cn('text-lg font-bold mb-4 flex items-center gap-2', darkMode ? 'text-gray-100' : 'text-gray-900')}>
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            Passage Interpretation
          </h3>
          <div className={cn(
            'p-4 rounded-lg border',
            darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-200'
          )}>
            <p className={cn('text-sm leading-relaxed', darkMode ? 'text-zinc-300' : 'text-gray-700')}>
              {fullPassageText}
            </p>
            <p className={cn('text-xs mt-3 italic', darkMode ? 'text-zinc-500' : 'text-gray-500')}>
              💡 Full passage interpretation will be available soon with AI-powered translations.
            </p>
          </div>
        </div>
      )}

      {/* Key Vocabulary Section */}
      {keyVocabulary.length > 0 && (
        <div className={cn('border-t pt-6', darkMode ? 'border-zinc-800' : 'border-gray-200')}>
          <h3 className={cn('text-lg font-bold mb-4 flex items-center gap-2', darkMode ? 'text-gray-100' : 'text-gray-900')}>
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Key Vocabulary
          </h3>
          <div className="grid gap-3">
            {keyVocabulary.map((vocab) => {
              const isAdding = addingWords.has(vocab.word);
              const isAdded = addedWords.has(vocab.word);
              
              return (
                <div
                  key={vocab.word}
                  className={cn(
                    'p-4 rounded-lg border',
                    darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className={cn('font-bold text-lg', darkMode ? 'text-white' : 'text-gray-900')}>
                          {vocab.word}
                        </h4>
                        {isAdded && (
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            darkMode ? 'bg-emerald-800 text-emerald-200' : 'bg-emerald-100 text-emerald-800'
                          )}>
                            ✓ Added
                          </span>
                        )}
                      </div>
                      {vocab.definition && (
                        <p className={cn('text-sm mb-2', darkMode ? 'text-zinc-400' : 'text-gray-600')}>
                          {vocab.definition}
                        </p>
                      )}
                      {vocab.context && (
                        <p className={cn('text-xs italic', darkMode ? 'text-zinc-500' : 'text-gray-500')}>
                          "{vocab.context}"
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isAdding || isAdded}
                      onClick={() => handleAddWord(vocab.word, vocab.context)}
                      className={cn(
                        'shrink-0',
                        isAdded && 'opacity-50 cursor-not-allowed'
                      )}
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
                          Added
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};







