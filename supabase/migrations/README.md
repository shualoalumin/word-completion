# Supabase migrations

**When you add or change a migration:** apply it (run `npx supabase db push` or run the SQL in Dashboard → SQL Editor) so the DB stays in sync.

## Filename format

Use **YYYYMMDDHHMMSS** (year, month, day, hour, minute, second) so migrations run in order.

Example: `20260201143000_add_something.sql` = 2026-02-01 14:30:00

## Applying migrations

- **CLI (when local and remote match):**  
  `npx supabase db push`

- **If push fails** (e.g. "Remote migration versions not found in local"):  
  Run the migration SQL manually in **Supabase Dashboard → SQL Editor**.

  For `20250101000000_add_target_time_seconds.sql`:

  ```sql
  ALTER TABLE public.user_exercise_history
  ADD COLUMN IF NOT EXISTS target_time_seconds integer NULL;
  ```
