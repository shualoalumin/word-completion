import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getWordsForReview, submitReviewResult, ReviewWord, ReviewType } from '@/features/vocabulary/review/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ReviewMode = 'flashcard' | 'fill_blank' | 'multiple_choice';

export default function VocabularyReview() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [words, setWords] = useState<ReviewWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState<ReviewMode>('flashcard');
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [loadingWords, setLoadingWords] = useState(true);

  // Load words for review
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    loadWords();
  }, [isAuthenticated, navigate]);

  const loadWords = async () => {
    setLoadingWords(true);
    const result = await getWordsForReview(10);
    if (result.error) {
      toast.error('Failed to load words for review');
      setLoadingWords(false);
      return;
    }
    setWords(result.data || []);
    setLoadingWords(false);
    if (result.data && result.data.length > 0) {
      setStartTime(Date.now());
    }
  };

  const currentWord = words[currentIndex];

  // Generate multiple choice options
  const generateChoices = useCallback((word: ReviewWord): string[] => {
    if (!word.definition) return [];

    // For now, generate simple choices (in production, use AI or word bank)
    const choices = [word.definition];
    const fakeChoices = [
      'A word that means something similar',
      'A type of academic term',
      'A common English word',
      'An advanced vocabulary word',
    ];

    // Shuffle and take 3 random fake choices
    const shuffled = fakeChoices.sort(() => Math.random() - 0.5).slice(0, 3);
    const allChoices = [...choices, ...shuffled].sort(() => Math.random() - 0.5);

    return allChoices;
  }, []);

  const handleSubmit = async (isCorrect: boolean, answer?: string) => {
    if (!currentWord || !startTime) return;

    const responseTime = Math.floor((Date.now() - startTime) / 1000);

    const result = await submitReviewResult({
      vocabularyId: currentWord.id,
      reviewType: reviewMode as ReviewType,
      isCorrect,
      responseTimeSeconds: responseTime,
      userAnswer: answer || userAnswer,
      correctAnswer: currentWord.definition || currentWord.word,
    });

    if (result.success) {
      if (isCorrect) {
        toast.success('Correct! 🎉');
      } else {
        toast.error('Incorrect. Keep practicing!');
      }

      // Move to next word
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        setUserAnswer('');
        setSelectedChoice(null);
        setStartTime(Date.now());
      } else {
        // All words reviewed
        toast.success('Review session complete!');
        // Invalidate vocabulary queries to refresh the list
        queryClient.invalidateQueries({ queryKey: ['vocabulary-list'] });
        queryClient.invalidateQueries({ queryKey: ['vocabulary-stats'] });
        navigate('/vocabulary');
      }
    } else {
      toast.error(result.error?.message || 'Failed to save review');
    }
  };

  const handleFlashcardFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleFillBlankSubmit = () => {
    if (!userAnswer.trim()) {
      toast.error('Please enter an answer');
      return;
    }

    const isCorrect = userAnswer.toLowerCase().trim() === currentWord.word.toLowerCase();
    handleSubmit(isCorrect, userAnswer);
  };

  const handleMultipleChoiceSubmit = () => {
    if (selectedChoice === null) {
      toast.error('Please select an answer');
      return;
    }

    const choices = generateChoices(currentWord);
    const isCorrect = choices[selectedChoice] === currentWord.definition;
    handleSubmit(isCorrect, choices[selectedChoice]);
  };

  if (loading || loadingWords) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30 mb-8"
            onClick={() => navigate('/vocabulary')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Vocabulary
          </Button>

          <div className="p-12 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-zinc-500 mb-2">No words due for review</p>
            <p className="text-zinc-600 text-sm">Great job! All your words are up to date.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30"
            onClick={() => navigate('/vocabulary')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Vocabulary
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">
              {currentIndex + 1} / {words.length}
            </span>
          </div>
        </div>

        {/* Review Mode Selector */}
        <div className="flex gap-2 mb-8 justify-center">
          <Button
            variant={reviewMode === 'flashcard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setReviewMode('flashcard');
              setIsFlipped(false);
              setUserAnswer('');
              setSelectedChoice(null);
            }}
            className={reviewMode === 'flashcard' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            Flashcard
          </Button>
          <Button
            variant={reviewMode === 'fill_blank' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setReviewMode('fill_blank');
              setIsFlipped(false);
              setUserAnswer('');
              setSelectedChoice(null);
            }}
            className={reviewMode === 'fill_blank' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            Fill in Blank
          </Button>
          <Button
            variant={reviewMode === 'multiple_choice' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setReviewMode('multiple_choice');
              setIsFlipped(false);
              setUserAnswer('');
              setSelectedChoice(null);
            }}
            className={reviewMode === 'multiple_choice' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            Multiple Choice
          </Button>
        </div>

        {/* Review Card */}
        {currentWord && (
          <div className="space-y-6">
            {/* Flashcard Mode */}
            {reviewMode === 'flashcard' && (
              <div
                className={cn(
                  'min-h-[400px] p-8 rounded-2xl border-2 cursor-pointer transition-all',
                  'bg-zinc-900/60 border-zinc-800 hover:border-purple-600/50',
                  'flex items-center justify-center'
                )}
                onClick={handleFlashcardFlip}
              >
                {!isFlipped ? (
                  <div className="text-center">
                    <h2 className="text-4xl font-bold mb-4">{currentWord.word}</h2>
                    <p className="text-zinc-400 text-sm">Click to reveal definition</p>
                  </div>
                ) : (
                  <div className="text-center max-w-2xl">
                    <p className="text-xl text-zinc-300 mb-4">
                      {currentWord.definition || 'No definition available'}
                    </p>
                    {currentWord.example_sentence && (
                      <p className="text-sm text-zinc-500 italic mb-6">
                        "{currentWord.example_sentence}"
                      </p>
                    )}
                    <div className="flex gap-4 justify-center">
                      <Button
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-900/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubmit(false);
                        }}
                      >
                        Incorrect
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubmit(true);
                        }}
                      >
                        Correct
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fill in Blank Mode */}
            {reviewMode === 'fill_blank' && (
              <div className="p-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <div className="text-center mb-6">
                  <p className="text-xl text-zinc-300 mb-4">
                    {currentWord.definition || 'What is the word?'}
                  </p>
                  {currentWord.example_sentence && (
                    <p className="text-sm text-zinc-500 italic mb-4">
                      "{currentWord.example_sentence.replace(currentWord.word, '_____')}"
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Enter the word"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleFillBlankSubmit();
                      }
                    }}
                    className="bg-zinc-800 border-zinc-700 text-white text-center text-lg py-6"
                    autoFocus
                  />
                  <div className="flex gap-4 justify-center">
                    <Button
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-900/20"
                      onClick={() => handleSubmit(false, userAnswer)}
                    >
                      I Don't Know
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleFillBlankSubmit}
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Multiple Choice Mode */}
            {reviewMode === 'multiple_choice' && (
              <div className="p-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-4">{currentWord.word}</h2>
                  <p className="text-zinc-400">Select the correct definition:</p>
                </div>
                <div className="space-y-3 mb-6">
                  {generateChoices(currentWord).map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedChoice(index)}
                      className={cn(
                        'w-full p-4 rounded-lg border text-left transition-all',
                        selectedChoice === index
                          ? 'bg-blue-600/20 border-blue-600 text-blue-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                      )}
                    >
                      {String.fromCharCode(65 + index)}. {choice}
                    </button>
                  ))}
                </div>
                <div className="flex justify-center">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleMultipleChoiceSubmit}
                    disabled={selectedChoice === null}
                  >
                    Submit Answer
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
