# Supabase setup (global-prep-core)

## 1) Frontend env

Set these Vite env vars (e.g. in `.env.local`):

- `VITE_SUPABASE_URL`: `https://qnqfarulquicshnwfaxi.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_6geMTEE9D80rTWyKM7Q2yg_Vdj-gFMO`

If you prefer the legacy anon JWT key, you can use:

- `VITE_SUPABASE_PUBLISHABLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucWZhcnVscXVpY3NobndmYXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMjUxMDQsImV4cCI6MjA4MjYwMTEwNH0.GSWUJpfpz0aaxIJHM3JZLwwE17MPk5Q495Un5TvP2tY`

## 2) Edge Function secret

The Edge Function `generate-passage` requires:

- `LOVABLE_API_KEY`

Set it in Supabase Dashboard:

- Project → **Edge Functions** → **Secrets** → add `LOVABLE_API_KEY`

## 3) Deploy status

The Edge Function `generate-passage` has been deployed to this project, but it will fail until `LOVABLE_API_KEY` is set.




