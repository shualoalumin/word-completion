import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `
You are an ETS TOEFL test content generator for the "Text Completion" question type.

TASK: Generate a short academic passage (~80-100 words, 5-6 lines when displayed) with exactly 10 blanks to complete.

STRUCTURE RULES:
1. The passage should be about an academic topic (science, history, geography, nature, technology).
2. First 60% of passage contains ALL 10 blanks. Last 40% is complete text providing context clues.
3. Blanks should be common English words: nouns, verbs, adjectives, pronouns, conjunctions.
4. Each blank shows a prefix (first 1-3 letters) and the student fills in remaining letters.
5. Words should be simple to intermediate level (e.g., "show", "location", "places", "cities", "and", "these", "guides", "also", "types", "information").

PREFIX RULES:
- 3-4 letter words: show 1 letter (e.g., "and" → prefix "a")
- 5-6 letter words: show 2 letters (e.g., "cities" → prefix "ci")  
- 7+ letter words: show 2-4 letters (e.g., "location" → prefix "loca")

EXAMPLE OUTPUT FORMAT:
{
  "topic": "Maps and Geography",
  "content_parts": [
    { "type": "text", "value": "Maps are tools that help us understand the world around us. They " },
    { "type": "blank", "id": 1, "full_word": "show", "prefix": "sh" },
    { "type": "text", "value": " the " },
    { "type": "blank", "id": 2, "full_word": "location", "prefix": "loca" },
    { "type": "text", "value": " of " },
    { "type": "blank", "id": 3, "full_word": "places", "prefix": "pla" },
    { "type": "text", "value": " like " },
    { "type": "blank", "id": 4, "full_word": "cities", "prefix": "cit" },
    { "type": "text", "value": ", rivers, " },
    { "type": "blank", "id": 5, "full_word": "and", "prefix": "a" },
    { "type": "text", "value": " mountains. " },
    { "type": "blank", "id": 6, "full_word": "These", "prefix": "Th" },
    { "type": "text", "value": " visual " },
    { "type": "blank", "id": 7, "full_word": "guides", "prefix": "gu" },
    { "type": "text", "value": " can " },
    { "type": "blank", "id": 8, "full_word": "also", "prefix": "al" },
    { "type": "text", "value": " display different " },
    { "type": "blank", "id": 9, "full_word": "types", "prefix": "ty" },
    { "type": "text", "value": " of " },
    { "type": "blank", "id": 10, "full_word": "information", "prefix": "infor" },
    { "type": "text", "value": ", such as climate or population. There are many kinds, including physical, political, and thematic versions. The study of maps and cartography, the process by which they are made, can teach us about the geography of our planet and how people live in different regions." }
  ]
}

Generate a NEW passage on a DIFFERENT topic. Keep it concise (~80-100 words total).
`;

    console.log("Calling Lovable AI Gateway to generate passage...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate a TOEFL Short Passage Completion task with a new academic topic." }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    console.log("AI response received successfully");
    
    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    const passageData = JSON.parse(content);
    
    return new Response(JSON.stringify(passageData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating passage:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
