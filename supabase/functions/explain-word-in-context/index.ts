import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { word, context } = await req.json();

    if (!word || !context) {
      return new Response(
        JSON.stringify({ error: 'word and context are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiClient = new AIClient();

    const systemPrompt = `You are an expert English language teacher helping students understand vocabulary in context. 
Your task is to explain the meaning of a word as it is used in a specific passage, not just provide a dictionary definition.
Focus on how the word functions in this particular context and what it means here.`;

    const userPrompt = `Word: "${word}"

Passage context:
"${context}"

Please explain what "${word}" means in this specific passage. 
- Focus on the meaning in this context, not all possible meanings
- Explain how it functions in the sentence
- Keep it concise (2-3 sentences maximum)
- Write in clear, simple English`;

    console.log(`Explaining word "${word}" in context...`);
    const explanation = await aiClient.generate(systemPrompt, userPrompt, false);

    return new Response(
      JSON.stringify({ explanation }),
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
