-- Deactivate ALL existing build-sentence cached exercises
-- They were generated before proper validation was added and most have:
-- - slots_count mismatch (includes distractors in count)
-- - reconstruction failures (chunks + anchors != full_response)
-- - duplicate chunk texts
-- - distractor chunks incorrectly placed in correct_order
-- New exercises will be generated fresh with proper validation
UPDATE exercises
SET is_active = false
WHERE exercise_type = 'build-sentence'
  AND is_active = true;
