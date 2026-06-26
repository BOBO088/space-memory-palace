// Browser + server Supabase client.
//
// We expose a single browser-safe client. Reads/writes always go through
// the anon key; if the project has stricter RLS, swap the key accordingly.
//
// `isSupabaseConfigured()` returns true only when both env vars are
// present. Callers should use this to decide between the localStorage
// layer and the Supabase layer.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let cached: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return URL.trim() !== "" && ANON.trim() !== "";
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cached) return cached;
  cached = createClient(URL, ANON, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return cached;
}
