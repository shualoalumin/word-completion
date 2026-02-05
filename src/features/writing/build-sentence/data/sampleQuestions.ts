import { BuildSentenceQuestion } from '../types';
import { EXERCISE_CONFIG } from '@/core/constants';

/**
 * 10 sample questions based on ETS 2026 Official Sample Questions.
 * Covers all 3 difficulty levels and key grammar patterns:
 *   - Easy: Simple Wh-questions, Yes/No questions (single-word chunks)
 *   - Medium: Indirect questions, complex noun phrases (mixed chunks)
 *   - Hard: Relative clauses, passive voice, reported speech (+ distractor)
 */
export const SAMPLE_QUESTIONS: BuildSentenceQuestion[] = [
  // ── Level 1: Easy ──────────────────────────────────────
  {
    id: 'bs-e1',
    scenario: 'Daily Life - Weekend Plans',
    difficulty: 'easy',
    dialogue: {
      speaker_a: { text: "I'm looking forward to the concert this weekend.", avatar: 'student_female' },
      speaker_b: {
        full_response: 'What time does it start?',
        anchor_start: null,
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 5,
      chunks: [
        { id: 'c1', text: 'does', is_distractor: false },
        { id: 'c2', text: 'what', is_distractor: false },
        { id: 'c3', text: 'time', is_distractor: false },
        { id: 'c4', text: 'it', is_distractor: false },
        { id: 'c5', text: 'start', is_distractor: false },
      ],
      correct_order: ['c2', 'c3', 'c1', 'c4', 'c5'],
    },
  },
  {
    id: 'bs-e2',
    scenario: 'Daily Life - Grocery Shopping',
    difficulty: 'easy',
    dialogue: {
      speaker_a: { text: 'I need to buy groceries today.', avatar: 'student_male' },
      speaker_b: {
        full_response: 'Do you have a shopping list?',
        anchor_start: null,
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 6,
      chunks: [
        { id: 'c1', text: 'list', is_distractor: false },
        { id: 'c2', text: 'do', is_distractor: false },
        { id: 'c3', text: 'a', is_distractor: false },
        { id: 'c4', text: 'have', is_distractor: false },
        { id: 'c5', text: 'shopping', is_distractor: false },
        { id: 'c6', text: 'you', is_distractor: false },
      ],
      correct_order: ['c2', 'c6', 'c4', 'c3', 'c5', 'c1'],
    },
  },
  {
    id: 'bs-e3',
    scenario: 'Daily Life - Cooking Class',
    difficulty: 'easy',
    dialogue: {
      speaker_a: { text: "I'll be taking a cooking class this weekend.", avatar: 'student_female' },
      speaker_b: {
        full_response: 'What recipes will you learn?',
        anchor_start: null,
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 5,
      chunks: [
        { id: 'c1', text: 'learn', is_distractor: false },
        { id: 'c2', text: 'what', is_distractor: false },
        { id: 'c3', text: 'will', is_distractor: false },
        { id: 'c4', text: 'you', is_distractor: false },
        { id: 'c5', text: 'recipes', is_distractor: false },
      ],
      correct_order: ['c2', 'c5', 'c3', 'c4', 'c1'],
    },
  },

  // ── Level 2: Medium ────────────────────────────────────
  {
    id: 'bs-m1',
    scenario: 'Academic - Office Hours',
    difficulty: 'medium',
    dialogue: {
      speaker_a: { text: 'I heard Anna got a promotion.', avatar: 'student_male' },
      speaker_b: {
        full_response: 'Do you know if she will be moving to a different department?',
        anchor_start: null,
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 7,
      chunks: [
        { id: 'c1', text: 'a different department', is_distractor: false },
        { id: 'c2', text: 'if', is_distractor: false },
        { id: 'c3', text: 'moving to', is_distractor: false },
        { id: 'c4', text: 'know', is_distractor: false },
        { id: 'c5', text: 'do', is_distractor: false },
        { id: 'c6', text: 'you', is_distractor: false },
        { id: 'c7', text: 'she will be', is_distractor: false },
      ],
      correct_order: ['c5', 'c6', 'c4', 'c2', 'c7', 'c3', 'c1'],
    },
  },
  {
    id: 'bs-m2',
    scenario: 'Daily Life - Travel Planning',
    difficulty: 'medium',
    dialogue: {
      speaker_a: { text: "We're planning a trip to the mountains next weekend.", avatar: 'student_female' },
      speaker_b: {
        full_response: 'Can you tell me whether the cabins will be available?',
        anchor_start: null,
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 6,
      chunks: [
        { id: 'c1', text: 'the cabins', is_distractor: false },
        { id: 'c2', text: 'available', is_distractor: false },
        { id: 'c3', text: 'whether', is_distractor: false },
        { id: 'c4', text: 'can', is_distractor: false },
        { id: 'c5', text: 'will be', is_distractor: false },
        { id: 'c6', text: 'you tell me', is_distractor: false },
      ],
      correct_order: ['c4', 'c6', 'c3', 'c1', 'c5', 'c2'],
    },
  },
  {
    id: 'bs-m3',
    scenario: 'Daily Life - Beach Trip',
    difficulty: 'medium',
    dialogue: {
      speaker_a: { text: "I'm planning to go to the beach tomorrow.", avatar: 'student_male' },
      speaker_b: {
        full_response: 'What is the water temperature like this time of year?',
        anchor_start: null,
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 7,
      chunks: [
        { id: 'c1', text: 'is', is_distractor: false },
        { id: 'c2', text: 'time of year', is_distractor: false },
        { id: 'c3', text: 'what', is_distractor: false },
        { id: 'c4', text: 'the water', is_distractor: false },
        { id: 'c5', text: 'this', is_distractor: false },
        { id: 'c6', text: 'like', is_distractor: false },
        { id: 'c7', text: 'temperature', is_distractor: false },
      ],
      correct_order: ['c3', 'c1', 'c4', 'c7', 'c6', 'c5', 'c2'],
    },
  },
  {
    id: 'bs-m4',
    scenario: 'Academic - Museum Visit',
    difficulty: 'medium',
    dialogue: {
      speaker_a: { text: 'The museum exhibition opens next month.', avatar: 'student_female' },
      speaker_b: {
        full_response: 'Do you know how much the tickets will cost?',
        anchor_start: null,
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 7,
      chunks: [
        { id: 'c1', text: 'do', is_distractor: false },
        { id: 'c2', text: 'you', is_distractor: false },
        { id: 'c3', text: 'how', is_distractor: false },
        { id: 'c4', text: 'know', is_distractor: false },
        { id: 'c5', text: 'tickets', is_distractor: false },
        { id: 'c6', text: 'will cost', is_distractor: false },
        { id: 'c7', text: 'much the', is_distractor: false },
      ],
      correct_order: ['c1', 'c2', 'c4', 'c3', 'c7', 'c5', 'c6'],
    },
  },

  // ── Level 3: Hard ──────────────────────────────────────
  {
    id: 'bs-h1',
    scenario: 'Daily Life - Vacation',
    difficulty: 'hard',
    dialogue: {
      speaker_a: { text: 'What was the highlight of your trip?', avatar: 'student_male' },
      speaker_b: {
        full_response: 'The tour guides who showed us around the old city were fantastic.',
        anchor_start: 'The',
        anchor_end: 'fantastic.',
      },
    },
    puzzle: {
      slots_count: 5,
      chunks: [
        { id: 'c1', text: 'were', is_distractor: false },
        { id: 'c2', text: 'the old city', is_distractor: false },
        { id: 'c3', text: 'tour guides', is_distractor: false },
        { id: 'c4', text: 'showed us around', is_distractor: false },
        { id: 'c5', text: 'who', is_distractor: false },
        { id: 'c6', text: 'was', is_distractor: true },
      ],
      correct_order: ['c3', 'c5', 'c4', 'c2', 'c1'],
    },
  },
  {
    id: 'bs-h2',
    scenario: 'Academic - Book Club',
    difficulty: 'hard',
    dialogue: {
      speaker_a: { text: 'What did Maria ask you about the book you\'re reading?', avatar: 'student_female' },
      speaker_b: {
        full_response: 'She wanted to know where she could buy a copy.',
        anchor_start: 'She',
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 6,
      chunks: [
        { id: 'c1', text: 'wanted', is_distractor: false },
        { id: 'c2', text: 'a copy', is_distractor: false },
        { id: 'c3', text: 'buy', is_distractor: false },
        { id: 'c4', text: 'to know', is_distractor: false },
        { id: 'c5', text: 'could', is_distractor: false },
        { id: 'c6', text: 'where she', is_distractor: false },
        { id: 'c7', text: 'wants', is_distractor: true },
      ],
      correct_order: ['c1', 'c4', 'c6', 'c5', 'c3', 'c2'],
    },
  },
  {
    id: 'bs-h3',
    scenario: 'Academic - Class Preparation',
    difficulty: 'hard',
    dialogue: {
      speaker_a: { text: 'How did you prepare for the exam?', avatar: 'student_male' },
      speaker_b: {
        full_response: 'I used the study guide that was provided by the professor.',
        anchor_start: 'I used',
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 5,
      chunks: [
        { id: 'c1', text: 'by', is_distractor: false },
        { id: 'c2', text: 'the professor', is_distractor: false },
        { id: 'c3', text: 'that', is_distractor: false },
        { id: 'c4', text: 'the study guide', is_distractor: false },
        { id: 'c5', text: 'was provided', is_distractor: false },
        { id: 'c6', text: 'it', is_distractor: true },
      ],
      correct_order: ['c4', 'c3', 'c5', 'c1', 'c2'],
    },
  },

  // ── Additional Questions ─────────────────────────────
  {
    id: 'bs-e4',
    scenario: 'Academic - Library',
    difficulty: 'easy',
    dialogue: {
      speaker_a: { text: "I'm looking for the latest issue of the biology journal.", avatar: 'student_male' },
      speaker_b: {
        full_response: 'Where can I find it?',
        anchor_start: null,
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 5,
      chunks: [
        { id: 'c1', text: 'find', is_distractor: false },
        { id: 'c2', text: 'where', is_distractor: false },
        { id: 'c3', text: 'can', is_distractor: false },
        { id: 'c4', text: 'I', is_distractor: false },
        { id: 'c5', text: 'it', is_distractor: false },
      ],
      correct_order: ['c2', 'c3', 'c4', 'c1', 'c5'],
    }
  },
  {
    id: 'bs-e5',
    scenario: 'Daily Life - Weather',
    difficulty: 'easy',
    dialogue: {
      speaker_a: { text: "It looks like it might rain later this afternoon.", avatar: 'student_female' },
      speaker_b: {
        full_response: 'Should I bring an umbrella?',
        anchor_start: null,
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 5,
      chunks: [
        { id: 'c1', text: 'bring', is_distractor: false },
        { id: 'c2', text: 'an', is_distractor: false },
        { id: 'c3', text: 'umbrella', is_distractor: false },
        { id: 'c4', text: 'should', is_distractor: false },
        { id: 'c5', text: 'I', is_distractor: false },
      ],
      correct_order: ['c4', 'c5', 'c1', 'c2', 'c3'],
    }
  },
  {
    id: 'bs-m5',
    scenario: 'Academic - Assignment',
    difficulty: 'medium',
    dialogue: {
      speaker_a: { text: "I'm having trouble finishing the history essay.", avatar: 'student_male' },
      speaker_b: {
        full_response: 'Have you decided which topic you will write about?',
        anchor_start: null,
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 6,
      chunks: [
        { id: 'c1', text: 'decided', is_distractor: false },
        { id: 'c2', text: 'topic you', is_distractor: false },
        { id: 'c3', text: 'which', is_distractor: false },
        { id: 'c4', text: 'have you', is_distractor: false },
        { id: 'c5', text: 'will write', is_distractor: false },
        { id: 'c6', text: 'about', is_distractor: false },
      ],
      correct_order: ['c4', 'c1', 'c3', 'c2', 'c5', 'c6'],
    }
  },
  {
    id: 'bs-m6',
    scenario: 'Daily Life - Hobbies',
    difficulty: 'medium',
    dialogue: {
      speaker_a: { text: "I've started learning to play the guitar recently.", avatar: 'student_female' },
      speaker_b: {
        full_response: 'Tell me how long it took to learn that song.',
        anchor_start: 'Tell me',
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 5,
      chunks: [
        { id: 'c1', text: 'it took', is_distractor: false },
        { id: 'c2', text: 'to learn', is_distractor: false },
        { id: 'c3', text: 'how long', is_distractor: false },
        { id: 'c4', text: 'that', is_distractor: false },
        { id: 'c5', text: 'song', is_distractor: false },
        { id: 'c6', text: 'was', is_distractor: true },
      ],
      correct_order: ['c3', 'c1', 'c2', 'c4', 'c5'],
    }
  },
  {
    id: 'bs-h4',
    scenario: 'Academic - Presentation',
    difficulty: 'hard',
    dialogue: {
      speaker_a: { text: "The presentation scheduled for Monday has been postponed.", avatar: 'student_male' },
      speaker_b: {
        full_response: 'Does anyone know why the deadline was changed so suddenly?',
        anchor_start: 'Does anyone',
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 5,
      chunks: [
        { id: 'c1', text: 'why the', is_distractor: false },
        { id: 'c2', text: 'deadline', is_distractor: false },
        { id: 'c3', text: 'was changed', is_distractor: false },
        { id: 'c4', text: 'so suddenly', is_distractor: false },
        { id: 'c5', text: 'know', is_distractor: false },
        { id: 'c6', text: 'if', is_distractor: true },
        { id: 'c7', text: 'changing', is_distractor: true },
      ],
      correct_order: ['c5', 'c1', 'c2', 'c3', 'c4'],
    }
  },
  {
    id: 'bs-h5',
    scenario: 'Business - Meeting',
    difficulty: 'hard',
    dialogue: {
      speaker_a: { text: "The manager wants to discuss the new project details.", avatar: 'student_female' },
      speaker_b: {
        full_response: 'I wonder if the budget we requested has been approved.',
        anchor_start: 'I wonder',
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 5,
      chunks: [
        { id: 'c1', text: 'the budget', is_distractor: false },
        { id: 'c2', text: 'we requested', is_distractor: false },
        { id: 'c3', text: 'if', is_distractor: false },
        { id: 'c4', text: 'has been', is_distractor: false },
        { id: 'c5', text: 'approved', is_distractor: false },
        { id: 'c6', text: 'requested', is_distractor: true },
      ],
      correct_order: ['c3', 'c1', 'c2', 'c4', 'c5'],
    }
  },
  {
    id: 'bs-e6',
    scenario: 'Daily Life - Restaurant',
    difficulty: 'easy',
    dialogue: {
      speaker_a: { text: "This restaurant is famous for its homemade pasta.", avatar: 'student_male' },
      speaker_b: {
        full_response: 'Shall we make a reservation?',
        anchor_start: null,
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 5,
      chunks: [
        { id: 'c1', text: 'we', is_distractor: false },
        { id: 'c2', text: 'make', is_distractor: false },
        { id: 'c3', text: 'a', is_distractor: false },
        { id: 'c4', text: 'shall', is_distractor: false },
        { id: 'c5', text: 'reservation', is_distractor: false },
      ],
      correct_order: ['c4', 'c1', 'c2', 'c3', 'c5'],
    }
  },
  {
    id: 'bs-m7',
    scenario: 'Academic - Research',
    difficulty: 'medium',
    dialogue: {
      speaker_a: { text: "The professor invited several students to join his research group.", avatar: 'student_female' },
      speaker_b: {
        full_response: 'I heard that only a few will be selected.',
        anchor_start: 'I heard',
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 4,
      chunks: [
        { id: 'c1', text: 'only a few', is_distractor: false },
        { id: 'c2', text: 'will be', is_distractor: false },
        { id: 'c3', text: 'selected', is_distractor: false },
        { id: 'c4', text: 'that', is_distractor: false },
        { id: 'c5', text: 'selecting', is_distractor: true },
      ],
      correct_order: ['c4', 'c1', 'c2', 'c3'],
    }
  },
  {
    id: 'bs-m8',
    scenario: 'Daily Life - Transportation',
    difficulty: 'medium',
    dialogue: {
      speaker_a: { text: "The bus to the airport leaves every thirty minutes.", avatar: 'student_male' },
      speaker_b: {
        full_response: 'Can you tell me where the bus stop is?',
        anchor_start: 'Can you',
        anchor_end: null,
      },
    },
    puzzle: {
      slots_count: 4,
      chunks: [
        { id: 'c1', text: 'where', is_distractor: false },
        { id: 'c2', text: 'the bus stop', is_distractor: false },
        { id: 'c3', text: 'is', is_distractor: false },
        { id: 'c4', text: 'tell me', is_distractor: false },
        { id: 'c5', text: 'at', is_distractor: true },
      ],
      correct_order: ['c4', 'c1', 'c2', 'c3'],
    }
  },
  {
    id: 'bs-h6',
    scenario: 'Academic - Graduation',
    difficulty: 'hard',
    dialogue: {
      speaker_a: { text: "I can't believe we are finally graduating next month!", avatar: 'student_female' },
      speaker_b: {
        full_response: 'The advice that the speaker gave us was very inspiring.',
        anchor_start: 'The',
        anchor_end: 'inspiring.',
      },
    },
    puzzle: {
      slots_count: 5,
      chunks: [
        { id: 'c1', text: 'advice', is_distractor: false },
        { id: 'c2', text: 'that the', is_distractor: false },
        { id: 'c3', text: 'speaker', is_distractor: false },
        { id: 'c4', text: 'gave us', is_distractor: false },
        { id: 'c5', text: 'was very', is_distractor: false },
        { id: 'c6', text: 'giving', is_distractor: true },
      ],
      correct_order: ['c1', 'c2', 'c3', 'c4', 'c5'],
    }
  },
];

/**
 * Pick `count` random questions from the sample pool.
 * Optionally exclude questions recently used (by speaker_b full_response) to space repetition.
 */
export function getSessionQuestions(
  count: number = EXERCISE_CONFIG.BUILD_SENTENCE.QUESTIONS_PER_SET,
  excludeResponseKeys?: Set<string>
): BuildSentenceQuestion[] {
  const pool = excludeResponseKeys?.size
    ? SAMPLE_QUESTIONS.filter((q) => !excludeResponseKeys.has(q.dialogue.speaker_b.full_response))
    : [...SAMPLE_QUESTIONS];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
