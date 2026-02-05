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
LEVEL 1: BASIC STRUCTURES (Success Rate: ~70%)
═══════════════════════════════════════════════════════════════
SENTENCE TYPES:
- Simple Wh-Questions: "What time does it start?"
- Yes/No Questions: "Do you have a shopping list?"

CHUNKING RULES:
- 5-6 chunks, mostly SINGLE WORDS
- Split by spaces (minimal phrase grouping)
- Example: "Do you have a shopping list?"
  → ["list", "do", "a", "have", "shopping", "you"]

GRAMMAR FOCUS:
- Present/Future Simple tense
- Basic word order: Do/Does + Subject + Verb
- NO distractors, NO anchors

TRAP PATTERN:
- Basic auxiliary placement (Do/Does before subject)`;

    case "medium":
      return `
═══════════════════════════════════════════════════════════════
LEVEL 2: INTERMEDIATE PHRASES (Success Rate: ~40%)
═══════════════════════════════════════════════════════════════
SENTENCE TYPES:
- Indirect Questions: "Can you tell me where the library is?"
- Complex Noun Phrases: "What is the water temperature like?"
- Embedded Clauses with modal verbs

CHUNKING RULES (SEMANTIC CHUNKING):
- 6-7 chunks, mix of singles and 2-3 word PHRASES
- Keep Noun Phrases together: "the library", "the water temperature"
- Keep Verb Phrases together: "tell me", "is like"
- Function words separate: "where", "what", "if"

🚨 THE #1 TRAP: INDIRECT QUESTION WORD ORDER 🚨
This is the single biggest point-loss pattern in TOEFL Writing!

| Trigger Words | After these → use S-V order (NOT question inversion) |
| know, wonder, tell me, not sure, ask, curious |

WRONG: "Can you tell me where IS the library?"  (question inversion)
RIGHT: "Can you tell me where the library IS?"  (statement order S-V)

EXAMPLE with trap setup:
- Sentence: "Can you tell me where the library is?"
- Chunks: ["tell me", "can", "where", "you", "the library", "is"]
- The trap: Student might place "is" BEFORE "the library"

DISTRACTORS: Rare (0-1), mainly for confusing word order`;

    case "hard":
      return `
═══════════════════════════════════════════════════════════════
LEVEL 3: ADVANCED SYNTAX (Success Rate: ~30%)
═══════════════════════════════════════════════════════════════
SENTENCE TYPES:
- Relative Clauses: "I used the study guide THAT was provided by the professor."
- Passive Voice: "The tour guides WHO showed us around WERE fantastic."
- Reported Speech: "She asked whether the deadline had been extended."

CHUNKING RULES (SEMANTIC UNITS):
- 5-7 chunks as meaningful syntactic units
- Noun Phrases: "the study guide", "the tour guides", "the professor"
- Verb Phrases: "was provided", "showed us around", "had been extended"
- Function words: "that", "who", "whether", "by"

ANCHOR TEXT (15-30% of sentence):
- Start Anchor: "I used ____" (fixes subject)
- End Anchor: "____ fantastic." (fixes adjective)
- Split Anchor: "The ____ ____ ____ fantastic."

🚨 DISTRACTOR INJECTION (EXACTLY 1 REQUIRED) 🚨
Choose ONE trap type:

1. SUBJECT-VERB AGREEMENT: "was" vs "were"
   - "The tour guides who showed us around WAS/WERE fantastic."
   - Add "was" as distractor when plural subject requires "were"

2. REDUNDANT PRONOUN: "it"
   - "I used the study guide that IT was provided..." → WRONG
   - Add "it" when subject is already defined

3. FALSE CONJUNCTION: "if" vs "whether"
   - Both seem correct in indirect questions
   - Add wrong one as distractor

4. TENSE TRAP: "learn" vs "learned"
   - Add wrong tense form

EXAMPLE with distractor:
- Sentence: "I used the study guide that was provided by the professor."
- Anchor: "I used"
- Chunks: ["by", "the professor", "that", "the study guide", "was provided"]
- Distractor: { "id": "c6", "text": "it", "is_distractor": true }
- Correct order: ["c4", "c3", "c5", "c1", "c2"]

