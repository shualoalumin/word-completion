import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Clock, Volume2, HelpCircle, RotateCcw, Save } from 'lucide-react';
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
  const [timeLeft, setTimeLeft] = useState(600);
  
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!passageData || showResults) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [passageData, showResults]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const generatePassage = async (retryCount = 0) => {
    setLoading(true);
    setPassageData(null);
    setUserAnswers({});
    setShowResults(false);
    setTimeLeft(600);
    inputRefs.current = {};

    try {
      const { data, error } = await supabase.functions.invoke('generate-passage');
      
      if (error) {
        throw error;
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
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

  const handleCharChange = (wordId: number, charIndex: number, inputValue: string, expectedLength: number) => {
    if (showResults) return;

    const char = inputValue.slice(-1);
    const currentStr = userAnswers[wordId] || "";
    const chars = currentStr.split('');
    
    while (chars.length < expectedLength) chars.push('');
    chars[charIndex] = char;
    
    const newStr = chars.join('').slice(0, expectedLength);
    setUserAnswers(prev => ({ ...prev, [wordId]: newStr }));

    if (char && charIndex < expectedLength - 1) {
      const nextRef = inputRefs.current[`${wordId}-${charIndex + 1}`];
      if (nextRef) nextRef.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, wordId: number, charIndex: number, expectedLength: number) => {
    if (showResults) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      const currentStr = userAnswers[wordId] || "";
      const chars = currentStr.split('');
      
      if (!chars[charIndex] && charIndex > 0) {
        const prevRef = inputRefs.current[`${wordId}-${charIndex - 1}`];
        if (prevRef) {
          prevRef.focus();
          chars[charIndex - 1] = '';
          setUserAnswers(prev => ({ ...prev, [wordId]: chars.join('') }));
        }
      } else {
        chars[charIndex] = '';
        setUserAnswers(prev => ({ ...prev, [wordId]: chars.join('') }));
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (charIndex > 0) {
        inputRefs.current[`${wordId}-${charIndex - 1}`]?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (charIndex < expectedLength - 1) {
        inputRefs.current[`${wordId}-${charIndex + 1}`]?.focus();
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const Header = () => (
    <header className="h-14 bg-slate-700 text-white flex items-center justify-between px-6 shrink-0 shadow-sm border-b border-slate-600 select-none">
      <div className="flex items-center gap-4">
        <span className="font-bold text-lg tracking-wide text-slate-100">Reading Section</span>
        {passageData && (
          <>
            <div className="h-5 w-px bg-slate-500 mx-2"></div>
            <span className="text-slate-300 text-sm font-medium">{passageData.topic}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded text-slate-200 border border-slate-600">
          <Clock className="w-4 h-4" />
          <span className="font-mono font-bold tracking-wider">{formatTime(timeLeft)}</span>
        </div>
        <div className="flex gap-1">
           <button className="p-2 hover:bg-slate-600 rounded text-slate-300 transition-colors"><Volume2 className="w-5 h-5" /></button>
           <button className="p-2 hover:bg-slate-600 rounded text-slate-300 transition-colors"><HelpCircle className="w-5 h-5" /></button>
        </div>
      </div>
    </header>
  );

  const SubHeader = () => (
    <div className="h-12 bg-slate-100 border-b border-slate-300 flex items-center justify-between px-6 shrink-0 select-none">
       <div className="text-base font-bold text-slate-800">
         Fill in the missing letters in the paragraph. (Questions 1-10)
       </div>
       <div className="flex items-center gap-2">
         {showResults ? (
           <button 
             onClick={() => generatePassage()} 
             className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm rounded flex items-center gap-2"
           >
             <RotateCcw className="w-3 h-3" /> Next Passage
           </button>
         ) : (
           <button 
             onClick={() => setShowResults(true)} 
             className="px-4 py-1.5 bg-white border border-slate-400 text-slate-800 text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm rounded flex items-center gap-2"
           >
             <Save className="w-3 h-3" /> Check Answers
           </button>
         )}
       </div>
    </div>
  );

  const WordCompletion = ({ blank }: { blank: ContentPart }) => {
    const { id, full_word, prefix } = blank;
    if (!id || !full_word || !prefix) return null;
    
    const suffix = full_word.slice(prefix.length);
    const suffixLen = suffix.length;
    
    const userSuffix = userAnswers[id] || "";
    const isCorrect = userSuffix.toLowerCase() === suffix.toLowerCase();
    
    const inputs = Array.from({ length: suffixLen });

    return (
      <span className="inline-flex items-baseline mx-0.5 relative group">
        <span className="inline-flex items-baseline font-serif text-[19px]">
          <span className="text-slate-900">{prefix}</span>
          
          <span className="inline-flex mx-px">
            {inputs.map((_, idx) => {
              const char = (userAnswers[id] || "")[idx] || "";
              
              let borderColor = "border-slate-800";
              let textColor = "text-slate-900";
              let bgColor = "bg-transparent";

              if (showResults) {
                if (isCorrect) {
                  borderColor = "border-green-600";
                  textColor = "text-green-700";
                  bgColor = "bg-green-50";
                } else {
                  borderColor = "border-red-500";
                  textColor = "text-red-600";
                  bgColor = "bg-red-50";
                }
              }

              return (
                <input
                  key={idx}
                  ref={el => { inputRefs.current[`${id}-${idx}`] = el; }}
                  type="text"
                  value={char}
                  onChange={(e) => handleCharChange(id, idx, e.target.value, suffixLen)}
                  onKeyDown={(e) => handleKeyDown(e, id, idx, suffixLen)}
                  onFocus={handleFocus}
                  disabled={showResults}
                  className={`
                    w-[14px] h-[22px] 
                    mx-[1px]
                    text-center font-sans text-lg font-bold leading-none
                    border-b-2 outline-none rounded-none
                    ${borderColor} ${textColor} ${bgColor}
                    focus:border-indigo-600 focus:bg-indigo-50
                    transition-colors p-0
                  `}
                  autoComplete="off"
                />
              );
            })}
          </span>
        </span>

        {showResults && !isCorrect && (
          <span className="absolute -bottom-8 left-0 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow z-20 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {full_word}
          </span>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Preparing Reading Task...</p>
      </div>
    );
  }

  if (!passageData) return null;

  return (
    <div className="h-screen flex flex-col font-sans bg-slate-100 text-slate-900 overflow-hidden">
      <Header />
      <SubHeader />

      <main className="flex-1 overflow-y-auto bg-white p-8 md:p-12 shadow-inner flex justify-center">
        <div className="max-w-3xl w-full">
          <div className="text-[19px] leading-loose font-serif text-slate-800 text-justify">
            {passageData.content_parts.map((part, index) => {
              if (part.type === 'text') {
                return <span key={index} dangerouslySetInnerHTML={{ __html: part.value || '' }} />;
              } else {
                return <WordCompletion key={index} blank={part} />;
              }
            })}
          </div>

          {showResults && (
            <div className="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between animate-in slide-in-from-bottom-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Results</h3>
                <p className="text-slate-600">
                  You scored <span className="font-bold text-indigo-600">{calculateScore()}</span> out of 10.
                </p>
              </div>
              <button 
                onClick={() => generatePassage()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-sm transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Try Another
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ToeflCBTApp;
