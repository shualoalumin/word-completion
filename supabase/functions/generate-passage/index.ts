import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AIClient } from "../_shared/ai/client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // If we have cached exercises, return a random one
    if (cachedExercises && cachedExercises.length > 0) {
      const randomIndex = Math.floor(Math.random() * cachedExercises.length);
      const cached = cachedExercises[randomIndex];
      console.log(`Returning cached exercise: ${cached.topic}`);
      
      return new Response(JSON.stringify(cached.content), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: No cache available, generate new with AI
    console.log("No cached exercises found, generating new one...");
    const aiClient = new AIClient();

    const systemPrompt = `
You are an ETS TOEFL iBT test content generator for the "Text Completion" question type.

TASK: Generate a short academic passage (70-90 words TOTAL, fitting in 5-6 lines) with exactly 10 blanks.

CRITICAL STRUCTURE (follow the ETS sample exactly):
1. FIRST HALF (~35-45 words): Contains ALL 10 blanks. Multiple blanks per sentence is normal and expected.
2. SECOND HALF (~35-45 words): Complete text with NO blanks. This provides context clues for solving.
3. Total passage must be SHORT: 70-90 words maximum, 5-6 lines when displayed.

BLANK RULES:
- All 10 blanks MUST appear in the first 50% of the passage
- Multiple blanks in one sentence is REQUIRED (like the ETS sample)
- Use common academic words: nouns, verbs, adjectives, prepositions, conjunctions
- Simple to intermediate vocabulary only
- NEVER use numbers (e.g., "70,000") as blanks. Blanks must be WORDS only.
- Each blank MUST include a "clue" field explaining WHY this answer is correct

CLUE TYPES (use the most relevant one for each blank):
1. Grammar: "Verb form required after 'can'" / "Plural noun needed" / "Past tense for completed action"
2. Context: "Describes the result of..." / "Indicates contrast with previous idea"
3. Collocation: "Common phrase: 'in ___'" / "Fixed expression with 'make'"
4. Reference: "Refers back to 'maps' mentioned earlier" / "Connects to the main topic"

PREFIX RULES:
- 3-4 letter words: show 1-2 letters (e.g., "and" -> "a", "show" → "sh")
- 5-6 letter words: show 2 letters (e.g., "cities" → "ci", "places" → "pla")  
- 7+ letter words: show 3-5 letters (e.g., "location" → "loca", "information" → "infor")

OUTPUT FORMAT:
Return strictly a JSON object matching this schema:
{
  "topic": "Topic Title",
  "content_parts": [
    { "type": "text", "value": "..." },
    { "type": "blank", "id": 1, "full_word": "word", "prefix": "wo", "clue": "Hint..." },
    ...
  ]
}
`;

    const userPrompt = "Generate a TOEFL Text Completion passage on a random academic topic (e.g., Biology, Astronomy, Psychology, or History). Ensure high quality and strict adherence to the 10-blank structure.";

    console.log("Requesting AI generation...");
    const passageData = await aiClient.generate(systemPrompt, userPrompt);
    console.log("AI generation successful");

    // Step 3: Save to DB for future caching
    const { error: insertError } = await supabase
      .from("exercises")
      .insert({
        section: "reading",
        exercise_type: "text-completion",
        topic: passageData.topic || "Unknown Topic",
        topic_category: "General",
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
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
