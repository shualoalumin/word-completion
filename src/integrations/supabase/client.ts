import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// These should be environment variables in a real app, but for now we'll hardcode them
// to point to the new 'global-prep-core' project.
const SUPABASE_URL = "https://qnqfarulquicshnwfaxi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucWZhcnVscXVpY3NobndmYXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMjUxMDQsImV4cCI6MjA4MjYwMTEwNH0.GSWUJpfpz0aaxIJHM3JZLwwE17MPk5Q495Un5TvP2tY";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
