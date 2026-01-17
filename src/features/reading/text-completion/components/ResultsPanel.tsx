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
}

const WordPopup: React.FC<WordPopupProps> = ({
  word,
  position,
  darkMode,
  onClose,
  onAddToVocabulary,
  isAdding,
  isAdded,
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
        'fixed z-50 p-3 rounded-lg shadow-xl border animate-in fade-in zoom-in-95 duration-150',
        darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'
      )}
      style={{
        left: Math.min(position.x - 80, window.innerWidth - 200),
        top: position.y + 10,
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className={cn('font-bold', darkMode ? 'text-white' : 'text-gray-900')}>
          {word}
        </span>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <Button
        size="sm"
        className={cn(
          'w-full text-xs',
          isAdded ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
        )}
        disabled={isAdding || isAdded}
        onClick={onAddToVocabulary}
      >
        {isAdding ? 'Adding...' : isAdded ? '✓ Added' : '+ Add to Vocabulary'}
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
  const [showPassage, setShowPassage] = useState(false);

  // Extract full passage text
  const fullPassageText = useMemo(() => {
    if (!passage) return '';
    return passage.content_parts
      .map((part) => (isTextPart(part) ? part.value : part.full_word))
      .join('');
  }, [passage]);

  const handleWordClick = (e: React.MouseEvent, word: string) => {
    const cleanWord = word.replace(/[.,!?;:'"()]/g, '').trim();
    if (cleanWord.length < 2) return;
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
      word,
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
      toast.success(`"${word}" added!`);
      setSelectedWord(null);
    } else {
      toast.error(result.error?.message || 'Failed');
    }
  };

  // Calculate score
  const results = blanks.map((blank) => {
    const userSuffix = userAnswers[blank.id] || '';
    const correctSuffix = blank.full_word.slice(blank.prefix.length);
    const isCorrect = userSuffix.toLowerCase() === correctSuffix.toLowerCase();
    return { blank, userSuffix, correctSuffix, isCorrect };
  });
  
  const correctCount = results.filter(r => r.isCorrect).length;
  const totalCount = blanks.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = () => {
    if (percentage >= 90) return 'text-emerald-400';
    if (percentage >= 70) return 'text-blue-400';
    if (percentage >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = () => {
    if (percentage >= 90) return 'from-emerald-600/20 to-emerald-600/5';
    if (percentage >= 70) return 'from-blue-600/20 to-blue-600/5';
    if (percentage >= 50) return 'from-amber-600/20 to-amber-600/5';
    return 'from-red-600/20 to-red-600/5';
  };

  const renderClickablePassage = () => {
    const words = fullPassageText.split(/(\s+)/);
    return words.map((segment, index) => {
      if (/^\s+$/.test(segment)) return <span key={index}>{segment}</span>;
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
    <div className="space-y-4">
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
        />
      )}

      {/* Compact Score Header - Khan Academy Style */}
      <div className={cn(
        "p-4 rounded-xl border bg-gradient-to-r",
        getScoreBg(),
        darkMode ? "border-zinc-800" : "border-gray-200"
      )}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Score Circle */}
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-16 h-16 rounded-full flex flex-col items-center justify-center border-4",
              percentage >= 70 ? "border-emerald-500" : percentage >= 50 ? "border-amber-500" : "border-red-500"
            )}>
              <span className={cn("text-xl font-bold", getScoreColor())}>{percentage}%</span>
            </div>
            <div>
              <p className={cn("font-bold text-lg", getScoreColor())}>
                {percentage >= 90 ? "Excellent! 🎉" : percentage >= 70 ? "Good job! 👍" : percentage >= 50 ? "Keep going! 💪" : "Practice more! 📚"}
              </p>
              <p className={cn("text-sm", darkMode ? "text-zinc-400" : "text-gray-600")}>
                {correctCount}/{totalCount} correct
              </p>
            </div>
          </div>

          {/* Stats Pills */}
          <div className="flex items-center gap-3">
            {elapsedTime !== undefined && (
              <div className={cn(
                "px-3 py-1.5 rounded-full text-sm flex items-center gap-2",
                darkMode ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-700"
              )}>
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(elapsedTime)}
              </div>
            )}
            {topic && (
              <div className={cn(
                "px-3 py-1.5 rounded-full text-sm flex items-center gap-2 max-w-[200px] truncate",
                darkMode ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-700"
              )}>
                <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="truncate">{topic}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Answers Grid - 5 columns x 2 rows (Duolingo Style) */}
      <div className={cn('p-4 rounded-xl border', darkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-gray-50 border-gray-200')}>
        <h3 className={cn('text-sm font-semibold mb-3 flex items-center gap-2', darkMode ? 'text-zinc-300' : 'text-gray-700')}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Answers
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {results.map(({ blank, correctSuffix, isCorrect }) => (
            <div
              key={blank.id}
              className={cn(
                'p-2 rounded-lg text-center border transition-all hover:scale-105',
                isCorrect
                  ? darkMode ? 'bg-emerald-900/30 border-emerald-700' : 'bg-green-50 border-green-300'
                  : darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-300'
              )}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded',
                  isCorrect
                    ? darkMode ? 'bg-emerald-800 text-emerald-200' : 'bg-green-200 text-green-800'
                    : darkMode ? 'bg-red-800 text-red-200' : 'bg-red-200 text-red-800'
                )}>
                  {isCorrect ? '✓' : '✗'} {blank.id}
                </span>
              </div>
              <p className={cn(
                'text-xs font-medium truncate',
                darkMode ? 'text-white' : 'text-gray-900'
              )} title={blank.full_word}>
                {blank.prefix}<span className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>{correctSuffix}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible Passage Section - Testglide Style */}
      {fullPassageText && (
        <div className={cn('rounded-xl border overflow-hidden', darkMode ? 'border-zinc-800' : 'border-gray-200')}>
          <button
            onClick={() => setShowPassage(!showPassage)}
            className={cn(
              'w-full px-4 py-3 flex items-center justify-between text-left transition-colors',
              darkMode ? 'bg-zinc-900/50 hover:bg-zinc-900/70' : 'bg-gray-50 hover:bg-gray-100'
            )}
          >
            <span className={cn('text-sm font-semibold flex items-center gap-2', darkMode ? 'text-zinc-300' : 'text-gray-700')}>
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Full Passage & Vocabulary
              <span className={cn('text-xs px-2 py-0.5 rounded', darkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-500')}>
                Click words to save
              </span>
            </span>
            <svg 
              className={cn('w-5 h-5 transition-transform', showPassage && 'rotate-180', darkMode ? 'text-zinc-400' : 'text-gray-500')}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showPassage && (
            <div className={cn('p-4 border-t max-h-64 overflow-y-auto', darkMode ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-200')}>
              <p className={cn('text-sm leading-relaxed', darkMode ? 'text-zinc-300' : 'text-gray-700')}>
                {renderClickablePassage()}
              </p>
              <p className={cn('text-xs mt-3 pt-3 border-t', darkMode ? 'text-zinc-500 border-zinc-700' : 'text-gray-500 border-gray-200')}>
                💡 AI 기반 한국어 번역이 곧 제공될 예정입니다.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
