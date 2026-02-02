import React from 'react';
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

export const BuildSentenceResultsPanel: React.FC<BuildSentenceResultsPanelProps> = ({
  questions,
  results,
  darkMode,
  elapsedTime,
  targetTime,
}) => {
  const { t } = useTranslation();
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

            const userSentence = [
              question.dialogue.speaker_b.anchor_start,
              ...result.userOrder.map((id) => chunkMap.get(id)?.text ?? '?'),
              question.dialogue.speaker_b.anchor_end,
            ].filter(Boolean).join(' ');

            return (
              <div
                key={idx}
                className={cn(
                  'p-3 rounded-lg border',
                  result.isCorrect
                    ? darkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-green-50 border-green-200'
                    : darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200',
                )}
              >
                <div className="flex items-start gap-3">
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
