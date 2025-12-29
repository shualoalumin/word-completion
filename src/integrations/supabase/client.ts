import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Use environment variables with fallback for development
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://qnqfarulquicshnwfaxi.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucWZhcnVscXVpY3NobndmYXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMjUxMDQsImV4cCI6MjA4MjYwMTEwNH0.GSWUJpfpz0aaxIJHM3JZLwwE17MPk5Q495Un5TvP2tY";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
