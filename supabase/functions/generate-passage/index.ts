import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AIClient } from "../_shared/ai/client.ts";
import { normalizeSpacing, needsNormalization } from "../_shared/normalize-spacing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ETS TOEFL Topic Pool (50+ topics across academic categories)
const TOEFL_TOPICS = {
  naturalSciences: [
    "Photosynthesis in plants",
    "Volcanic activity and plate tectonics",
    "Black holes and stellar evolution",
    "Chemical bonding and molecular structures",
    "The water cycle and precipitation",
    "Earthquake formation and seismic waves",
    "Nuclear fusion in stars",
    "Genetic inheritance patterns",
  ],
  lifeSciences: [
    "Migration patterns of birds",
    "Coral reef ecosystems",
    "Evolution of mammals",
    "Elephant social behavior",
    "Whale communication methods",
    "Photosynthesis in marine plants",
    "Insect colony organization",
    "Human brain functions",
    "Animal camouflage techniques",
    "Symbiotic relationships in nature",
  ],
  socialSciences: [
    "Child cognitive development",
    "Economic recession causes",
    "Ancient trade routes",
    "Cultural rituals and ceremonies",
    "Language acquisition in children",
    "Social group dynamics",
    "Archaeological excavation methods",
    "Urban planning principles",
    "Consumer behavior patterns",
    "Political system structures",
  ],
  earthEnvironment: [
    "Climate change effects",
    "Map making and cartography",
    "Ocean current patterns",
    "Weather prediction methods",
    "Deforestation impacts",
    "Renewable energy sources",
    "Glacier formation processes",
    "Air pollution sources",
    "Soil composition and fertility",
    "Water conservation methods",
  ],
  history: [
    "Ancient Egyptian pyramids",
    "Roman Empire governance",
    "Medieval castle construction",
    "Industrial Revolution impacts",
    "Ancient Greek democracy",
    "Silk Road trade networks",
    "Renaissance art movement",
    "Colonial expansion effects",
    "Prehistoric cave paintings",
    "Agricultural revolution",
  ],
  artsHumanities: [
    "Classical music composition",
    "Impressionist painting techniques",
    "Theater history and development",
    "Architecture design principles",
    "Literary genres and styles",
    "Film production methods",
    "Photography evolution",
    "Sculpture materials and methods",
    "Poetry forms and structures",
    "Dance as cultural expression",
  ],
};

// Difficulty distribution for cache diversity
// Module 1: Easy 50%, Medium 50%, Hard 0%
// Module 2: Easy 20%, Medium 40%, Hard 40%
// For cache building, we use a balanced distribution
type Difficulty = "easy" | "intermediate" | "hard";
type Module = "module1" | "module2";

function getRandomDifficulty(module?: Module): Difficulty {
  const rand = Math.random();
  
  if (module === "module1") {
    // Module 1: Easy 50%, Medium 50%
    return rand < 0.5 ? "easy" : "intermediate";
  } else if (module === "module2") {
    // Module 2: Easy 20%, Medium 40%, Hard 40%
    if (rand < 0.2) return "easy";
    if (rand < 0.6) return "intermediate";
    return "hard";
  }
  
  // Default (cache building): balanced distribution
  // Easy 25%, Intermediate 50%, Hard 25%
  if (rand < 0.25) return "easy";
  if (rand < 0.75) return "intermediate";
  return "hard";
}

// Get random topic from the pool
function getRandomTopic(): { topic: string; category: string } {
  const categories = Object.keys(TOEFL_TOPICS) as (keyof typeof TOEFL_TOPICS)[];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const topics = TOEFL_TOPICS[randomCategory];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  
  const categoryNames: Record<string, string> = {
    naturalSciences: "Natural Sciences",
    lifeSciences: "Life Sciences",
    socialSciences: "Social Sciences",
    earthEnvironment: "Earth & Environment",
    history: "History",
    artsHumanities: "Arts & Humanities",
  };
  
  return {
    topic: randomTopic,
    category: categoryNames[randomCategory],
  };
}

