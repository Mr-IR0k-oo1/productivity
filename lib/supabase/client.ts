import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Allow build-time loading while still failing fast at runtime when misconfigured.
  console.warn("Supabase client env vars are missing.");
}

export const supabaseClient = createClient(
  supabaseUrl ?? "",
  supabaseAnonKey ?? "",
);
