import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { BuildSentenceChunk } from '../types';
import { cn } from '@/lib/utils';

// ── DraggableChunk ───────────────────────────────────────

interface DraggableChunkProps {
  chunk: BuildSentenceChunk;
  darkMode: boolean;
  disabled: boolean;
  showResult: boolean;
  onClick: (chunkId: string) => void;
}

const DraggableChunk: React.FC<DraggableChunkProps> = ({
  chunk,
  darkMode,
  disabled,
  showResult,
  onClick,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `chunk-${chunk.id}`,
    data: { chunkId: chunk.id },
    disabled,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => {
        if (!disabled && !showResult) onClick(chunk.id);
      }}
      className={cn(
        'px-4 py-2 rounded-lg border text-sm font-medium transition-all select-none',
        'touch-manipulation',
        // Normal state
        !isDragging && !showResult && (darkMode
          ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:border-zinc-600 active:scale-95'
          : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400 active:scale-95 shadow-sm'),
        // Dragging
        isDragging && 'opacity-50 scale-105 z-50',
        // Distractor in results
        showResult && chunk.is_distractor && (darkMode
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          : 'bg-amber-50 border-amber-300 text-amber-700'),
        // Disabled / results for non-distractor
        showResult && !chunk.is_distractor && (darkMode
          ? 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500'
          : 'bg-gray-50 border-gray-200 text-gray-400'),
        disabled && 'cursor-default',
      )}
    >
      {chunk.text}
      {showResult && chunk.is_distractor && (
        <span className="ml-1.5 text-[10px] font-bold opacity-70">TRAP</span>
      )}
    </button>
  );
};

// ── WordBank ─────────────────────────────────────────────

interface WordBankProps {
  chunks: BuildSentenceChunk[];
  availableChunkIds: string[];
  darkMode: boolean;
  showResult: boolean;
  onClickChunk: (chunkId: string) => void;
}

export const WordBank: React.FC<WordBankProps> = ({
  chunks,
  availableChunkIds,
  darkMode,
  showResult,
  onClickChunk,
}) => {
  const availableSet = new Set(availableChunkIds);

  // Show all chunks when showing results, otherwise only available
  const visibleChunks = showResult
    ? chunks
    : chunks.filter((c) => availableSet.has(c.id));

  if (visibleChunks.length === 0 && !showResult) return null;

  return (
    <div className={cn(
      'mt-5 p-4 rounded-xl border',
      darkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-gray-50 border-gray-200',
    )}>
      <p className={cn(
        'text-xs font-semibold uppercase tracking-wider mb-3',
        darkMode ? 'text-zinc-500' : 'text-gray-400',
      )}>
        Word Bank
      </p>
      <div className="flex flex-wrap gap-2">
        {visibleChunks.map((chunk) => (
          <DraggableChunk
            key={chunk.id}
            chunk={chunk}
            darkMode={darkMode}
            disabled={showResult || !availableSet.has(chunk.id)}
            showResult={showResult}
            onClick={onClickChunk}
          />
        ))}
      </div>
    </div>
  );
};
