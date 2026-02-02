import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { BuildSentenceChunk } from '../types';
import { cn } from '@/lib/utils';

// ── DroppableSlot ────────────────────────────────────────

interface DroppableSlotProps {
  slotIndex: number;
  chunk: BuildSentenceChunk | null;
  darkMode: boolean;
  showResult: boolean;
  isCorrect?: boolean;
  correctChunk?: BuildSentenceChunk;
  onRemove: (slotIndex: number) => void;
}

const DroppableSlot: React.FC<DroppableSlotProps> = ({
  slotIndex,
  chunk,
  darkMode,
  showResult,
  isCorrect,
  correctChunk,
  onRemove,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${slotIndex}` });

  return (
    <div
      ref={setNodeRef}
      onClick={() => {
        if (chunk && !showResult) onRemove(slotIndex);
      }}
      className={cn(
        'inline-flex items-center justify-center min-w-[60px] h-9 px-3 rounded-lg border-2 border-dashed transition-all text-sm font-medium',
        // Empty slot
        !chunk && !isOver && (darkMode
          ? 'border-zinc-600 bg-zinc-800/40 text-zinc-500'
          : 'border-gray-300 bg-gray-50 text-gray-400'),
        // Hover over empty slot
        !chunk && isOver && (darkMode
          ? 'border-blue-500 bg-blue-500/10 scale-105'
          : 'border-blue-400 bg-blue-50 scale-105'),
        // Filled slot (no result)
        chunk && !showResult && (darkMode
          ? 'border-blue-500/50 bg-blue-500/10 text-blue-300 cursor-pointer hover:bg-blue-500/20'
          : 'border-blue-400/50 bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100'),
        // Result: correct
        chunk && showResult && isCorrect && (darkMode
          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
          : 'border-emerald-500 bg-emerald-50 text-emerald-700'),
        // Result: incorrect
        chunk && showResult && !isCorrect && (darkMode
          ? 'border-red-500 bg-red-500/10 text-red-300'
          : 'border-red-500 bg-red-50 text-red-700'),
      )}
    >
      {chunk ? (
        <span>{chunk.text}</span>
      ) : (
        <span className="text-xs opacity-50">{slotIndex + 1}</span>
      )}
    </div>
  );
};

// ── SentenceSkeleton ─────────────────────────────────────

interface SentenceSkeletonProps {
  anchorStart: string | null;
  anchorEnd: string | null;
  slotsCount: number;
  slotContents: (string | null)[];
  chunks: BuildSentenceChunk[];
  darkMode: boolean;
  showResult: boolean;
  correctOrder?: string[];
  onRemoveSlot: (slotIndex: number) => void;
}

export const SentenceSkeleton: React.FC<SentenceSkeletonProps> = ({
  anchorStart,
  anchorEnd,
  slotsCount,
  slotContents,
  chunks,
  darkMode,
  showResult,
  correctOrder,
  onRemoveSlot,
}) => {
  const chunkMap = new Map(chunks.map((c) => [c.id, c]));

  return (
    <div className="flex flex-wrap items-center gap-2 leading-loose">
      {anchorStart && (
        <span className={cn(
          'text-[15px] font-semibold',
          darkMode ? 'text-gray-200' : 'text-gray-800',
        )}>
          {anchorStart}
        </span>
      )}

      {Array.from({ length: slotsCount }, (_, i) => {
        const chunkId = slotContents[i];
        const chunk = chunkId ? chunkMap.get(chunkId) ?? null : null;
        const correctId = correctOrder?.[i];
        const isCorrect = showResult && chunkId != null && chunkId === correctId;
        const correctChunk = correctId ? chunkMap.get(correctId) ?? undefined : undefined;

        return (
          <DroppableSlot
            key={i}
            slotIndex={i}
            chunk={chunk}
            darkMode={darkMode}
            showResult={showResult}
            isCorrect={isCorrect}
            correctChunk={correctChunk}
            onRemove={onRemoveSlot}
          />
        );
      })}

      {anchorEnd && (
        <span className={cn(
          'text-[15px] font-semibold',
          darkMode ? 'text-gray-200' : 'text-gray-800',
        )}>
          {anchorEnd}
        </span>
      )}
    </div>
  );
};
