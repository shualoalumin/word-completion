import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AIClient } from "../_shared/ai/client.ts";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for DB access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      
      return new Response(JSON.stringify(cached.content), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log(`Cache has ${cacheCount} exercises. Generating new one...`);

    // Step 2: No cache available, generate new with AI
    console.log("No cached exercises found, generating new one...");
    const aiClient = new AIClient();
    
    // Select random topic from our curated pool
    const { topic: selectedTopic, category: topicCategory } = getRandomTopic();
    console.log(`Selected topic: ${selectedTopic} (${topicCategory})`);

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
VOCABULARY GUIDELINES
═══════════════════════════════════════════════════════════════
Include 2-3 EASY words (in, to, and, is, that, these, with, from)
Include 5-6 MEDIUM words (examining, evolved, organisms, important)
Include 1-2 HARDER words appropriate to the academic topic
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

Requirements:
- Follow the ETS algorithm EXACTLY
- Introduction sentence introduces "${selectedTopic}" without blanks
- Body section contains ALL 10 blanks (2-4 per sentence)
- Conclusion provides context clues with no blanks
- Mix easy words (in, to, and) with topic-specific vocabulary
- Each blank needs a specific clue (Grammar/Context/Collocation/Reference)`;

    console.log("Requesting AI generation...");
    const passageData = await aiClient.generate(systemPrompt, userPrompt);
    console.log("AI generation successful");

    // Step 3: Save to DB for future caching
    const { error: insertError } = await supabase
      .from("exercises")
      .insert({
        section: "reading",
        exercise_type: "text-completion",
        topic: passageData.topic || selectedTopic,
        topic_category: topicCategory,
        difficulty: "intermediate",
        content: passageData,
        is_active: true,
      });

    if (insertError) {
      console.error("Error saving exercise to cache:", insertError);
      // Continue anyway, just log the error
    } else {
      console.log("Exercise saved to cache successfully");
    }

    return new Response(JSON.stringify(passageData), {
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
