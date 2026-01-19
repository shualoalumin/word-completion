import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TextCompletionBlank, TextCompletionPassage, isTextPart } from '../types';
import { cn } from '@/lib/utils';
import { addWordToVocabulary, bookmarkExercise, unbookmarkExercise, checkBookmark } from '../api';
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

// Naver Dictionary style word popup
interface WordPopupProps {
  word: string;
  position: { x: number; y: number };
  darkMode: boolean;
  onClose: () => void;
  onAddToVocabulary: () => void;
  isAdding: boolean;
  isAdded: boolean;
}

// Translation helper function - Improved quality with DeepL-like API fallback
const translateToKorean = async (text: string): Promise<string | null> => {
  try {
    // Try LibreTranslate first (better quality, free)
    try {
      const libreResponse = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: 'ko',
          format: 'text',
        }),
      });

      if (libreResponse.ok) {
        const data = await libreResponse.json();
        if (data.translatedText) {
          return data.translatedText;
        }
      }
    } catch {
      // Fallback to MyMemory
    }

    // Fallback: MyMemory (split long texts)
    const maxLength = 450;
    if (text.length <= maxLength) {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ko`
      );
      const data = await response.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
      return null;
    }
    
    // For longer texts, split by sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    
    // Translate each chunk
    const translations: string[] = [];
    for (const chunk of chunks) {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|ko`
      );
      const data = await response.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        translations.push(data.responseData.translatedText);
      } else {
        translations.push(''); // Keep position
      }
    }
    
    return translations.join(' ');
  } catch {
    return null;
  }
};

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
  const [definition, setDefinition] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Fetch word definition from free dictionary API
  useEffect(() => {
    const fetchDefinition = async () => {
      setLoading(true);
      setDefinition(null); // Reset definition for new word to prevent stale data
      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (!response.ok) {
          // API returned error (404, 500, etc.)
          setDefinition(null);
          return;
        }
        const data = await response.json();
        const meanings = data[0]?.meanings;
        if (meanings && meanings.length > 0) {
          const firstDef = meanings[0]?.definitions?.[0]?.definition;
          setDefinition(firstDef || null);
        } else {
          // No meanings found in response
          setDefinition(null);
        }
      } catch {
        setDefinition(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDefinition();
  }, [word]);

  return (
    <div
      ref={popupRef}
      className={cn(
        'fixed z-50 rounded-lg shadow-xl border animate-in fade-in zoom-in-95 duration-150 w-64',
        darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'
      )}
      style={{
        left: Math.min(position.x - 128, window.innerWidth - 280),
        top: position.y + 10,
      }}
    >
      {/* Header */}
      <div className={cn(
        'px-3 py-2 border-b flex items-center justify-between',
        darkMode ? 'border-zinc-700' : 'border-gray-200'
      )}>
        <span className={cn('font-bold text-sm', darkMode ? 'text-white' : 'text-gray-900')}>
          {word}
        </span>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 p-0.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Definition */}
      <div className="px-3 py-2">
        {loading ? (
          <p className={cn('text-xs', darkMode ? 'text-zinc-500' : 'text-gray-400')}>
            Loading definition...
          </p>
        ) : definition ? (
          <p className={cn('text-xs leading-relaxed', darkMode ? 'text-zinc-300' : 'text-gray-600')}>
            {definition}
          </p>
        ) : (
          <p className={cn('text-xs', darkMode ? 'text-zinc-500' : 'text-gray-400')}>
            No definition found.
          </p>
        )}
      </div>

      {/* Add to Vocabulary */}
      <div className={cn('px-3 py-2 border-t', darkMode ? 'border-zinc-700' : 'border-gray-200')}>
        <button
          className={cn(
            'w-full text-xs py-1.5 px-2 rounded transition-colors flex items-center justify-center gap-1',
            isAdded
              ? 'bg-emerald-600/20 text-emerald-400 cursor-default'
              : isAdding
                ? 'bg-zinc-700 text-zinc-400 cursor-wait'
                : darkMode
                  ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          )}
          disabled={isAdding || isAdded}
          onClick={onAddToVocabulary}
        >
          {isAdding ? 'Adding...' : isAdded ? '✓ Added' : '+ Add to Vocabulary'}
        </button>
      </div>
    </div>
  );
};

