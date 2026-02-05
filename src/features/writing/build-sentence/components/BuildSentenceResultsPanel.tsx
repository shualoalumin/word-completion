import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BuildSentenceQuestion, BuildSentenceQuestionResult } from '../types';
import { cn } from '@/lib/utils';

interface BuildSentenceResultsPanelProps {
  questions: BuildSentenceQuestion[];
  results: BuildSentenceQuestionResult[];
  darkMode: boolean;
  elapsedTime: number;
  targetTime: number;
}

// Grammar tip database for common patterns (fallback when AI doesn't provide)
const GRAMMAR_TIPS: Record<string, string> = {
  indirect_question: 'This is an indirect (embedded) question. After words like "know", "wonder", "tell me", use statement word order (Subject-Verb), NOT question inversion.',
  subject_verb_agreement: 'Subject-verb agreement: Singular subjects take singular verbs (is/was), plural subjects take plural verbs (are/were).',
  redundant_pronoun: 'Avoid redundant pronouns. When the subject is already defined (e.g., "the study guide"), don\'t add "it" before the verb.',
  tense: 'Verb tense consistency: Make sure the verb tense matches the time context of the sentence.',
  word_order: 'Basic English word order follows Subject-Verb-Object (SVO) pattern.',
};

// Trap type labels for display
const TRAP_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  indirect_question: { icon: '🔄', label: 'Indirect Question Trap', color: 'text-purple-400' },
  subject_verb_agreement: { icon: '🔗', label: 'Subject-Verb Agreement', color: 'text-blue-400' },
  redundant_pronoun: { icon: '👤', label: 'Redundant Pronoun Trap', color: 'text-orange-400' },
  tense: { icon: '⏰', label: 'Tense Consistency', color: 'text-cyan-400' },
  word_order: { icon: '📝', label: 'Word Order', color: 'text-green-400' },
};

