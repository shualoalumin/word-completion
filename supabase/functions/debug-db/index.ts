import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizeSpacing } from "../_shared/normalize-spacing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { id_to_test } = await req.json().catch(() => ({}));

    if (id_to_test) {
      console.log(`Testing normalization on ID: ${id_to_test}`);
      const { data: ex } = await supabase
        .from("exercises")
        .select("*")
        .eq("id", id_to_test)
        .single();
      
      if (!ex) throw new Error("Exercise not found");

      const original = ex.content;
      const normalized = normalizeSpacing(original);

      return new Response(JSON.stringify({
        original_sample: original.content_parts.slice(0, 3),
        normalized_sample: normalized.content_parts.slice(0, 3),
        is_changed: JSON.stringify(original) !== JSON.stringify(normalized)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Searching for corrupted exercises...");

    const { data: exercises, error } = await supabase
      .from("exercises")
      .select("*")
      .eq("section", "reading")
      .eq("exercise_type", "text-completion");

    if (error) throw error;

    const corrupted = exercises?.filter(ex => {
      // content가 문자열이면 파싱, 객체면 그대로 사용
      const content = typeof ex.content === 'string' ? JSON.parse(ex.content) : ex.content;
      const parts = content.content_parts || [];
      const fullText = parts.map((p: any) => p.value || p.full_word).join("");
      return fullText.includes("Ecosystems are complex natural systems");
    });

    return new Response(JSON.stringify({
      count: corrupted?.length,
      exercises: corrupted?.map(ex => ({
        id: ex.id,
        topic: ex.topic,
        content_sample: ex.content.content_parts.slice(0, 5)
      }))
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

