import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, RotateCcw, Check, Moon, Sun } from 'lucide-react';
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
  const [darkMode, setDarkMode] = useState(false);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [timerActive, setTimerActive] = useState(false);
  const [overtime, setOvertime] = useState(0);
  
  // Focus management - simple approach with refs
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const blankOrder = useRef<number[]>([]);
  const focusTarget = useRef<string | null>(null);
  const lastFocusedKey = useRef<string | null>(null);
  const focusLocked = useRef(false);

  // Register input ref
  const setInputRef = useCallback((key: string, el: HTMLInputElement | null) => {
    if (el) {
      inputRefs.current.set(key, el);
    } else {
      inputRefs.current.delete(key);
    }
  }, []);

  // Get input by key
  const getInput = useCallback((wordId: number, charIndex: number) => {
    return inputRefs.current.get(`${wordId}-${charIndex}`);
  }, []);

  // Focus an input immediately
  const focusNow = useCallback((wordId: number, charIndex: number) => {
    const input = getInput(wordId, charIndex);
    if (input) {
      input.focus();
      // Put cursor at end
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }, [getInput]);

  // Schedule focus for after render
  const scheduleFocus = useCallback((wordId: number, charIndex: number) => {
    focusTarget.current = `${wordId}-${charIndex}`;
  }, []);

  // Apply scheduled focus after each render
  useEffect(() => {
    if (focusTarget.current) {
      const input = inputRefs.current.get(focusTarget.current);
      if (input) {
        // Use multiple attempts to ensure focus
        focusLocked.current = true;
        input.focus();
        lastFocusedKey.current = focusTarget.current;
        requestAnimationFrame(() => {
          input.focus();
          const len = input.value.length;
          input.setSelectionRange(len, len);
          setTimeout(() => {
            focusLocked.current = false;
          }, 100);
        });
      }
      focusTarget.current = null;
    }
  });

  // Maintain focus - prevent focus loss
  useEffect(() => {
    if (showResults || !passageData) return;
    
    const checkFocus = () => {
      if (focusLocked.current) return;
      
      const activeEl = document.activeElement;
      const isOurInput = activeEl && 
                        activeEl.tagName === 'INPUT' && 
                        activeEl.getAttribute('type') === 'text' &&
                        Array.from(inputRefs.current.values()).includes(activeEl as HTMLInputElement);
      
      if (isOurInput) {
        // Good, one of our inputs is focused
        const key = Array.from(inputRefs.current.entries())
          .find(([, el]) => el === activeEl)?.[0];
        if (key) lastFocusedKey.current = key;
      } else {
        // No input focused - restore focus
        const keyToFocus = lastFocusedKey.current || `${blankOrder.current[0]}-0`;
        const input = inputRefs.current.get(keyToFocus);
        if (input) {
          console.log('Restoring focus to:', keyToFocus);
          focusLocked.current = true;
          input.focus();
          setTimeout(() => {
            focusLocked.current = false;
          }, 100);
        }
      }
    };
    
    const interval = setInterval(checkFocus, 150);
    
    // Initial focus
    setTimeout(() => {
      if (blankOrder.current.length > 0) {
        const firstKey = `${blankOrder.current[0]}-0`;
        const input = inputRefs.current.get(firstKey);
        if (input) {
          console.log('Initial focus:', firstKey);
          focusLocked.current = true;
          input.focus();
          lastFocusedKey.current = firstKey;
          setTimeout(() => {
            focusLocked.current = false;
          }, 100);
        }
      }
    }, 200);
    
    return () => clearInterval(interval);
  }, [showResults, passageData]);

  // Timer effect
  useEffect(() => {
    if (!timerActive || showResults) return;
    
    const interval = setInterval(() => {
      if (timeRemaining > 0) {
        setTimeRemaining(prev => prev - 1);
      } else {
        setOvertime(prev => prev + 1);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining, showResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generatePassage = async (retryCount = 0) => {
    setLoading(true);
    setPassageData(null);
    setUserAnswers({});
    setShowResults(false);
    setTimeRemaining(180);
    setOvertime(0);
    setTimerActive(false);
    inputRefs.current.clear();
    blankOrder.current = [];

    try {
      const { data, error } = await supabase.functions.invoke('generate-passage');
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      const blanks = data.content_parts.filter((p: ContentPart) => p.type === 'blank');
      blankOrder.current = blanks.map((b: ContentPart) => b.id as number);
      
      setPassageData(data);
      setTimerActive(true);
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

  // Get previous blank info
  const getPrevBlank = useCallback((wordId: number) => {
    const idx = blankOrder.current.indexOf(wordId);
    if (idx <= 0) return null;
    const prevWordId = blankOrder.current[idx - 1];
    return { wordId: prevWordId, length: getBlankLength(prevWordId) };
  }, [getBlankLength]);

  // Get next blank info
  const getNextBlank = useCallback((wordId: number) => {
    const idx = blankOrder.current.indexOf(wordId);
    if (idx < 0 || idx >= blankOrder.current.length - 1) return null;
    const nextWordId = blankOrder.current[idx + 1];
    return { wordId: nextWordId, length: getBlankLength(nextWordId) };
  }, [getBlankLength]);

  // Unified input handler
  const handleInput = useCallback((
    wordId: number, 
    charIndex: number, 
    expectedLength: number,
    action: 'type' | 'backspace' | 'delete' | 'left' | 'right' | 'up' | 'down' | 'home' | 'end' | 'tab' | 'shift-tab',
    char?: string
  ) => {
    if (showResults) return;

    switch (action) {
      case 'type': {
        if (!char) return;
        // Only accept English letters
        const englishChar = char.replace(/[^a-zA-Z]/g, '').slice(-1).toLowerCase();
        
        setUserAnswers(prev => {
          const currentStr = prev[wordId] || '';
          const chars = currentStr.padEnd(expectedLength, ' ').split('');
          chars[charIndex] = englishChar;
          return { ...prev, [wordId]: chars.join('').replace(/ /g, '') };
        });

        // Move to next position if valid char entered
        if (englishChar) {
          if (charIndex < expectedLength - 1) {
            scheduleFocus(wordId, charIndex + 1);
          } else {
            const next = getNextBlank(wordId);
            if (next) scheduleFocus(next.wordId, 0);
          }
        } else {
          // Invalid char, stay in place
          scheduleFocus(wordId, charIndex);
        }
        break;
      }

      case 'backspace': {
        setUserAnswers(prev => {
          const currentStr = prev[wordId] || '';
          const chars = currentStr.padEnd(expectedLength, ' ').split('');
          
          if (chars[charIndex].trim()) {
            // Has content - clear it
            chars[charIndex] = ' ';
            scheduleFocus(wordId, charIndex);
            return { ...prev, [wordId]: chars.join('').replace(/ /g, '') };
          } else if (charIndex > 0) {
            // Empty - go back and clear previous
            chars[charIndex - 1] = ' ';
            scheduleFocus(wordId, charIndex - 1);
            return { ...prev, [wordId]: chars.join('').replace(/ /g, '') };
          } else {
            // At first position - go to previous blank
            const prevBlank = getPrevBlank(wordId);
            if (prevBlank && prevBlank.length > 0) {
              const prevStr = prev[prevBlank.wordId] || '';
              const prevChars = prevStr.padEnd(prevBlank.length, ' ').split('');
              prevChars[prevBlank.length - 1] = ' ';
              scheduleFocus(prevBlank.wordId, prevBlank.length - 1);
              return { ...prev, [prevBlank.wordId]: prevChars.join('').replace(/ /g, '') };
            }
            scheduleFocus(wordId, charIndex);
            return prev;
          }
        });
        break;
      }

      case 'delete': {
        setUserAnswers(prev => {
          const currentStr = prev[wordId] || '';
          const chars = currentStr.padEnd(expectedLength, ' ').split('');
          
          if (chars[charIndex].trim()) {
            // Has content - clear it
            chars[charIndex] = ' ';
            scheduleFocus(wordId, charIndex);
            return { ...prev, [wordId]: chars.join('').replace(/ /g, '') };
          } else {
            // Empty - move forward
            if (charIndex < expectedLength - 1) {
              scheduleFocus(wordId, charIndex + 1);
            } else {
              const next = getNextBlank(wordId);
              if (next) scheduleFocus(next.wordId, 0);
              else scheduleFocus(wordId, charIndex);
            }
            return prev;
          }
        });
        break;
      }

      case 'left': {
        if (charIndex > 0) {
          scheduleFocus(wordId, charIndex - 1);
        } else {
          const prev = getPrevBlank(wordId);
          if (prev) scheduleFocus(prev.wordId, prev.length - 1);
        }
        break;
      }

      case 'right': {
        if (charIndex < expectedLength - 1) {
          scheduleFocus(wordId, charIndex + 1);
        } else {
          const next = getNextBlank(wordId);
          if (next) scheduleFocus(next.wordId, 0);
        }
        break;
      }

      case 'up': {
        const prev = getPrevBlank(wordId);
        if (prev) {
          const targetIdx = Math.min(charIndex, prev.length - 1);
          scheduleFocus(prev.wordId, targetIdx);
        }
        break;
      }

      case 'down': {
        const next = getNextBlank(wordId);
        if (next) {
          const targetIdx = Math.min(charIndex, next.length - 1);
          scheduleFocus(next.wordId, targetIdx);
        }
        break;
      }

      case 'home': {
        scheduleFocus(wordId, 0);
        break;
      }

      case 'end': {
        scheduleFocus(wordId, expectedLength - 1);
        break;
      }

      case 'tab': {
        const next = getNextBlank(wordId);
        if (next) scheduleFocus(next.wordId, 0);
        break;
      }

      case 'shift-tab': {
        const prev = getPrevBlank(wordId);
        if (prev) scheduleFocus(prev.wordId, 0);
        break;
      }
    }
  }, [showResults, getNextBlank, getPrevBlank, scheduleFocus]);

  // Single character input component
  const CharInput = React.memo(({ 
    wordId, 
    charIndex, 
    expectedLength,
    value,
    isCorrect,
    showResult,
    darkMode
  }: {
    wordId: number;
    charIndex: number;
    expectedLength: number;
    value: string;
    isCorrect: boolean;
    showResult: boolean;
    darkMode: boolean;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (inputRef.current) {
        setInputRef(`${wordId}-${charIndex}`, inputRef.current);
      }
      return () => {
        setInputRef(`${wordId}-${charIndex}`, null);
      };
    }, [wordId, charIndex]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (showResults) return;

      // Prevent default for navigation keys
      const navKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];
      if (navKeys.includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'Backspace':
          handleInput(wordId, charIndex, expectedLength, 'backspace');
          break;
        case 'Delete':
          handleInput(wordId, charIndex, expectedLength, 'delete');
          break;
        case 'ArrowLeft':
          handleInput(wordId, charIndex, expectedLength, 'left');
          break;
        case 'ArrowRight':
          handleInput(wordId, charIndex, expectedLength, 'right');
          break;
        case 'ArrowUp':
          handleInput(wordId, charIndex, expectedLength, 'up');
          break;
        case 'ArrowDown':
          handleInput(wordId, charIndex, expectedLength, 'down');
          break;
        case 'Home':
          handleInput(wordId, charIndex, expectedLength, 'home');
          break;
        case 'End':
          handleInput(wordId, charIndex, expectedLength, 'end');
          break;
        case 'Tab':
          handleInput(wordId, charIndex, expectedLength, e.shiftKey ? 'shift-tab' : 'tab');
          break;
        default:
          // Let onChange handle regular character input
          break;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      // Get the last character typed
      const typedChar = newValue.slice(-1);
      if (typedChar) {
        handleInput(wordId, charIndex, expectedLength, 'type', typedChar);
      }
    };

    // Determine styling
    let textColor = darkMode ? "text-gray-100" : "text-gray-900";
    let borderColor = darkMode ? "border-gray-500" : "border-gray-600";
    
    if (showResult) {
      if (isCorrect) {
        textColor = "text-green-500";
        borderColor = "border-green-500";
      } else {
        textColor = "text-red-500";
        borderColor = "border-red-500";
      }
    }

    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={showResult}
        className={`
          w-[11px] h-[20px] ${darkMode ? 'mx-[1px]' : 'mx-[0.5px]'}
          text-center text-[17px]
          border-b-2 ${borderColor} ${textColor}
          bg-transparent outline-none
          focus:border-blue-500 
          ${darkMode ? 'focus:bg-blue-900/40' : 'focus:bg-blue-100/60'}
          disabled:cursor-default
          p-0 leading-tight
          caret-blue-500
        `}
        style={{ 
          fontFamily: "'Arial Narrow', 'Helvetica Condensed', Arial, sans-serif",
        }}
      />
    );
  });

  CharInput.displayName = 'CharInput';

  const WordCompletion = ({ blank }: { blank: ContentPart }) => {
    const { id, full_word, prefix } = blank;
    if (!id || !full_word || !prefix) return null;
    
    const suffix = full_word.slice(prefix.length);
    const suffixLen = suffix.length;
    
    const userSuffix = userAnswers[id] || "";
    const isCorrect = userSuffix.toLowerCase() === suffix.toLowerCase();

    return (
      <span className="inline-flex items-baseline whitespace-nowrap">
        <span className={darkMode ? "text-gray-100" : "text-gray-900"}>{prefix}</span>
        {Array.from({ length: suffixLen }).map((_, idx) => {
          const char = userSuffix[idx] || "";
          
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
            />
          );
        })}
        {showResults && !isCorrect && (
          <span className="ml-1 text-[11px] text-green-500 font-medium">({full_word})</span>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <Loader2 className={`w-10 h-10 animate-spin mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Preparing passage...</p>
      </div>
    );
  }

  if (!passageData) return null;

  const isOvertime = timeRemaining <= 0;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6">
          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${
            isOvertime 
              ? darkMode ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-700'
              : darkMode 
                ? 'bg-gray-800 text-gray-200' 
                : 'bg-gray-100 text-gray-800'
          }`}>
            <span className="text-sm font-sans mr-2">{isOvertime ? 'Overtime:' : 'Timer:'}</span>
            <span className={`font-bold ${isOvertime ? 'text-red-500' : ''}`}>
              {isOvertime ? `+${formatTime(overtime)}` : formatTime(timeRemaining)}
            </span>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-xl font-bold mb-1 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Fill in the missing letters in the paragraph.
          </h1>
          <p className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>(Questions 1-10)</p>
        </div>

        {/* Passage */}
        <div 
          className={`text-[17px] leading-[1.9] text-justify tracking-normal ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}
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
              onClick={() => {
                setShowResults(true);
                setTimerActive(false);
              }} 
              className={`px-5 py-2 text-sm font-semibold transition-colors rounded flex items-center gap-2 ${
                darkMode 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-800 text-white hover:bg-gray-900'
              }`}
            >
              <Check className="w-4 h-4" /> Check Answers
            </button>
          ) : (
            <button 
              onClick={() => generatePassage()} 
              className={`px-5 py-2 text-sm font-semibold transition-colors rounded flex items-center gap-2 ${
                darkMode 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-800 text-white hover:bg-gray-900'
              }`}
            >
              <RotateCcw className="w-4 h-4" /> Next Passage
            </button>
          )}
        </div>

        {/* Results */}
        {showResults && (
          <div className="mt-8 space-y-6">
            <div className="flex gap-4 flex-wrap">
              <div className={`p-4 rounded-lg inline-block ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                <p className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
                  Score: <span className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{calculateScore()}</span> / 10
                </p>
              </div>
              <div className={`p-4 rounded-lg inline-block ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                <p className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
                  Duration: <span className={`font-bold ${isOvertime ? 'text-red-500' : darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {isOvertime ? formatTime(180 + overtime) : formatTime(180 - timeRemaining)}
                  </span>
                </p>
              </div>
            </div>

            <div className={`border-t pt-6 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Vocabulary & Explanations</h2>
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
                            ? darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'
                            : darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isCorrect 
                              ? darkMode ? 'bg-green-800 text-green-200' : 'bg-green-200 text-green-800'
                              : darkMode ? 'bg-red-800 text-red-200' : 'bg-red-200 text-red-800'
                          }`}>
                            {blank.id}
                          </span>
                          <div className="flex-1">
                            <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                              {blank.prefix}
                              <span className={isCorrect ? 'text-green-500' : 'text-red-500'}>
                                {isCorrect ? userSuffix : correctSuffix}
                              </span>
                              {!isCorrect && (
                                <span className={`ml-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  (You wrote: {blank.prefix}{userSuffix || '___'})
                                </span>
                              )}
                            </p>
                            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
