import React, { useMemo } from 'react';
import { BuildSentenceDialogue } from '../types';
import { AVATARS } from '../constants';
import { cn } from '@/lib/utils';

interface DialogueDisplayProps {
  dialogue: BuildSentenceDialogue;
  darkMode: boolean;
  children: React.ReactNode; // SentenceSkeleton rendered inside Speaker B
}

/**
 * Simple hash function to get a consistent number from a string
 */
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export const DialogueDisplay: React.FC<DialogueDisplayProps> = ({
  dialogue,
  darkMode,
  children,
}) => {
  // Select avatars based on dialogue content to keep them consistent for the same question
  const { avatarA, avatarB } = useMemo(() => {
    const hashA = hashString(dialogue.speaker_a.text);
    const hashB = hashString(dialogue.speaker_b.full_response || 'speaker_b');
    
    // For Speaker A, we can use the gender hint if provided in dialogue.speaker_a.avatar
    const isFemaleA = dialogue.speaker_a.avatar.includes('female');
    const filteredA = AVATARS.filter(a => isFemaleA ? a.gender === 'female' : true);
    const selectedA = filteredA[hashA % filteredA.length];
    
    // For Speaker B, try to get a different one, preferably opposite gender or just different
    // By default, we prefer female speakers as requested by the user
    const femaleAvatars = AVATARS.filter(a => a.gender === 'female');
    const maleAvatars = AVATARS.filter(a => a.gender === 'male');
    
    // Combine but weight female speakers if possible
    const preferredB = femaleAvatars.length > 0 && (hashB % 3 === 0 || !isFemaleA) 
      ? femaleAvatars 
      : AVATARS;
      
    let selectedB = preferredB[hashB % preferredB.length];
    
    // Ensure they are not the same avatar
    if (selectedB.id === selectedA.id) {
      selectedB = AVATARS[(hashB + 1) % AVATARS.length];
    }
    
    return { avatarA: selectedA, avatarB: selectedB };
  }, [dialogue]);

  return (
    <div className="space-y-6">
    {/* Speaker A — Trigger */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className={cn(
            "w-12 h-12 rounded-full overflow-hidden border-2 shadow-sm",
            darkMode ? "border-zinc-700 bg-zinc-800" : "border-white bg-gray-200"
          )}>
            <img 
              src={avatarA.url} 
              alt="Speaker A" 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=A&background=3b82f6&color=fff`;
              }}
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-zinc-950">
            A
          </div>
        </div>
        <div className={cn(
          'px-5 py-3 rounded-2xl rounded-tl-sm max-w-[85%] shadow-sm',
          darkMode
            ? 'bg-zinc-800 text-gray-200'
            : 'bg-white border border-gray-100 text-gray-800',
        )}>
          <p className="text-[15px] leading-relaxed font-medium">{dialogue.speaker_a.text}</p>
        </div>
      </div>

      {/* Speaker B — Response (sentence skeleton rendered via children) */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className={cn(
            "w-12 h-12 rounded-full overflow-hidden border-2 shadow-sm",
            darkMode ? "border-zinc-700 bg-zinc-800" : "border-white bg-gray-200"
          )}>
            <img 
              src={avatarB.url} 
              alt="Speaker B" 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=B&background=10b981&color=fff`;
              }}
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-zinc-950">
            B
          </div>
        </div>
        <div className={cn(
          'px-5 py-4 rounded-2xl rounded-tl-sm flex-1 shadow-sm',
          darkMode
            ? 'bg-zinc-800/40 border border-zinc-700'
            : 'bg-emerald-50/40 border border-emerald-100',
        )}>
          {children}
        </div>
      </div>
    </div>
  );
};

