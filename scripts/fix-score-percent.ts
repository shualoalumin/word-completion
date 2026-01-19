/**
 * Fix score_percent for records where score > 0 but score_percent = 0
 * Run with: npx tsx scripts/fix-score-percent.ts
 */

import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const SUPABASE_URL = "https://qnqfarulquicshnwfaxi.supabase.co";
// Get service_role key from environment variable for security
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required');
  console.log('Usage: $env:SUPABASE_SERVICE_KEY="your_key"; npx tsx scripts/fix-score-percent.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixScorePercent() {
  console.log('🔍 Finding records with score > 0 but score_percent = 0 or NULL...\n');

  // Get all records with score > 0, then filter for score_percent = 0 or NULL
  const { data: allRecords, error: allError } = await supabase
    .from('user_exercise_history')
    .select('id, score, max_score, score_percent, completed_at')
    .gt('score', 0)
    .order('completed_at', { ascending: false });

  if (allError) {
    console.error('❌ Error finding records:', allError);
    return;
  }

  // Filter for score_percent = 0 or NULL
  const affectedRecords = (allRecords || []).filter(r => 
    r.score_percent === null || r.score_percent === 0 || r.score_percent === '0'
  );

  if (!affectedRecords || affectedRecords.length === 0) {
    console.log('✅ No records need fixing!');
    return;
  }

  console.log(`Found ${affectedRecords.length} records to fix:\n`);
  
  // Fix each record
  let fixed = 0;
  for (const record of affectedRecords) {
    const correctPercent = Math.round((record.score / record.max_score) * 100 * 100) / 100;
    
    console.log(`  ID: ${record.id}`);
    console.log(`    Score: ${record.score}/${record.max_score}`);
    console.log(`    Current %: ${record.score_percent} → Correct %: ${correctPercent}`);
    
    const { error: updateError } = await supabase
      .from('user_exercise_history')
      .update({ score_percent: correctPercent })
      .eq('id', record.id);

    if (updateError) {
      console.log(`    ❌ Failed: ${updateError.message}`);
    } else {
      console.log(`    ✅ Fixed!`);
      fixed++;
    }
  }

  console.log(`\n✅ Fixed ${fixed}/${affectedRecords.length} records`);
}

fixScorePercent();
