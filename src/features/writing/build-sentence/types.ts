import { Difficulty } from '@/core/types/exercise';

// ============================================
// Build a Sentence types
// ============================================

export type BuildSentenceDifficulty = 'easy' | 'medium' | 'hard';

/** Map build-sentence difficulty to core Difficulty for timer integration */
export function mapToCoreDifficulty(d: BuildSentenceDifficulty): Difficulty {
  if (d === 'medium') return 'intermediate';
  return d;
}

export interface BuildSentenceChunk {
  id: string;
  text: string;
  is_distractor: boolean;
}

export interface BuildSentenceSpeaker {
  text: string;
  avatar: string;
}

export interface BuildSentenceDialogue {
  speaker_a: BuildSentenceSpeaker;
  speaker_b: {
    full_response: string;
    anchor_start: string | null;
    anchor_end: string | null;
  };
}

export interface BuildSentencePuzzle {
  slots_count: number;
  chunks: BuildSentenceChunk[];
  correct_order: string[];
}

export interface BuildSentenceQuestion {
  id: string;
  scenario: string;
  difficulty: BuildSentenceDifficulty;
  dialogue: BuildSentenceDialogue;
  puzzle: BuildSentencePuzzle;
  /** Grammar explanation for correct answer (AI generated) */
  grammar_tip?: string;
  /** Type of trap in this question (for error analysis) */
  trap_type?: 'indirect_question' | 'subject_verb_agreement' | 'redundant_pronoun' | 'tense' | 'word_order' | null;
  /** Exercise ID from database (for history saving) */
  exercise_id?: string;
  /** Topic category (Academic, Daily Life, etc.) */
  topic_category?: string;
}

export interface BuildSentenceQuestionResult {
  questionIndex: number;
  userOrder: string[];
  correctOrder: string[];
  isCorrect: boolean;
}
