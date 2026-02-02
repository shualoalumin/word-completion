# ETS TOEFL iBT Writing Task 1: "Build a Sentence" - Algorithm Analysis

> **Last Updated**: 2026-02-02
> **Based on**: 10 Official ETS Sample Questions (2026 Format) + Real Test Performance Data
> **Sources**: ETS Official Samples, [Transformation English](https://www.youtube.com/@transformation-english) Analysis
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

Based on the analysis of 10 official ETS samples and real test-taker performance data.

> **Key Stat**: Average score is **5/10** (50% failure rate). Build a Sentence is the single biggest point-loss area in the Writing section — more than Email + Academic Discussion combined.
>
> **Scoring**: Binary (0 or 1 per question). No partial credit — every tile must be in the correct position.

### The #1 Trap: Indirect Question Word Order

The most common mistake across all levels is **embedded (indirect) question word order**. When a question is embedded inside a statement, it follows **statement order (S-V)**, NOT question inversion.

| Type | Example | Word Order |
| :--- | :--- | :--- |
| **Direct Question** | "What **are** you talking about?" | Question order (Aux-S-V) |
| **Indirect/Embedded** | "I don't know what you **are** talking about." | Statement order (S-V) ✓ |
| **Common Mistake** | "I don't know what **are** you talking about." | ✗ Wrong inversion |

This trap appears in **Level 2 and Level 3** questions. The chunks are designed so that both orders *look* plausible, but only statement order is correct.

### Level 1: Basic Structures (Questions 4, 7, 8)
*   **Structure**: Simple Wh-Questions or Yes/No Questions.
*   **Grammar**: Present/Future Simple.
*   **Chunks**: Mostly single words (5-6 chunks).
*   **Distractors**: None.
*   **Trap Pattern**: Basic word order (Do/Does + S + V).
*   **Avg. Success Rate**: ~70% (most test-takers get these right).
*   **Example**: "Do you have a shopping list?"
    *   Chunks: `list`, `do`, `a`, `have`, `shopping`, `you`

### Level 2: Intermediate Phrases (Questions 2, 3, 5, 6)
*   **Structure**: Indirect Questions, Complex Noun Phrases, Embedded Clauses.
*   **Grammar**: Modals, Continuous tenses, Embedded question word order.
*   **Chunks**: Mixed single words and 2-3 word phrases (6-7 chunks).
*   **Distractors**: Rare (0-1).
*   **Trap Pattern**: **Indirect question inversion** — the #1 score killer.
    *   Trigger words: `know`, `wonder`, `tell me`, `not sure`, `ask`
    *   After these → embedded clause uses **S-V order** (not V-S).
*   **Avg. Success Rate**: ~40% (most points are lost here).
*   **Example**: "Can you tell me where the library is?"
    *   Chunks: `tell me`, `can`, `where`, `you`, `the library`, `is`
    *   Trap: Placing `is` before `the library` → "where is the library" (wrong — embedded question)
*   **Example 2**: "What is the water temperature like this time of year?"
    *   Chunks: `is`, `time of year`, `what`, `the water`, `this`, `like`, `temperature`

### Level 3: Advanced Syntax (Questions 1, 9, 10)
*   **Structure**: Relative Clauses, Passive Voice, Reported Speech.
*   **Grammar**: Past Tense, Agreement rules, Complex embedding.
*   **Chunks**: Semantic units — Noun/Verb phrases (5-7 chunks).
*   **Distractors**: **Present (1 item)** — grammar traps designed to exploit "feeling."
*   **Trap Patterns**:
    *   Redundant pronoun (`it` when subject already defined)
    *   Subject-verb agreement (`was` vs `were`)
    *   Tense consistency (`learn` vs `learned`)
    *   Indirect question inversion (combined with relative clauses)
*   **Avg. Success Rate**: ~30% (hardest questions, distractor adds confusion).
*   **Example**: "I used the study guide that was provided by the professor."
    *   Chunks: `by`, `the professor`, `that`, `the study guide`, `was provided`
    *   Distractor: `it` (Plausible noun, but redundant — "the study guide" is already the subject)

### Systematic Solving Method: S-V-O-Extra

"Feeling" is not enough — test-takers need a systematic approach:

| Step | Action | Example |
| :--- | :--- | :--- |
| **S** (Subject) | Find the subject first | `the study guide` |
| **V** (Verb) | Attach the main verb | `was provided` |
| **O** (Object/Complement) | Add object or complement | `by the professor` |
| **Extra** | Remaining modifiers, connectors | `that` (relative pronoun) |

This method prevents the "it sounds right" trap and forces structural analysis.

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