export const BuildSentenceResultsPanel: React.FC<BuildSentenceResultsPanelProps> = ({
  questions,
  results,
  darkMode,
  elapsedTime,
  targetTime,
}) => {
  const { t } = useTranslation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalCount = results.length;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const withinTarget = elapsedTime <= targetTime;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-emerald-400';
    if (percentage >= 60) return 'text-blue-400';
    if (percentage >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = () => {
    if (percentage >= 80) return 'from-emerald-600/20 to-emerald-600/5';
    if (percentage >= 60) return 'from-blue-600/20 to-blue-600/5';
    if (percentage >= 40) return 'from-amber-600/20 to-amber-600/5';
    return 'from-red-600/20 to-red-600/5';
  };

  const getEncouragement = () => {
    if (correctCount === totalCount) {
      return withinTarget
        ? { icon: '🔥', msg: 'Perfect score under target time!' }
        : { icon: '🎯', msg: 'Perfect! All sentences correct!' };
    }
    if (percentage >= 80) return { icon: '✨', msg: 'Excellent work!' };
    if (percentage >= 60) return { icon: '💪', msg: 'Good effort! Keep practicing!' };
    return { icon: '📝', msg: 'Review the patterns and try again!' };
  };

  const encouragement = getEncouragement();

  // Analyze user error to provide specific feedback
  const analyzeError = (
    question: BuildSentenceQuestion,
    result: BuildSentenceQuestionResult
  ): string | null => {
    if (result.isCorrect) return null;
    
    const userOrder = result.userOrder;
    const correctOrder = result.correctOrder;
    
    // Check for indirect question inversion error
    // Pattern: User placed verb before subject in embedded clause
    if (question.trap_type === 'indirect_question') {
      return 'You may have used question word order (V-S) instead of statement order (S-V) in the embedded clause.';
    }
    
    // Check for distractor usage
    const distractorIds = question.puzzle.chunks
      .filter(c => c.is_distractor)
      .map(c => c.id);
    
    const usedDistractor = userOrder.some(id => distractorIds.includes(id));
    if (usedDistractor) {
      const usedDistractorText = question.puzzle.chunks
        .find(c => c.is_distractor && userOrder.includes(c.id))?.text;
      return `You used "${usedDistractorText}" which is a distractor (incorrect option).`;
    }
    
    // Generic mismatch
    const firstDiff = userOrder.findIndex((id, i) => id !== correctOrder[i]);
    if (firstDiff !== -1) {
      const wrongChunk = question.puzzle.chunks.find(c => c.id === userOrder[firstDiff])?.text;
      const rightChunk = question.puzzle.chunks.find(c => c.id === correctOrder[firstDiff])?.text;
      return `Position ${firstDiff + 1}: You placed "${wrongChunk}" but it should be "${rightChunk}".`;
    }
    
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Score Summary */}
      <div className={cn(
        'p-5 rounded-xl border bg-gradient-to-r',
        getScoreBg(),
        darkMode ? 'border-zinc-800' : 'border-gray-200',
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-16 h-16 rounded-full flex flex-col items-center justify-center border-4 shrink-0',
            percentage >= 60 ? 'border-emerald-500' : percentage >= 40 ? 'border-amber-500' : 'border-red-500',
          )}>
            <span className={cn('text-xl font-bold', getScoreColor())}>{percentage}%</span>
          </div>
          <div>
            <p className={cn('font-bold text-lg', getScoreColor())}>
              {encouragement.icon} {encouragement.msg}
            </p>
            <p className={cn('text-sm', darkMode ? 'text-zinc-400' : 'text-gray-600')}>
              {correctCount}/{totalCount} {t('results.correct', 'correct')}
              {withinTarget && (
                <span className="ml-2 text-emerald-500">⚡ Under target!</span>
              )}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className={cn(
            'px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5',
            darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-700',
          )}>
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(elapsedTime)}
          </div>
          <div className={cn(
            'px-2.5 py-1 rounded-full text-xs',
            darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-600',
          )}>
            Target: {formatTime(targetTime)}
          </div>
        </div>
      </div>

      {/* Per-question Review */}
      <div className={cn(
        'p-4 rounded-xl border',
        darkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-gray-50 border-gray-200',
      )}>
        <h3 className={cn(
          'text-base font-semibold mb-4 flex items-center gap-2',
          darkMode ? 'text-white' : 'text-gray-900',
        )}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('buildSentence.answerReview', 'Answer Review')}
        </h3>

        <div className="space-y-3">
          {results.map((result, idx) => {
            const question = questions[result.questionIndex];
            if (!question) return null;

            const chunkMap = new Map(question.puzzle.chunks.map((c) => [c.id, c]));
            const isExpanded = expandedIndex === idx;
            const trapInfo = question.trap_type ? TRAP_LABELS[question.trap_type] : null;
            const grammarTip = question.grammar_tip || (question.trap_type ? GRAMMAR_TIPS[question.trap_type] : null);
            const errorAnalysis = analyzeError(question, result);

            // Build user sentence from chunks
            const userSentenceParts = result.userOrder.map((id) => {
              const chunk = chunkMap.get(id);
              return chunk ? chunk.text : '?';
            });
            const userSentence = [
              question.dialogue.speaker_b.anchor_start,
              ...userSentenceParts,
              question.dialogue.speaker_b.anchor_end,
            ].filter(Boolean).join(' ');

            // Build correct sentence from chunks
            const correctSentenceParts = result.correctOrder.map((id) => {
              const chunk = chunkMap.get(id);
              return chunk ? chunk.text : '?';
            });

            return (
              <div
                key={idx}
                className={cn(
                  'p-3 rounded-lg border transition-all',
                  result.isCorrect
                    ? darkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-green-50 border-green-200'
                    : darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200',
                )}
              >
                {/* Header Row */}
                <div 
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                >
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded shrink-0',
                    result.isCorrect
                      ? darkMode ? 'bg-emerald-800 text-emerald-200' : 'bg-green-200 text-green-800'
                      : darkMode ? 'bg-red-800 text-red-200' : 'bg-red-200 text-red-800',
                  )}>
                    {result.isCorrect ? '✓' : '✗'} Q{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Trigger */}
                    <p className={cn('text-xs', darkMode ? 'text-zinc-500' : 'text-gray-400')}>
                      "{question.dialogue.speaker_a.text}"
                    </p>

                    {/* Correct answer */}
                    <p className={cn('text-sm font-medium', darkMode ? 'text-emerald-300' : 'text-emerald-700')}>
                      ✓ {question.dialogue.speaker_b.full_response}
                    </p>

                    {/* User answer (only if wrong) */}
                    {!result.isCorrect && (
                      <p className={cn('text-sm line-through opacity-70', darkMode ? 'text-red-400' : 'text-red-600')}>
                        ✗ {userSentence}
                      </p>
                    )}
                  </div>
                  
                  {/* Expand indicator */}
                  <span className={cn(
                    'text-xs transition-transform',
                    darkMode ? 'text-zinc-500' : 'text-gray-400',
                    isExpanded && 'rotate-180'
                  )}>
                    ▼
                  </span>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className={cn(
                    'mt-3 pt-3 border-t space-y-3',
                    darkMode ? 'border-zinc-700' : 'border-gray-200'
                  )}>
                    {/* Chunk Comparison (for wrong answers) */}
                    {!result.isCorrect && (
                      <div className="space-y-2">
                        <p className={cn('text-xs font-medium', darkMode ? 'text-zinc-400' : 'text-gray-500')}>
                          Chunk Comparison:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <span className={cn('text-xs', darkMode ? 'text-zinc-500' : 'text-gray-400')}>Your:</span>
                          {userSentenceParts.map((text, i) => {
                            const isCorrectPosition = result.userOrder[i] === result.correctOrder[i];
                            return (
                              <span
                                key={i}
                                className={cn(
                                  'px-1.5 py-0.5 rounded text-xs',
                                  isCorrectPosition
                                    ? darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-green-100 text-green-700'
                                    : darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                                )}
                              >
                                {text}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className={cn('text-xs', darkMode ? 'text-zinc-500' : 'text-gray-400')}>Correct:</span>
                          {correctSentenceParts.map((text, i) => (
                            <span
                              key={i}
                              className={cn(
                                'px-1.5 py-0.5 rounded text-xs',
                                darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-green-100 text-green-700'
                              )}
                            >
                              {text}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error Analysis (for wrong answers) */}
                    {!result.isCorrect && errorAnalysis && (
                      <div className={cn(
                        'p-2.5 rounded-lg',
                        darkMode ? 'bg-amber-900/20 border border-amber-800/50' : 'bg-amber-50 border border-amber-200'
                      )}>
                        <p className={cn('text-xs font-medium flex items-center gap-1.5', darkMode ? 'text-amber-300' : 'text-amber-700')}>
                          ⚠️ What went wrong:
                        </p>
                        <p className={cn('text-xs mt-1', darkMode ? 'text-amber-200/80' : 'text-amber-600')}>
                          {errorAnalysis}
                        </p>
                      </div>
                    )}

                    {/* Trap Type Badge */}
                    {trapInfo && (
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          darkMode ? 'bg-zinc-800' : 'bg-gray-100',
                          trapInfo.color
                        )}>
                          {trapInfo.icon} {trapInfo.label}
                        </span>
                      </div>
                    )}

                    {/* Grammar Tip */}
                    {grammarTip && (
                      <div className={cn(
                        'p-2.5 rounded-lg',
                        darkMode ? 'bg-blue-900/20 border border-blue-800/50' : 'bg-blue-50 border border-blue-200'
                      )}>
                        <p className={cn('text-xs font-medium flex items-center gap-1.5', darkMode ? 'text-blue-300' : 'text-blue-700')}>
                          💡 Grammar Insight:
                        </p>
                        <p className={cn('text-xs mt-1', darkMode ? 'text-blue-200/80' : 'text-blue-600')}>
                          {grammarTip}
                        </p>
                      </div>
                    )}

                    {/* Difficulty & Scenario */}
                    <div className="flex flex-wrap gap-2">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs',
                        darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-600'
                      )}>
                        {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                      </span>
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs',
                        darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-600'
                      )}>
                        {question.scenario}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
