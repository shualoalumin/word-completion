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

  // Get next/prev blank's first input
  const getAdjacentBlankInput = useCallback((currentWordId: number, direction: 'next' | 'prev') => {
    const idx = blankOrder.current.indexOf(currentWordId);
    if (idx === -1) return null;
    
    const targetIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= blankOrder.current.length) return null;
    
    const targetWordId = blankOrder.current[targetIdx];
    const targetCharIdx = direction === 'next' ? 0 : getBlankLength(targetWordId) - 1;
    return inputRefs.current[`${targetWordId}-${targetCharIdx}`];
  }, []);

  const getBlankLength = (wordId: number) => {
    if (!passageData) return 0;
    const blank = passageData.content_parts.find(p => p.type === 'blank' && p.id === wordId);
    if (!blank?.full_word || !blank?.prefix) return 0;
    return blank.full_word.length - blank.prefix.length;
  };

  const handleCharChange = useCallback((wordId: number, charIndex: number, inputValue: string, expectedLength: number) => {
    if (showResults) return;

    // Force English letters only
    const englishOnly = inputValue.replace(/[^a-zA-Z]/g, '');
    const char = englishOnly.slice(-1).toLowerCase();

    setUserAnswers(prev => {
      const currentStr = prev[wordId] || "";
      const chars = currentStr.split('');
      while (chars.length < expectedLength) chars.push('');
      chars[charIndex] = char;
      return { ...prev, [wordId]: chars.join('').slice(0, expectedLength) };
    });

    // Auto-advance
    if (char) {
      setTimeout(() => {
        if (charIndex < expectedLength - 1) {
          inputRefs.current[`${wordId}-${charIndex + 1}`]?.focus();
        } else {
          // Move to next blank
          getAdjacentBlankInput(wordId, 'next')?.focus();
        }
      }, 0);
    }
  }, [showResults, getAdjacentBlankInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, wordId: number, charIndex: number, expectedLength: number) => {
    if (showResults) return;

    const currentStr = userAnswers[wordId] || "";
    const chars = currentStr.split('');
    while (chars.length < expectedLength) chars.push('');

    if (e.key === 'Backspace') {
      e.preventDefault();
      
      if (chars[charIndex]) {
        // Clear current
        chars[charIndex] = '';
        setUserAnswers(prev => ({ ...prev, [wordId]: chars.join('') }));
      } else if (charIndex > 0) {
        // Move back and clear previous
        chars[charIndex - 1] = '';
        setUserAnswers(prev => ({ ...prev, [wordId]: chars.join('') }));
        inputRefs.current[`${wordId}-${charIndex - 1}`]?.focus();
      } else {
        // At first char, move to previous blank's last char
        const prevInput = getAdjacentBlankInput(wordId, 'prev');
        if (prevInput) prevInput.focus();
      }
    } else if (e.key === 'Delete') {
      e.preventDefault();
      chars[charIndex] = '';
      setUserAnswers(prev => ({ ...prev, [wordId]: chars.join('') }));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (charIndex > 0) {
        inputRefs.current[`${wordId}-${charIndex - 1}`]?.focus();
      } else {
        getAdjacentBlankInput(wordId, 'prev')?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (charIndex < expectedLength - 1) {
        inputRefs.current[`${wordId}-${charIndex + 1}`]?.focus();
      } else {
        getAdjacentBlankInput(wordId, 'next')?.focus();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.shiftKey 
        ? getAdjacentBlankInput(wordId, 'prev') 
        : getAdjacentBlankInput(wordId, 'next');
      target?.focus();
    }
  }, [showResults, userAnswers, getAdjacentBlankInput]);

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
              onFocus={(e) => e.target.select()}
              disabled={showResults}
              className={`
                w-[10px] h-[18px] mx-[0.5px]
                text-center text-[15px] font-medium
                border-b ${borderColor} ${textColor}
                bg-transparent outline-none
                focus:border-blue-600 focus:bg-blue-50/50
                disabled:cursor-default
                p-0 leading-tight
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
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg inline-block">
            <p className="text-gray-800">
              Score: <span className="font-bold text-gray-900">{calculateScore()}</span> / 10
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToeflCBTApp;
