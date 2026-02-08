import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AIClient } from "../_shared/ai/client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ETS TOEFL 2026 Scenario Pool for Build a Sentence
const TOEFL_SCENARIOS = {
  dailyLife: [
    "Weekend Plans",
    "Grocery Shopping",
    "Restaurant Reservation",
    "Weather Discussion",
    "Transportation",
    "Fitness and Health",
    "Home Improvement",
    "Pet Care",
    "Shopping for Clothes",
    "Cooking at Home",
  ],
  academic: [
    "Library Research",
    "Office Hours",
    "Group Project",
    "Lecture Notes",
    "Exam Preparation",
    "Course Registration",
    "Research Proposal",
    "Thesis Discussion",
    "Lab Equipment",
    "Academic Conference",
  ],
  campus: [
    "Dormitory Rules",
    "Cafeteria Hours",
    "Gym Membership",
    "Student Club",
    "Campus Event",
    "Career Fair",
    "Tutoring Services",
    "Financial Aid",
    "Study Abroad",
    "Graduation Ceremony",
  ],
  professional: [
    "Job Interview",
    "Team Meeting",
    "Project Deadline",
    "Budget Approval",
    "Client Presentation",
    "Office Supplies",
    "Remote Work",
    "Training Session",
    "Performance Review",
    "Business Travel",
  ],
};

type Difficulty = "easy" | "medium" | "hard";

function getRandomDifficulty(): Difficulty {
  const rand = Math.random();
  // Easy 30%, Medium 40%, Hard 30%
  if (rand < 0.3) return "easy";
  if (rand < 0.7) return "medium";
  return "hard";
}

function getRandomScenario(): { scenario: string; category: string } {
  const categories = Object.keys(TOEFL_SCENARIOS) as (keyof typeof TOEFL_SCENARIOS)[];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const scenarios = TOEFL_SCENARIOS[randomCategory];
  const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  const categoryNames: Record<string, string> = {
    dailyLife: "Daily Life",
    academic: "Academic",
    campus: "Campus Life",
    professional: "Professional",
  };
  
  return {
    scenario: randomScenario,
    category: categoryNames[randomCategory],
  };
}

