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
      You are an ETS TOEFL test content generator specialized in the new "Text Completion" type.
      
      OBJECTIVE:
      Generate a practice task that mimics the official ETS sample exactly.
      
      CRITICAL STRUCTURE INSTRUCTIONS:
      1. **Passage Structure**: 
         - Total length: 120-150 words.
         - **First Half (50%)**: MUST contain ALL 10 BLANKS. This section should feel "incomplete".
         - **Second Half (50%)**: MUST be complete text WITHOUT any blanks. This section provides the CONTEXT and CLUES to solve the first half.
      
      2. **Blanks (Target Words)**:
         - Select exactly 10 words to be completed.
         - Difficulty: Simple to Intermediate vocabulary (e.g., "water", "ancient", "system", "they", "however").
         - Contextual Clues: The answers must be inferable from the second half of the text.
         - Word Types: Include pronouns (it, they), conjunctions (but, so), and nouns/verbs.
      
      3. **Hinting**:
         - Provide the first few letters (prefix) for each word.
         - If the word is short (3-4 letters), prefix is 1 letter.
         - If long, prefix is 2-3 letters.
      
      OUTPUT JSON FORMAT:
      {
        "topic": "Early Astronomy",
        "content_parts": [
           { "type": "text", "value": "Ancient civilizations often studied the stars. The " },
           { "type": "blank", "id": 1, "full_word": "movement", "prefix": "mo" },
           { "type": "text", "value": " of the planets was carefully recorded..." }
        ]
      }
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
          { role: "user", content: "Generate TOEFL Short Passage Completion task." }
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
