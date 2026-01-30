#!/usr/bin/env node
/**
 * Verify explain-word-in-context Edge Function is deployed and responding.
 * Run: node scripts/verify-edge-function.js
 * Or: VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/verify-edge-function.js
 */
const url = process.env.VITE_SUPABASE_URL || 'https://qnqfarulquicshnwfaxi.supabase.co';
const anon = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucWZhcnVscXVpY3NobndmYXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMjUxMDQsImV4cCI6MjA4MjYwMTEwNH0.GSWUJpfpz0aaxIJHM3JZLwwE17MPk5Q495Un5TvP2tY';
const endpoint = `${url}/functions/v1/explain-word-in-context`;

async function main() {
  console.log('POST', endpoint);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anon}` },
    body: JSON.stringify({ word: 'test', context: 'This is a test sentence.' }),
  });
  console.log('Status:', res.status, res.statusText);
  console.log('Access-Control-Allow-Origin:', res.headers.get('Access-Control-Allow-Origin'));
  const text = await res.text();
  console.log('Body:', text.slice(0, 300));
  process.exit(res.ok ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
