import { createClient } from "@supabase/supabase-js";

// Public browser-safe Supabase credentials.
// NEVER put the service_role key here.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL_SEPTENTRIO;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY_SEPTENTRIO;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing VITE_SUPABASE_URL_SEPTENTRIO / VITE_SUPABASE_ANON_KEY_SEPTENTRIO. " +
    "Create .env.local in the project root and add your Supabase URL and public anon key."
  );
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

export const TABLE_NAME = "septentrio";