# ETS TOEFL iBT Writing Task 1: "Build a Sentence" - Algorithm Analysis

> **Last Updated**: 2026-01-28
> **Based on**: 10 Official ETS Sample Questions (2026 Format)
> **Purpose**: Logic reverse-engineering for AI question generation

---

## 1. Task Structural Analysis

The "Build a Sentence" task evaluates a test-taker's ability to construct grammatically correct and syntactically complex sentences within a communicative context.

```
┌─────────────────────────────────────────────────────────────┐
│  TASK STRUCTURE                                             │
│  (Writing Task 1, 10 questions, 5:30 time limit)            │
├─────────────────────────────────────────────────────────────┤
│  [Context]   User A (Avatar): Trigger Sentence              │
│  [Response]  User B (Avatar): Target Sentence Structure     │
│              (Contains Anchors + Blanks)                    │
│  [Word Bank] 5-7 Scrambled Chunks (Phrases/Words)           │
│              (+ Optional Distractors)                       │
└─────────────────────────────────────────────────────────────┘
```

### Core Components
1.  **The Trigger (Context)**: A conversational prompt (Question or Statement) from an interlocutor.
2.  **The Target (Response)**: A grammatically perfect sentence that logically replies to the trigger.
3.  **Anchors**: Fixed text parts that provide the "skeleton" of the response (Start, Middle, or End).
4.  **The Chunks**: The target sentence split into movable units (single words or meaningful phrases).
5.  **Distractors**: Incorrect options (grammar traps or irrelevant words) included in the bank (in Hard questions).

---

## 2. Sentence Types & Complexity Levels

Based on the analysis of 10 samples, we identified 3 distinct difficulty tiers.

### Level 1: Basic Structures (Questions 4, 7, 8)
*   **Structure**: Simple Wh-Questions or Yes/No Questions.
*   **Grammar**: Present/Future Simple.
*   **Chunks**: mostly single words.
*   **Distractors**: None.
*   **Example**: "Do you have a shopping list?"
    *   Chunks: `list`, `do`, `a`, `have`, `shopping`, `you`

### Level 2: Intermediate Phrases (Questions 2, 3, 6)
*   **Structure**: Indirect Questions, Complex Noun Phrases.
*   **Grammar**: Modals, Continuous tenses.
*   **Chunks**: Mixed single words and 2-3 word phrases.
*   **Distractors**: Rare (0-1).
*   **Example**: "What is the water temperature like this time of year?"
    *   Chunks: `is`, `time of year` (phrase), `what`, `the water` (phrase), `this`, `like`, `temperature`

### Level 3: Advanced Syntax (Questions 1, 9, 10)
*   **Structure**: Relative Clauses, Passive Voice, Reported Speech.
*   **Grammar**: Past Tense, Agreement rules.
*   **Chunks**: Semantic units (Noun/Verb phrases).
*   **Distractors**: **Present (1 item)** - often grammar traps.
*   **Example**: "I used the study guide that was provided by the professor."
    *   Chunks: `by`, `the professor`, `that`, `the study guide`, `was provided`
    *   Distractor: `it` (Plausible noun, but redundant)

---

## 3. Reverse-Engineered Algorithm

To generate authentic questions, the AI must follow this step-by-step logic:

### Step 1: Context Generation
Generate a specialized Academic or Daily Life scenario.
*   **Trigger**: "How did you prepare for the exam?"
*   **Target Response**: "I used the study guide that was provided by the professor."

### Step 2: Intelligent Chunking (The "Secret Sauce")
Do NOT split by spaces. Split by **Syntactic Units**.

| Unit Type | Examples | Rule |
| :--- | :--- | :--- |
| **Noun Phrase** | `the study guide`, `a different department`, `the old city` | Keep determiner + adj + noun together often. |
| **Verb Phrase** | `was provided`, `showed us around`, `moving to` | Keep Aux + V or V + Prep together. |
| **Function Words** | `that`, `if`, `who`, `do`, `what` | Usually kept as single chunks to test syntax. |

### Step 3: Anchor Selection
Select 15-30% of the sentence to fix as anchors to guide the user (and prevent ambiguity).
*   *Start Anchor*: "I used ____" (Sets the subject)
*   *End Anchor*: "____ fantastic." (Sets the adjective/complement)
*   *Split Anchor*: "The ____ ____ ____ fantastic."

### Step 4: Distractor Injection (Hard Mode Only)
If Difficulty == Hard, generate 1 distractor based on specific rules:
1.  **Subject-Verb Agreement Trap**: `was` vs `were`.
2.  **Redundant Pronoun**: `it` (when subject is already defined as 'the study guide').
3.  **False Conjunction**: `if` vs `whether` (in indirect questions).
4.  **Tense Trap**: `learn` vs `learned`.

---

## 4. Chunking Logic Pseudo-Code

```typescript
function generateChunks(sentence: string, difficulty: 'easy'|'medium'|'hard') {
  const nlp = compromise(sentence);
  let chunks = [];

  if (difficulty === 'easy') {
    // Mostly single words, keep only very tight collocations
    chunks = sentence.split(' ');
  } else {
    // Semantic Chunking
    // 1. Extract Noun Phrases (NP): "the study guide"
    // 2. Extract Verb Phrases (VP): "was provided"
    // 3. Keep remaining function words separate
    chunks = nlp.match('(NP|VP|P|C)').out('array'); 
  }
  
  // Shuffle logic
  return shuffle(chunks);
}
```

---

## 5. Sample Data Pattern (JSON Schema)

This is how we will store these questions in our `exercises` table (`content` column).

```json
{
  "scenario": "Academic - Class Preparation",
  "difficulty": "hard",
  "dialogue": {
    "speaker_a": {
      "text": "How did you prepare for the exam?",
      "avatar": "student_male"
    },
    "speaker_b": {
      "full_response": "I used the study guide that was provided by the professor.",
      "anchor_start": "I used",
      "anchor_end": null
    }
  },
  "puzzle": {
    "slots_count": 5, 
    "chunks": [
      { "id": "c1", "text": "by", "is_distractor": false },
      { "id": "c2", "text": "the professor", "is_distractor": false },
      { "id": "c3", "text": "that", "is_distractor": false },
      { "id": "c4", "text": "the study guide", "is_distractor": false },
      { "id": "c5", "text": "was provided", "is_distractor": false },
      { "id": "c6", "text": "it", "is_distractor": true } 
    ],
    "correct_order": ["c4", "c3", "c5", "c1", "c2"]
  }
}
```

---

## 6. Implementation Strategy

1.  **Phase 3.0**: Build the `BuildSentence` component using `dnd-kit` (React Drag & Drop).
2.  **Phase 3.1**: Create `generate-sentence-puzzle` Edge Function.
3.  **Phase 3.2**: Implement "Distractor Logic" in the prompt engineering (Gemini).

This analysis adheres to the exact patterns observed in the official ETS 2026 samples.
