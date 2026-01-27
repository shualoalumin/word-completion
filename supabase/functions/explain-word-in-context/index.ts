import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AIClient } from "../_shared/ai/client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { word, context } = await req.json();

    if (!word || !context) {
      return new Response(
        JSON.stringify({ error: 'word and context are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiClient = new AIClient();

    const systemPrompt = `You are an expert English language teacher. Explain a word's meaning as used in a specific passage context. Return JSON with two fields.`;

    const userPrompt = `Word: "${word}"

Context:
"${context}"

Return a JSON object with:
- "definition": A single concise sentence defining what "${word}" means in this context.
- "explanation": 2-3 sentences explaining how "${word}" functions in this passage and what it conveys here.

Focus only on the meaning in this context, not all possible meanings.`;

    console.log(`Explaining word "${word}" in context...`);
    const result = await aiClient.generate(systemPrompt, userPrompt, true);

    return new Response(
      JSON.stringify({
        definition: result.definition || null,
        explanation: result.explanation || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error explaining word:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to explain word' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