// Difficulty badge config
const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  easy: { label: 'Easy', color: 'bg-green-500/20 text-green-400' },
  intermediate: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400' },
  hard: { label: 'Hard', color: 'bg-red-500/20 text-red-400' },
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
  const [translation, setTranslation] = useState<string | null>(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    position: { x: number; y: number };
    context: string;
  } | null>(null);

  // Extract full passage text
  const fullPassageText = useMemo(() => {
    if (!passage) return '';
    return passage.content_parts
      .map((part) => (isTextPart(part) ? part.value : part.full_word))
      .join('');
  }, [passage]);

  // Check bookmark status
  useEffect(() => {
    if (!exerciseId) return;
    
    const check = async () => {
      const result = await checkBookmark(exerciseId);
      setIsBookmarked(result.isBookmarked);
    };
    
    check();
  }, [exerciseId]);

  // Auto-translate passage to Korean
  useEffect(() => {
    if (!fullPassageText || translation) return;
    
    const translate = async () => {
      setTranslationLoading(true);
      setTranslationError(false);
      const result = await translateToKorean(fullPassageText);
      if (result) {
        setTranslation(result);
      } else {
        setTranslationError(true);
      }
      setTranslationLoading(false);
    };
    
    translate();
  }, [fullPassageText, translation]);

  const handleBookmark = async () => {
    if (!exerciseId) {
      toast.error('Exercise ID not available');
      return;
    }

    setBookmarkLoading(true);
    
    if (isBookmarked) {
      const result = await unbookmarkExercise(exerciseId);
      if (result.success) {
        setIsBookmarked(false);
        toast.success('북마크가 제거되었습니다');
      } else {
        toast.error(result.error?.message || 'Failed to remove bookmark');
      }
    } else {
      const result = await bookmarkExercise({ exerciseId });
      if (result.success) {
        setIsBookmarked(true);
        toast.success('북마크에 저장되었습니다! 나중에 다시 풀 수 있어요 📚');
      } else {
        toast.error(result.error?.message || 'Failed to save bookmark');
      }
    }
    
    setBookmarkLoading(false);
  };

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

  const difficultyConfig = passage?.difficulty ? DIFFICULTY_CONFIG[passage.difficulty] : null;

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
        />
      )}

      {/* Score Summary with metadata - Left aligned */}
      <div className={cn(
        "p-5 rounded-xl border bg-gradient-to-r",
        getScoreBg(),
        darkMode ? "border-zinc-800" : "border-gray-200"
      )}>
        <div className="flex flex-col gap-4">
          {/* Score Row */}
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-16 h-16 rounded-full flex flex-col items-center justify-center border-4 shrink-0",
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

          {/* Metadata Row - Left aligned: Time, Difficulty, Category, Topic */}
          <div className="flex flex-wrap items-center gap-2">
            {elapsedTime !== undefined && (
              <div className={cn(
                "px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5",
                darkMode ? "bg-zinc-800 text-zinc-300" : "bg-gray-100 text-gray-700"
              )}>
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(elapsedTime)}
              </div>
            )}
            {difficultyConfig && (
              <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', difficultyConfig.color)}>
                {difficultyConfig.label}
              </span>
            )}
            {passage?.topic_category && (
              <span className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-full',
                darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
              )}>
                {passage.topic_category}
              </span>
            )}
            {topic && (
              <span className={cn(
                'px-2.5 py-1 text-xs rounded-full max-w-[200px] truncate',
                darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-600'
              )} title={topic}>
                {topic}
              </span>
            )}
          </div>

          {/* Bookmark Button - Minimal & Elegant */}
          {exerciseId && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                className={cn(
                  "relative p-2 rounded-lg transition-all group",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2",
                  isBookmarked
                    ? darkMode
                      ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 focus:ring-amber-500/50"
                      : "bg-amber-100 text-amber-600 hover:bg-amber-200 focus:ring-amber-500"
                    : darkMode
                      ? "text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/50 focus:ring-zinc-700"
                      : "text-gray-400 hover:text-amber-600 hover:bg-gray-100 focus:ring-gray-300"
                )}
                title={isBookmarked ? "북마크 제거" : "북마크 저장 (나중에 다시 풀기)"}
              >
                {bookmarkLoading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg 
                    className={cn(
                      "w-5 h-5 transition-transform",
                      isBookmarked ? "" : "group-hover:scale-110"
                    )} 
                    fill={isBookmarked ? "currentColor" : "none"} 
                    stroke={isBookmarked ? "none" : "currentColor"}
                    viewBox="0 0 24 24"
                    strokeWidth={isBookmarked ? 0 : 1.5}
                  >
                    {isBookmarked ? (
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    )}
                  </svg>
                )}
                {/* Tooltip */}
                <span className={cn(
                  "absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs whitespace-nowrap",
                  "opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50",
                  darkMode ? "bg-zinc-800 text-zinc-200 border border-zinc-700" : "bg-gray-900 text-gray-100"
                )}>
                  {isBookmarked ? "북마크 제거" : "북마크 저장"}
                  <span className={cn(
                    "absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45",
                    darkMode ? "bg-zinc-800 border-r border-b border-zinc-700" : "bg-gray-900"
                  )} />
                </span>
              </button>
              {isBookmarked && (
                <span className={cn(
                  "text-xs",
                  darkMode ? "text-amber-400/70" : "text-amber-600/70"
                )}>
                  저장됨
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Answers Section - Original style with explanations */}
      <div className={cn('p-4 rounded-xl border', darkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-gray-50 border-gray-200')}>
        <h3 className={cn('text-base font-semibold mb-4 flex items-center gap-2', darkMode ? 'text-white' : 'text-gray-900')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Answers & Explanations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {results.map(({ blank, userSuffix, correctSuffix, isCorrect }) => (
            <div
              key={blank.id}
              className={cn(
                'p-3 rounded-lg border flex items-start gap-3',
                isCorrect
                  ? darkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-green-50 border-green-200'
                  : darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
              )}
            >
              <span className={cn(
                'text-xs font-bold px-2 py-0.5 rounded shrink-0',
                isCorrect
                  ? darkMode ? 'bg-emerald-800 text-emerald-200' : 'bg-green-200 text-green-800'
                  : darkMode ? 'bg-red-800 text-red-200' : 'bg-red-200 text-red-800'
              )}>
                {isCorrect ? '✓' : '✗'} {blank.id}
              </span>
              <div className="flex-1 min-w-0">
                <p className={cn('font-semibold text-sm', darkMode ? 'text-white' : 'text-gray-900')}>
                  {blank.prefix}
                  <span className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>{correctSuffix}</span>
                  {!isCorrect && userSuffix && (
                    <span className="text-red-400/60 line-through ml-2 text-xs">
                      {blank.prefix}{userSuffix}
                    </span>
                  )}
                </p>
                <p className={cn('text-xs mt-0.5', darkMode ? 'text-zinc-400' : 'text-gray-500')}>
                  {blank.clue || 'Common word used in academic contexts.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Passage Section - Always visible, no toggle */}
      {fullPassageText && (
        <div className={cn('p-6 rounded-xl border', darkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-gray-200 shadow-sm')}>
          <h3 className={cn('text-lg font-semibold mb-4 flex items-center gap-2', darkMode ? 'text-white' : 'text-gray-900')}>
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            Full Passage
            <span className={cn('text-xs px-2 py-0.5 rounded font-normal', darkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-500')}>
              Click words to save
            </span>
          </h3>
          
          {/* English Passage - Improved readability */}
          <div className="max-w-4xl mb-6">
            <div className={cn(
              'p-5 rounded-lg border',
              darkMode ? 'bg-zinc-950/50 border-zinc-700' : 'bg-gray-50 border-gray-200'
            )}>
              <p className={cn(
                'text-base leading-7 font-serif tracking-wide',
                darkMode ? 'text-zinc-100' : 'text-gray-800'
              )}>
                {renderClickablePassage()}
              </p>
            </div>
          </div>
          
          {/* Korean Translation - Improved readability */}
          <div className={cn('pt-5 border-t', darkMode ? 'border-zinc-700' : 'border-gray-200')}>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn('text-sm font-semibold', darkMode ? 'text-zinc-300' : 'text-gray-700')}>
                🇰🇷 한국어 해석
              </span>
              {translationLoading && (
                <span className={cn('text-xs animate-pulse', darkMode ? 'text-blue-400' : 'text-blue-500')}>
                  번역 중...
                </span>
              )}
            </div>
            <div className="max-w-4xl">
              {translationLoading ? (
                <div className="space-y-2.5">
                  <div className={cn('h-5 rounded animate-pulse', darkMode ? 'bg-zinc-700' : 'bg-gray-200')} style={{ width: '90%' }} />
                  <div className={cn('h-5 rounded animate-pulse', darkMode ? 'bg-zinc-700' : 'bg-gray-200')} style={{ width: '95%' }} />
                  <div className={cn('h-5 rounded animate-pulse', darkMode ? 'bg-zinc-700' : 'bg-gray-200')} style={{ width: '80%' }} />
                </div>
              ) : translationError ? (
                <p className={cn('text-sm', darkMode ? 'text-zinc-500' : 'text-gray-400')}>
                  ⚠️ 번역을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
                </p>
              ) : translation ? (
                <div className={cn(
                  'p-5 rounded-lg border',
                  darkMode ? 'bg-zinc-950/50 border-zinc-700' : 'bg-gray-50 border-gray-200'
                )}>
                  <p className={cn(
                    'text-base leading-7 tracking-wide',
                    darkMode ? 'text-zinc-200' : 'text-gray-700'
                  )}>
                    {translation}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
