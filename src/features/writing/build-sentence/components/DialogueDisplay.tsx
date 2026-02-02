import React from 'react';
import { BuildSentenceDialogue } from '../types';
import { cn } from '@/lib/utils';

interface DialogueDisplayProps {
  dialogue: BuildSentenceDialogue;
  darkMode: boolean;
  children: React.ReactNode; // SentenceSkeleton rendered inside Speaker B
}

const AVATAR_COLORS: Record<string, string> = {
  student_male: 'bg-blue-500',
  student_female: 'bg-pink-500',
};

const AVATAR_LABELS: Record<string, string> = {
  student_male: 'A',
  student_female: 'B',
};

export const DialogueDisplay: React.FC<DialogueDisplayProps> = ({
  dialogue,
  darkMode,
  children,
}) => {
  const aColor = AVATAR_COLORS[dialogue.speaker_a.avatar] || 'bg-blue-500';
  const bColor = AVATAR_COLORS[dialogue.speaker_b.full_response ? 'student_female' : 'student_male'] || 'bg-emerald-500';

  return (
    <div className="space-y-5">
      {/* Speaker A — Trigger */}
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
          aColor,
        )}>
          {AVATAR_LABELS[dialogue.speaker_a.avatar] || 'A'}
        </div>
        <div className={cn(
          'px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[80%]',
          darkMode
            ? 'bg-zinc-800 text-gray-200'
            : 'bg-gray-100 text-gray-800',
        )}>
          <p className="text-[15px] leading-relaxed">{dialogue.speaker_a.text}</p>
        </div>
      </div>

      {/* Speaker B — Response (sentence skeleton rendered via children) */}
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
          bColor,
        )}>
          B
        </div>
        <div className={cn(
          'px-4 py-3 rounded-2xl rounded-tl-sm flex-1',
          darkMode
            ? 'bg-zinc-800/60 border border-zinc-700'
            : 'bg-blue-50/60 border border-blue-100',
        )}>
          {children}
        </div>
      </div>
    </div>
  );
};
