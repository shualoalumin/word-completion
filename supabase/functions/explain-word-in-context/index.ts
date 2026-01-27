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

    const systemPrompt = `You are an expert English teacher. Return JSON with "definition" (one sentence) and "explanation" (2-3 sentences) for the word's meaning in the given context.`;

    // Limit context length for faster processing
    const limitedContext = context.length > 500 ? context.substring(0, 500) + '...' : context;

    const userPrompt = `Word: "${word}"
Context: "${limitedContext}"

Return JSON:
{
  "definition": "One concise sentence defining '${word}' in this context",
  "explanation": "2-3 sentences explaining how '${word}' functions here"
}`;

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