function getDifficultyGuidelines(difficulty: Difficulty): string {
  switch (difficulty) {
    case "easy":
      return `
═══════════════════════════════════════════════════════════════
LEVEL 1: BASIC STRUCTURES (ETS Q4, Q7, Q8 style)
═══════════════════════════════════════════════════════════════
SENTENCE TYPE: B's response is a SHORT QUESTION (ends with ?)
- Simple Wh-Questions: "What time does it start?"
- Yes/No Questions: "Do you have a shopping list?"
- "What will you learn?" / "What recipes will you learn?"

ANCHOR RULES:
- anchor_start: null (NO text anchor)
- anchor_end: "?" (question mark ALWAYS fixed)
- The "?" is displayed as anchor, NOT in word bank

CHUNKING RULES:
- 5-6 chunks, mostly SINGLE WORDS
- Example: "What time does it start?"
  → chunks: ["does", "what", "time", "it", "start"] (5 chunks)
  → anchor_end: "?"
- Example: "Do you have a shopping list?"
  → chunks: ["list", "do", "a", "have", "shopping", "you"] (6 chunks)
  → anchor_end: "?"

VOCABULARY: Simple everyday words. The test is about WORD ORDER, not vocabulary.
DISTRACTORS: NONE
GRAMMAR: Present/Future Simple, Do/Does + Subject + Verb`;

    case "medium":
      return `
═══════════════════════════════════════════════════════════════
LEVEL 2: INTERMEDIATE PHRASES (ETS Q2, Q3, Q5, Q6 style)
═══════════════════════════════════════════════════════════════
SENTENCE TYPE: Mix of questions and statements.
~70% questions (end with ?), ~30% statements (end with .)

ANCHOR RULES (choose ONE pattern):
Pattern A - End anchor only (50% of the time):
  - anchor_start: null
  - anchor_end: "?" or "."
  - Example: "Do you know how much tickets will cost?"
    → anchor_end: "?", chunks: ["do","you","how","know","tickets","will cost","much"]

Pattern B - Start + End anchor (50% of the time):
  - anchor_start: short phrase like "she will be", "tell me"
  - anchor_end: "?" or "."
  - Example: "she will be ___ ___ ___ ___ ___ ?"
    → anchor_start: "she will be", anchor_end: "?"
    → chunks: ["a different department","if","moving to","know","do","you"]

CHUNKING RULES (SEMANTIC CHUNKING):
- 6-7 chunks, mix of single words and 2-3 word PHRASES
- Keep Noun Phrases together: "the cabins", "the water", "time of year"
- Keep Verb Phrases together: "will be", "will cost", "moving to"
- Function words separate: "whether", "what", "if", "how"

🚨 THE #1 TRAP: INDIRECT QUESTION WORD ORDER 🚨
Trigger words: know, wonder, tell me, not sure, ask, curious
After these → use S-V order (NOT question inversion)
WRONG: "Can you tell me where IS the library?"
RIGHT: "Can you tell me where the library IS?"

DISTRACTORS: NONE (0)
VOCABULARY: Simple, conversational. Focus on WORD ORDER difficulty, NOT vocabulary difficulty.`;

    case "hard":
      return `
═══════════════════════════════════════════════════════════════
LEVEL 3: ADVANCED SYNTAX (ETS Q1, Q9, Q10 style)
═══════════════════════════════════════════════════════════════
SENTENCE TYPE: B's response is a STATEMENT (ends with .)
- Relative Clauses: "I used the study guide that was provided by the professor."
- Passive Voice: "The tour guides who showed us around were fantastic."
- Reported Speech: "She wanted to know where she could buy a copy."

ANCHOR RULES (REQUIRED):
- anchor_start: ALWAYS a short phrase (1-2 words): "The", "She", "I used", "I heard"
- anchor_end: ALWAYS "." (period fixed at end)
- Example: "The ___ ___ ___ ___ ___ ___ fantastic."
  → anchor_start: "The", anchor_end: "fantastic."
- Example: "I used ___ ___ ___ ___ ___ ."
  → anchor_start: "I used", anchor_end: "."
- Example: "She ___ ___ ___ ___ ___ ___ ___ ."
  → anchor_start: "She", anchor_end: "."

CHUNKING RULES (SEMANTIC UNITS):
- 5-7 chunks as meaningful syntactic units (excluding distractor)
- Noun Phrases: "the study guide", "the tour guides", "the professor"
- Verb Phrases: "was provided", "showed us around"
- Function words: "that", "who", "whether", "by"

🚨 DISTRACTOR INJECTION (EXACTLY 1 REQUIRED) 🚨
Choose ONE:
1. REDUNDANT PRONOUN: "it" or "she" (when subject already defined by anchor)
   Example: anchor "She", distractor "she" (lowercase, redundant)
2. SUBJECT-VERB AGREEMENT: "was" vs "were"
3. TENSE TRAP: "learn" vs "learned"

VOCABULARY: Simple, conversational. Focus on SYNTAX complexity, NOT vocabulary difficulty.`;
  }
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');

    // Parse request body for excludeIds
    let excludeIds: string[] = [];
    try {
      const body = await req.json();
      excludeIds = Array.isArray(body?.excludeIds) ? body.excludeIds : [];
    } catch {
      // Empty body or invalid JSON - proceed without exclusion
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Optional user logging
    if (authHeader) {
      try {
        const userSupabase = createClient(
          supabaseUrl,
          authHeader.replace('Bearer ', ''),
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        const { data: { user } } = await userSupabase.auth.getUser();
        if (user) {
          console.log(`Request from authenticated user: ${user.email || user.id}`);
        }
      } catch {
        console.log('Anonymous or invalid auth token - proceeding anyway');
      }
    }

    if (excludeIds.length > 0) {
      console.log(`Excluding ${excludeIds.length} recently used exercise IDs`);
    }

    // Step 1: Try to get cached exercises from DB
    console.log("Checking for cached build-sentence exercises...");
    const { data: cachedExercises, error: fetchError } = await supabase
      .from("exercises")
      .select("*")
      .eq("section", "writing")
      .eq("exercise_type", "build-sentence")
      .eq("is_active", true)
      .limit(100);

    if (fetchError) {
      console.error("Error fetching cached exercises:", fetchError);
    }

    const MIN_CACHE_SIZE = 50;
    // Filter out recently used exercises
    const availableExercises = cachedExercises
      ? cachedExercises.filter(e => !excludeIds.includes(e.id))
      : [];
    const cacheCount = availableExercises.length;
    const totalCacheCount = cachedExercises?.length || 0;

    // Cache strategy: Build up cache until 50, then mostly use cache
    const shouldUseCache = totalCacheCount >= MIN_CACHE_SIZE
      ? Math.random() < 0.9
      : Math.random() < 0.2;

    if (cacheCount > 0 && shouldUseCache) {
      const randomIndex = Math.floor(Math.random() * cacheCount);
      const cached = availableExercises[randomIndex];
      console.log(`Returning cached build-sentence exercise (${cacheCount} in pool): ${cached.topic}`);
      
      const responseData = {
        ...cached.content,
        difficulty: cached.difficulty || 'medium',
        topic_category: cached.topic_category || 'General',
        exercise_id: cached.id,
      };

      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log(`Cache has ${cacheCount} exercises. Generating new one...`);

    // Step 2: Generate new with AI
    const aiClient = new AIClient();
    
    const { scenario: selectedScenario, category: scenarioCategory } = getRandomScenario();
    const selectedDifficulty = getRandomDifficulty();
    
    console.log(`Selected scenario: ${selectedScenario} (${scenarioCategory}), Difficulty: ${selectedDifficulty}`);

    const systemPrompt = `
You are an ETS TOEFL iBT 2026 test content generator for the "Build a Sentence" question type.

═══════════════════════════════════════════════════════════════
TASK OVERVIEW (Based on 10 Official ETS 2026 Samples)
═══════════════════════════════════════════════════════════════
- Writing section: 10 questions, 5:30 time limit
- Speaker A says a SHORT trigger sentence (8-15 words, simple vocabulary)
- Speaker B's response must be BUILT from word chunks
- The test is about WORD ORDER and SYNTAX, NOT vocabulary difficulty
- Use simple, everyday words. Keep sentences conversational.
- Binary scoring: all chunks must be in correct position (no partial credit)

═══════════════════════════════════════════════════════════════
CRITICAL RULES (MUST FOLLOW)
═══════════════════════════════════════════════════════════════
1. PUNCTUATION: The ending punctuation ("?" or ".") is ALWAYS anchor_end.
   - NEVER put "?" or "." as a chunk in the word bank.
   - Questions end with anchor_end: "?"
   - Statements end with anchor_end: "." (or "fantastic." / "inspiring." etc.)

2. EVERY chunk MUST have non-empty text (at least 1 word). No empty strings.

3. SHUFFLE: The chunks array must be in RANDOM order, NOT in answer order.
   Randomize the array before returning.

4. Speaker A: SHORT sentence (8-15 words). Simple vocabulary. Sets context.
   Examples: "I'm looking forward to the concert this weekend."
             "What was the highlight of your trip?"

5. Speaker B full_response: The complete correct sentence INCLUDING anchors.
   If anchor_start is "She" and anchor_end is ".", and chunks form "wanted to know where she could buy a copy",
   then full_response is "She wanted to know where she could buy a copy."

═══════════════════════════════════════════════════════════════
DIFFICULTY GUIDELINES
═══════════════════════════════════════════════════════════════
${getDifficultyGuidelines(selectedDifficulty)}

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT (strict JSON, no markdown)
═══════════════════════════════════════════════════════════════
{
  "id": "bs-generated-${Date.now()}",
  "scenario": "${selectedScenario}",
  "difficulty": "${selectedDifficulty}",
  "dialogue": {
    "speaker_a": {
      "text": "Short trigger sentence from Speaker A",
      "avatar": "student_male" or "student_female"
    },
    "speaker_b": {
      "full_response": "Complete correct sentence including anchors and punctuation",
      "anchor_start": null or "fixed start text",
      "anchor_end": "?" or "." or "word."
    }
  },
  "puzzle": {
    "slots_count": number (chunks to place, EXCLUDING distractors),
    "chunks": [
      { "id": "c1", "text": "chunk text", "is_distractor": false },
      ...
    ],
    "correct_order": ["c3", "c1", "c5", ...] (IDs in CORRECT order, NOT same as chunks array order)
  },
  "grammar_tip": "1-2 sentences explaining the grammar pattern tested",
  "trap_type": "indirect_question" | "subject_verb_agreement" | "redundant_pronoun" | "tense" | "word_order" | null
}
`;

    const anchorInstruction = selectedDifficulty === 'easy'
      ? '- anchor_start: null, anchor_end: "?" (question mark always)'
      : selectedDifficulty === 'medium'
      ? '- anchor_end: "?" or "." (ALWAYS). anchor_start: use a short phrase ~50% of the time, null otherwise.'
      : '- anchor_start: REQUIRED (1-2 word phrase). anchor_end: "." or "word." (ALWAYS). Include exactly 1 distractor chunk.';

    const userPrompt = `Generate a TOEFL Build a Sentence question.

Scenario: "${selectedScenario}" (${scenarioCategory})
Difficulty: ${selectedDifficulty.toUpperCase()}

REQUIREMENTS:
- Speaker A: short, simple sentence (8-15 words)
- Speaker B: response that tests ${selectedDifficulty}-level grammar/syntax
- ${anchorInstruction}
- PUNCTUATION ("?" or ".") must be in anchor_end, NEVER as a chunk
- Every chunk must have non-empty text (no blank cards)
- SHUFFLE the chunks array (must NOT be in answer order)
- Use SIMPLE vocabulary — the challenge is word ORDER, not hard words
- ${selectedDifficulty === 'hard' ? 'Include exactly 1 distractor chunk (is_distractor: true)' : 'Do NOT include any distractor chunks'}

Return ONLY valid JSON.`;

    console.log("Requesting AI generation for build-sentence...");
    const questionData = await aiClient.generate(systemPrompt, userPrompt);
    
    console.log("AI generation successful");

    // Step 3: Save to DB for caching
    let exerciseId: string | null = null;
    
    const { data: insertedExercise, error: insertError } = await supabase
      .from("exercises")
      .insert({
        section: "writing",
        exercise_type: "build-sentence",
        topic: `${scenarioCategory} - ${selectedScenario}`,
        topic_category: scenarioCategory,
        difficulty: selectedDifficulty,
        content: questionData,
        is_active: true,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error saving exercise to cache:", insertError);
    } else if (insertedExercise) {
      console.log(`Exercise saved to cache with ID: ${insertedExercise.id}`);
      exerciseId = insertedExercise.id;
    }

    const responseData = {
      ...questionData,
      difficulty: selectedDifficulty,
      topic_category: scenarioCategory,
      exercise_id: exerciseId,
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating build-sentence:", error);
    
    // Fallback to cached exercise
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: fallbackExercises } = await supabase
        .from("exercises")
        .select("*")
        .eq("section", "writing")
        .eq("exercise_type", "build-sentence")
        .eq("is_active", true)
        .limit(100);
      
      if (fallbackExercises && fallbackExercises.length > 0) {
        const randomIndex = Math.floor(Math.random() * fallbackExercises.length);
        const cached = fallbackExercises[randomIndex];
        console.log(`Returning fallback cached exercise after AI error: ${cached.topic}`);
        
        return new Response(JSON.stringify(cached.content), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
    }
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
