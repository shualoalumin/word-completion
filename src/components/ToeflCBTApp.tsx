import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, RotateCcw, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ContentPart {
  type: 'text' | 'blank';
  value?: string;
  id?: number;
  full_word?: string;
  prefix?: string;
}

interface PassageData {
  topic: string;
  content_parts: ContentPart[];
}

const ToeflCBTApp = () => {
  const [loading, setLoading] = useState(false);
  const [passageData, setPassageData] = useState<PassageData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const blankOrder = useRef<number[]>([]);

  const generatePassage = async (retryCount = 0) => {
    setLoading(true);
    setPassageData(null);
    setUserAnswers({});
    setShowResults(false);
    inputRefs.current = {};
    blankOrder.current = [];

    try {
      const { data, error } = await supabase.functions.invoke('generate-passage');
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      // Extract blank order
      const blanks = data.content_parts.filter((p: ContentPart) => p.type === 'blank');
      blankOrder.current = blanks.map((b: ContentPart) => b.id as number);
      
      setPassageData(data);
    } catch (err) {
      console.error('Error generating passage:', err);
      if (retryCount < 3) {
        setTimeout(() => generatePassage(retryCount + 1), 1000);
      } else {
        toast({
          title: "Error",
          description: "Failed to generate passage. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePassage();
  }, []);

  // Auto-focus first blank when passage loads
  useEffect(() => {
    if (passageData && !showResults && blankOrder.current.length > 0) {
      const firstWordId = blankOrder.current[0];
      // Small delay to ensure inputs are rendered
      requestAnimationFrame(() => {
        const firstInput = inputRefs.current[`${firstWordId}-0`];
        if (firstInput) {
          firstInput.focus();
          firstInput.setSelectionRange(0, 0);
        }
      });
    }
  }, [passageData, showResults]);

  const calculateScore = () => {
    if (!passageData) return 0;
    const blanks = passageData.content_parts.filter(p => p.type === 'blank');
    return blanks.reduce((acc, b) => {
      if (!b.full_word || !b.prefix || !b.id) return acc;
      const suffix = b.full_word.slice(b.prefix.length);
      const userSuffix = userAnswers[b.id] || "";
      return acc + (userSuffix.toLowerCase() === suffix.toLowerCase() ? 1 : 0);
    }, 0);
  };

  const getBlankLength = useCallback((wordId: number) => {
    if (!passageData) return 0;
    const blank = passageData.content_parts.find(p => p.type === 'blank' && p.id === wordId);
    if (!blank?.full_word || !blank?.prefix) return 0;
    return blank.full_word.length - blank.prefix.length;
  }, [passageData]);

  // Focus helper with cursor positioning
  const focusInput = useCallback((wordId: number, charIndex: number, cursorPos: 'start' | 'end' = 'end') => {
    const input = inputRefs.current[`${wordId}-${charIndex}`];
    if (input) {
      input.focus();
      // Set cursor position after focus
      requestAnimationFrame(() => {
        const pos = cursorPos === 'start' ? 0 : input.value.length;
        input.setSelectionRange(pos, pos);
      });
    }
    return input;
  }, []);

  // Navigate to adjacent blank
  const navigateToBlank = useCallback((currentWordId: number, direction: 'next' | 'prev') => {
    const idx = blankOrder.current.indexOf(currentWordId);
    if (idx === -1) return false;
    
    const targetIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= blankOrder.current.length) return false;
    
    const targetWordId = blankOrder.current[targetIdx];
    const targetLength = getBlankLength(targetWordId);
    if (targetLength === 0) return false;
    
    const targetCharIdx = direction === 'next' ? 0 : targetLength - 1;
    const cursorPos = direction === 'next' ? 'start' : 'end';
    focusInput(targetWordId, targetCharIdx, cursorPos);
    return true;
  }, [getBlankLength, focusInput]);

  // Get chars array for a word
  const getCharsArray = useCallback((wordId: number, expectedLength: number, answersState?: Record<number, string>) => {
    const state = answersState ?? userAnswers;
    const currentStr = state[wordId] || "";
    const chars = currentStr.split('');
    while (chars.length < expectedLength) chars.push('');
    return chars;
  }, [userAnswers]);

  const handleCharChange = useCallback((wordId: number, charIndex: number, inputValue: string, expectedLength: number) => {
    if (showResults) return;

    // Force English letters only
    const englishOnly = inputValue.replace(/[^a-zA-Z]/g, '');
    const char = englishOnly.slice(-1).toLowerCase();

    setUserAnswers(prev => {
      const chars = getCharsArray(wordId, expectedLength, prev);
      chars[charIndex] = char;
      return { ...prev, [wordId]: chars.join('').slice(0, expectedLength) };
    });

    // Auto-advance on character input
    if (char) {
      requestAnimationFrame(() => {
        if (charIndex < expectedLength - 1) {
          focusInput(wordId, charIndex + 1, 'start');
        } else {
          navigateToBlank(wordId, 'next');
        }
      });
    }
  }, [showResults, getCharsArray, focusInput, navigateToBlank]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, wordId: number, charIndex: number, expectedLength: number) => {
    if (showResults) return;

    const input = e.currentTarget;
    const cursorPos = input.selectionStart ?? 0;
    const hasSelection = input.selectionStart !== input.selectionEnd;

    switch (e.key) {
      case 'Backspace': {
        e.preventDefault();
        
        const currentChar = (userAnswers[wordId] || "")[charIndex] || "";
        
        if (currentChar) {
          // Has content - just clear it, stay in place
          setUserAnswers(prev => {
            const chars = getCharsArray(wordId, expectedLength, prev);
            chars[charIndex] = '';
            return { ...prev, [wordId]: chars.join('') };
          });
        } else if (charIndex > 0) {
          // Current empty, move to previous char in same blank and clear it
          setUserAnswers(prev => {
            const chars = getCharsArray(wordId, expectedLength, prev);
            chars[charIndex - 1] = '';
            return { ...prev, [wordId]: chars.join('') };
          });
          focusInput(wordId, charIndex - 1, 'end');
        } else {
          // At first char of blank - go to previous blank's last char and clear it
          const idx = blankOrder.current.indexOf(wordId);
          if (idx > 0) {
            const prevWordId = blankOrder.current[idx - 1];
            const prevLength = getBlankLength(prevWordId);
            if (prevLength > 0) {
              setUserAnswers(prev => {
                const prevChars = getCharsArray(prevWordId, prevLength, prev);
                prevChars[prevLength - 1] = '';
                return { ...prev, [prevWordId]: prevChars.join('') };
              });
              focusInput(prevWordId, prevLength - 1, 'end');
            }
          }
        }
        break;
      }

      case 'Delete': {
        e.preventDefault();
        
        const currentChar = (userAnswers[wordId] || "")[charIndex] || "";
        
        if (currentChar) {
          // Clear current char
          setUserAnswers(prev => {
            const chars = getCharsArray(wordId, expectedLength, prev);
            chars[charIndex] = '';
            return { ...prev, [wordId]: chars.join('') };
          });
        } else {
          // Current is empty - move to next position
          if (charIndex < expectedLength - 1) {
            focusInput(wordId, charIndex + 1, 'start');
          } else {
            navigateToBlank(wordId, 'next');
          }
        }
        break;
      }

      case 'ArrowLeft': {
        e.preventDefault();
        
        // If cursor is at start or no content, move to previous input
        const currentChar = (userAnswers[wordId] || "")[charIndex] || "";
        const shouldMove = cursorPos === 0 || !currentChar || hasSelection;
        
        if (shouldMove) {
          if (charIndex > 0) {
            focusInput(wordId, charIndex - 1, 'end');
          } else {
            navigateToBlank(wordId, 'prev');
          }
        } else {
          // Move cursor within input
          input.setSelectionRange(0, 0);
        }
        break;
      }

      case 'ArrowRight': {
        e.preventDefault();
        
        // If cursor is at end or no content, move to next input
        const currentChar = (userAnswers[wordId] || "")[charIndex] || "";
        const shouldMove = cursorPos === currentChar.length || !currentChar || hasSelection;
        
        if (shouldMove) {
          if (charIndex < expectedLength - 1) {
            focusInput(wordId, charIndex + 1, 'start');
          } else {
            navigateToBlank(wordId, 'next');
          }
        } else {
          // Move cursor within input
          input.setSelectionRange(currentChar.length, currentChar.length);
        }
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        // Jump to previous blank's same position or last char
        const idx = blankOrder.current.indexOf(wordId);
        if (idx > 0) {
          const prevWordId = blankOrder.current[idx - 1];
          const prevLength = getBlankLength(prevWordId);
          const targetIdx = Math.min(charIndex, prevLength - 1);
          focusInput(prevWordId, targetIdx, 'end');
        }
        break;
      }

      case 'ArrowDown': {
        e.preventDefault();
        // Jump to next blank's same position or last char
        const idx = blankOrder.current.indexOf(wordId);
        if (idx < blankOrder.current.length - 1) {
          const nextWordId = blankOrder.current[idx + 1];
          const nextLength = getBlankLength(nextWordId);
          const targetIdx = Math.min(charIndex, nextLength - 1);
          focusInput(nextWordId, targetIdx, 'start');
        }
        break;
      }

      case 'Tab': {
        e.preventDefault();
        navigateToBlank(wordId, e.shiftKey ? 'prev' : 'next');
        break;
      }

      case 'Home': {
        e.preventDefault();
        // Go to first char of current blank
        if (e.ctrlKey || e.metaKey) {
          // Go to very first blank
          const firstWordId = blankOrder.current[0];
          if (firstWordId !== undefined) {
            focusInput(firstWordId, 0, 'start');
          }
        } else {
          focusInput(wordId, 0, 'start');
        }
        break;
      }

      case 'End': {
        e.preventDefault();
        // Go to last char of current blank
        if (e.ctrlKey || e.metaKey) {
          // Go to very last blank
          const lastWordId = blankOrder.current[blankOrder.current.length - 1];
          if (lastWordId !== undefined) {
            const lastLength = getBlankLength(lastWordId);
            focusInput(lastWordId, lastLength - 1, 'end');
          }
        } else {
          focusInput(wordId, expectedLength - 1, 'end');
        }
        break;
      }

      default:
        // Allow normal character input to flow through
        break;
    }
  }, [showResults, userAnswers, getCharsArray, getBlankLength, focusInput, navigateToBlank]);

  const WordCompletion = ({ blank }: { blank: ContentPart }) => {
    const { id, full_word, prefix } = blank;
    if (!id || !full_word || !prefix) return null;
    
    const suffix = full_word.slice(prefix.length);
    const suffixLen = suffix.length;
    
    const userSuffix = userAnswers[id] || "";
    const isCorrect = userSuffix.toLowerCase() === suffix.toLowerCase();

    return (
      <span className="inline-flex items-baseline whitespace-nowrap">
        <span className="text-gray-900">{prefix}</span>
        {Array.from({ length: suffixLen }).map((_, idx) => {
          const char = (userAnswers[id] || "")[idx] || "";
          
          let textColor = "text-gray-900";
          let borderColor = "border-gray-800";
          
          if (showResults) {
            if (isCorrect) {
              textColor = "text-green-600";
              borderColor = "border-green-500";
            } else {
              textColor = "text-red-600";
              borderColor = "border-red-500";
            }
          }

          return (
            <input
              key={idx}
              ref={el => { inputRefs.current[`${id}-${idx}`] = el; }}
              type="text"
              inputMode="text"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={char}
              onChange={(e) => handleCharChange(id, idx, e.target.value, suffixLen)}
              onKeyDown={(e) => handleKeyDown(e, id, idx, suffixLen)}
              onFocus={(e) => {
                // Position cursor at end on focus
                const len = e.target.value.length;
                e.target.setSelectionRange(len, len);
              }}
              disabled={showResults}
              className={`
                w-[10px] h-[18px] mx-[0.5px]
                text-center text-[15px] font-medium
                border-b-2 ${borderColor} ${textColor}
                bg-transparent outline-none
                focus:border-blue-600 focus:bg-blue-50/80
                focus:caret-blue-600
                disabled:cursor-default
                p-0 leading-tight
                transition-colors duration-100
              `}
              style={{ fontFamily: 'inherit' }}
            />
          );
        })}
        {showResults && !isCorrect && (
          <span className="ml-1 text-[11px] text-green-700 font-medium">({full_word})</span>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-gray-600 animate-spin mb-3" />
        <p className="text-gray-500 text-sm">Preparing passage...</p>
      </div>
    );
  }

  if (!passageData) return null;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-['Arial_Narrow',_'Helvetica_Condensed',_sans-serif]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Fill in the missing letters in the paragraph.
          </h1>
          <p className="text-lg font-bold text-gray-900">(Questions 1-10)</p>
        </div>

        {/* Passage */}
        <div 
          className="text-[17px] leading-[1.9] text-gray-900 text-justify tracking-tight"
          style={{ fontFamily: "'Arial Narrow', 'Helvetica Condensed', Arial, sans-serif" }}
        >
          {passageData.content_parts.map((part, index) => {
            if (part.type === 'text') {
              return <span key={index}>{part.value}</span>;
            } else {
              return <WordCompletion key={index} blank={part} />;
            }
          })}
        </div>

        {/* Actions */}
        <div className="mt-10 flex items-center gap-4">
          {!showResults ? (
            <button 
              onClick={() => setShowResults(true)} 
              className="px-5 py-2 bg-gray-800 text-white text-sm font-semibold hover:bg-gray-900 transition-colors rounded flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Check Answers
            </button>
          ) : (
            <button 
              onClick={() => generatePassage()} 
              className="px-5 py-2 bg-gray-800 text-white text-sm font-semibold hover:bg-gray-900 transition-colors rounded flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Next Passage
            </button>
          )}
        </div>

        {/* Results */}
        {showResults && (
          <div className="mt-8 space-y-6">
            {/* Score */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg inline-block">
              <p className="text-gray-800">
                Score: <span className="font-bold text-gray-900">{calculateScore()}</span> / 10
              </p>
            </div>

            {/* Vocabulary Explanations */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Vocabulary & Explanations</h2>
              <div className="grid gap-3">
                {passageData.content_parts
                  .filter(p => p.type === 'blank')
                  .map((blank) => {
                    const userSuffix = userAnswers[blank.id!] || "";
                    const correctSuffix = blank.full_word!.slice(blank.prefix!.length);
                    const isCorrect = userSuffix.toLowerCase() === correctSuffix.toLowerCase();
                    
                    return (
                      <div 
                        key={blank.id} 
                        className={`p-3 rounded-lg border ${
                          isCorrect 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                          }`}>
                            {blank.id}
                          </span>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {blank.prefix}
                              <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                                {isCorrect ? userSuffix : correctSuffix}
                              </span>
                              {!isCorrect && (
                                <span className="ml-2 text-sm text-gray-500">
                                  (You wrote: {blank.prefix}{userSuffix || '___'})
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>{blank.full_word}</strong> — Common word used in academic contexts.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToeflCBTApp;