// Difficulty-specific vocabulary guidelines for AI prompt
function getDifficultyGuidelines(difficulty: Difficulty): string {
  switch (difficulty) {
    case "easy":
      return `
VOCABULARY FOR EASY DIFFICULTY:
- Use 6-7 EASY words: in, to, and, is, are, the, that, this, these, each, how, with, from, for, only
- Use 3-4 MEDIUM words: common academic verbs and nouns
- Use 0 HARD words (no specialized terminology)
- Focus on basic grammar patterns and common collocations`;
    
    case "intermediate":
      return `
VOCABULARY FOR INTERMEDIATE DIFFICULTY:
- Use 2-3 EASY words: in, to, and, is, that, with
- Use 5-6 MEDIUM words: examining, evolved, organisms, influenced, regions, activities
- Use 1-2 HARDER words appropriate to the academic topic
- Balance between grammar and context clues`;
    
    case "hard":
      return `
VOCABULARY FOR HARD DIFFICULTY:
- Use 1-2 EASY words only: essential connectors (and, in)
- Use 4-5 MEDIUM words: standard academic vocabulary
- Use 3-4 HARD words: latitude, proximity, substantial, cognitive, deforestation, hypothesis, metabolism
- Emphasize context and reference clues over simple grammar`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header if present (optional - allows both authenticated and anonymous users)
    const authHeader = req.headers.get('Authorization');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role for DB operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Optional: Log user info if authenticated (for analytics)
    if (authHeader) {
      try {
        const userSupabase = createClient(
          supabaseUrl,
          authHeader.replace('Bearer ', ''),
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );
        const { data: { user } } = await userSupabase.auth.getUser();
        if (user) {
          console.log(`Request from authenticated user: ${user.email || user.id}`);
        }
      } catch (authError) {
        // Ignore auth errors - function works for both authenticated and anonymous users
        console.log('Anonymous or invalid auth token - proceeding anyway');
      }
    }

    // Step 1: Try to get a cached exercise from DB
    console.log("Checking for cached exercises...");
    const { data: cachedExercises, error: fetchError } = await supabase
      .from("exercises")
      .select("*")
      .eq("section", "reading")
      .eq("exercise_type", "text-completion")
      .eq("is_active", true)
      .limit(50);

    if (fetchError) {
      console.error("Error fetching cached exercises:", fetchError);
    }

    // Cache strategy:
    // - If less than 20 cached: 80% chance to generate new (build up cache)
    // - If 20+ cached: 90% chance to use cache, 10% to generate new (keep fresh)
    const MIN_CACHE_SIZE = 20;
    const cacheCount = cachedExercises?.length || 0;
    
    const shouldUseCache = cacheCount >= MIN_CACHE_SIZE 
      ? Math.random() < 0.9  // 90% use cache when enough cached
      : Math.random() < 0.2; // 20% use cache when building up
    
    if (cachedExercises && cacheCount > 0 && shouldUseCache) {
      const randomIndex = Math.floor(Math.random() * cacheCount);
      const cached = cachedExercises[randomIndex];
      console.log(`Returning cached exercise (${cacheCount} in pool): ${cached.topic}`);
      
      let content = cached.content;
      
      // Self-Healing: Check if normalization is needed
      if (needsNormalization(content)) {
        console.log(`Detected spacing issues in cached exercise ${cached.id}. Fixing...`);
        content = normalizeSpacing(content);
        
        // Asynchronously update the DB with fixed content (Fire and forget)
        // We don't await this to avoid delaying the response
        supabase
          .from("exercises")
          .update({ content: content })
          .eq("id", cached.id)
          .then(({ error }) => {
            if (error) console.error(`Failed to auto-heal exercise ${cached.id}:`, error);
            else console.log(`Auto-healed exercise ${cached.id} in DB`);
          });
      }

      // Include metadata in response (difficulty, topic_category, exercise_id)
      const responseData = {
        ...content,
        difficulty: cached.difficulty || 'intermediate',
        topic_category: cached.topic_category || 'General',
        exercise_id: cached.id,
      };

      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log(`Cache has ${cacheCount} exercises. Generating new one...`);

    // Step 2: No cache available, generate new with AI
    console.log("No cached exercises found, generating new one...");
    const aiClient = new AIClient();
    
    // Select random topic from our curated pool
    const { topic: selectedTopic, category: topicCategory } = getRandomTopic();
    
    // Determine difficulty (can be passed as parameter or random for cache building)
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const requestedModule = body.module as Module | undefined;
    const selectedDifficulty = getRandomDifficulty(requestedModule);
    
    console.log(`Selected topic: ${selectedTopic} (${topicCategory}), Difficulty: ${selectedDifficulty}`);

    const systemPrompt = `
You are an ETS TOEFL iBT test content generator for the "Text Completion" question type.
Based on analysis of official ETS samples, follow this EXACT algorithm:

═══════════════════════════════════════════════════════════════
PASSAGE STRUCTURE (70-100 words total)
═══════════════════════════════════════════════════════════════
1. INTRODUCTION (1 sentence, ~15%): Define/introduce the topic. NO blanks here.
2. BODY (2-3 sentences, ~45%): ALL 10 blanks concentrated here. 2-4 blanks per sentence.
3. CONCLUSION (2-3 sentences, ~40%): Expand on topic with complete text. NO blanks. Provides context clues.

═══════════════════════════════════════════════════════════════
CRITICAL FORMATTING RULE (SPACING)
═══════════════════════════════════════════════════════════════
- When a "text" part is followed by a "blank" part, the text value MUST end with a space.
  Example: {"type": "text", "value": "Natural systems "} (CORRECT - note the trailing space)
  Example: {"type": "text", "value": "Natural systems"} (WRONG - missing space)
- When a "blank" part is followed by a "text" part, the text value MUST start with a space (unless punctuation).
  Example: {"type": "text", "value": " are vital."} (CORRECT - note the leading space)
  Example: {"type": "text", "value": "are vital."} (WRONG - missing space)

═══════════════════════════════════════════════════════════════
PART OF SPEECH DISTRIBUTION (10 blanks)
═══════════════════════════════════════════════════════════════
- Nouns: 4 blanks (40%) - field, regions, organisms, activities
- Verbs: 2-3 blanks (25%) - examining, evolved, influenced (any tense)
- Prepositions: 1-2 blanks (12%) - in, to, from, with
- Conjunctions/Determiners: 1-2 blanks (13%) - and, that, these, each
- Adjectives/Adverbs: 1 blank (10%) - cognitive, substantial, only

═══════════════════════════════════════════════════════════════
PREFIX LENGTH ALGORITHM
═══════════════════════════════════════════════════════════════
- 2-3 letters → 1 char prefix: is→"i", to→"t", and→"a"
- 4-5 letters → 2 char prefix: that→"th", with→"wi", such→"su"
- 6-7 letters → 3 char prefix: field→"fie", regions→"reg"
- 8-9 letters → 4 char prefix: examining→"exam", latitude→"lati"
- 10+ letters → 5 char prefix: information→"infor", deforestation→"defor"

═══════════════════════════════════════════════════════════════
VOCABULARY GUIDELINES (DIFFICULTY-SPECIFIC)
═══════════════════════════════════════════════════════════════
${getDifficultyGuidelines(selectedDifficulty)}
NEVER use numbers as blanks. Words only.

═══════════════════════════════════════════════════════════════
CLUE TYPES (assign one to each blank)
═══════════════════════════════════════════════════════════════
1. Grammar (35%): "Plural noun needed" / "Past tense verb" / "Infinitive after 'to'"
2. Context (30%): "Describes the characteristic of..." / "Result of the process"
3. Collocation (20%): "Common phrase: 'in ___'" / "Academic expression"
4. Reference (15%): "Refers back to [noun] mentioned earlier"

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT (strict JSON)
═══════════════════════════════════════════════════════════════
{
  "topic": "Topic Title",
  "content_parts": [
    { "type": "text", "value": "Introduction sentence without blanks. " },
    { "type": "text", "value": "Body starts here with " },
    { "type": "blank", "id": 1, "full_word": "word", "prefix": "wo", "clue": "Grammar: noun needed" },
    { "type": "text", "value": " and more " },
    { "type": "blank", "id": 2, "full_word": "text", "prefix": "te", "clue": "Context: describes..." },
    ... (continue until 10 blanks, all in body section)
    { "type": "text", "value": "Conclusion sentences with no blanks providing context." }
  ]
}
`;

    const userPrompt = `Generate a TOEFL Text Completion passage about: "${selectedTopic}"

Category: ${topicCategory}
Difficulty: ${selectedDifficulty.toUpperCase()}

Requirements:
- Follow the ETS algorithm EXACTLY
- Introduction sentence introduces "${selectedTopic}" without blanks
- Body section contains ALL 10 blanks (2-4 per sentence)
- Conclusion provides context clues with no blanks
- STRICTLY follow the ${selectedDifficulty.toUpperCase()} difficulty vocabulary guidelines
- Each blank needs a specific clue (Grammar/Context/Collocation/Reference)`;

    console.log("Requesting AI generation...");
    const rawPassageData = await aiClient.generate(systemPrompt, userPrompt);
    
    // Normalize spacing before saving to DB
    const passageData = normalizeSpacing(rawPassageData);
    
    console.log("AI generation successful");

    // Step 3: Save to DB for future caching and get the inserted ID in one query
    let exerciseId: string | null = null;
    
    const { data: insertedExercise, error: insertError } = await supabase
      .from("exercises")
      .insert({
        section: "reading",
        exercise_type: "text-completion",
        topic: passageData.topic || selectedTopic,
        topic_category: topicCategory,
        difficulty: selectedDifficulty,
        content: passageData,
        is_active: true,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error saving exercise to cache:", insertError);
      // Continue anyway, just log the error - exerciseId will be null
    } else if (insertedExercise) {
      console.log(`Exercise saved to cache successfully with ID: ${insertedExercise.id}`);
      exerciseId = insertedExercise.id;
    }

    // Include metadata in response (difficulty, topic_category, exercise_id)
    const responseData = {
      ...passageData,
      difficulty: selectedDifficulty,
      topic_category: topicCategory,
      exercise_id: exerciseId,
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating passage:", error);
    
    // Fallback: Try to return a cached exercise even if AI failed
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: fallbackExercises } = await supabase
        .from("exercises")
        .select("*")
        .eq("section", "reading")
        .eq("exercise_type", "text-completion")
        .eq("is_active", true)
        .limit(50);
      
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