ALSO include indirect question trap if applicable in combination with relative clause.`;
  }
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
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
    const cacheCount = cachedExercises?.length || 0;
    
    // Cache strategy: Build up cache until 50, then mostly use cache
    const shouldUseCache = cacheCount >= MIN_CACHE_SIZE 
      ? Math.random() < 0.9
      : Math.random() < 0.2;
    
    if (cachedExercises && cacheCount > 0 && shouldUseCache) {
      const randomIndex = Math.floor(Math.random() * cacheCount);
      const cached = cachedExercises[randomIndex];
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
This is a Writing section question where students must arrange word chunks to form a grammatically correct response.

═══════════════════════════════════════════════════════════════
QUESTION STRUCTURE
═══════════════════════════════════════════════════════════════
1. A dialogue between Speaker A and Speaker B
2. Speaker A says a trigger sentence (context)
3. Speaker B's response is the sentence students must BUILD
4. The response is broken into CHUNKS that students arrange

═══════════════════════════════════════════════════════════════
DIFFICULTY GUIDELINES
═══════════════════════════════════════════════════════════════
${getDifficultyGuidelines(selectedDifficulty)}

═══════════════════════════════════════════════════════════════
CHUNK DESIGN RULES
═══════════════════════════════════════════════════════════════
- Each chunk should be 1-3 words
- Chunks must be unambiguous when combined correctly
- For HARD mode, add 1-2 DISTRACTOR chunks (marked is_distractor: true)
- Distractors should be grammatically similar but incorrect (e.g., "was" vs "were")

═══════════════════════════════════════════════════════════════
ANCHOR TEXT (HARD MODE ONLY)
═══════════════════════════════════════════════════════════════
- anchor_start: Fixed text at the beginning (e.g., "I wonder", "The")
- anchor_end: Fixed text at the end (e.g., "inspiring.", "fantastic.")
- These are NOT in the puzzle; they frame the response

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT (strict JSON)
═══════════════════════════════════════════════════════════════
{
  "id": "bs-generated-[timestamp]",
  "scenario": "${selectedScenario}",
  "difficulty": "${selectedDifficulty}",
  "dialogue": {
    "speaker_a": {
      "text": "Trigger sentence from Speaker A",
      "avatar": "student_male" or "student_female"
    },
    "speaker_b": {
      "full_response": "Complete correct sentence",
      "anchor_start": null or "fixed start text",
      "anchor_end": null or "fixed end text."
    }
  },
  "puzzle": {
    "slots_count": number (how many chunks to place, excluding distractors),
    "chunks": [
      { "id": "c1", "text": "chunk text", "is_distractor": false },
      { "id": "c2", "text": "another chunk", "is_distractor": false },
      // ... more chunks, shuffled order
    ],
    "correct_order": ["c1", "c2", ...] (IDs in correct order)
  },
  "grammar_tip": "Brief explanation of the grammar pattern tested. Example: 'This is an indirect question. After \"tell me\", use statement word order (S-V), not question inversion.'",
  "trap_type": "indirect_question" | "subject_verb_agreement" | "redundant_pronoun" | "tense" | "word_order" | null
}

IMPORTANT: grammar_tip should be 1-2 sentences explaining WHY the correct order is correct.
trap_type indicates the main grammatical trap in this question:
- "indirect_question": Tests embedded question word order (S-V vs V-S)
- "subject_verb_agreement": Tests was/were, is/are matching
- "redundant_pronoun": Tests unnecessary "it" insertion
- "tense": Tests verb tense consistency
- "word_order": Tests basic word order rules
- null: No specific trap (easy questions)
`;

    const userPrompt = `Generate a TOEFL Build a Sentence question for the scenario: "${selectedScenario}"

Category: ${scenarioCategory}
Difficulty: ${selectedDifficulty.toUpperCase()}

Requirements:
- Create a natural, realistic dialogue that could occur in this scenario
- Speaker A provides context, Speaker B responds with a sentence students must build
- The response should test grammar patterns appropriate for ${selectedDifficulty} level
- Shuffle the chunks array so they're NOT in correct order
- Ensure the sentence sounds natural when correctly assembled
${selectedDifficulty === 'hard' ? '- Include 1-2 distractor chunks and use anchor text' : '- Do NOT include distractors or anchors'}

Return ONLY valid JSON, no markdown or explanation.`;

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
