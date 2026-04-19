import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

let authClient: SupabaseClient | null = null;

function getAuthClient() {
  if (authClient) {
    return authClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return authClient;
}

function extractAccessToken(sessionValue: string | null | undefined) {
  if (!sessionValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(sessionValue) as Partial<Session> | string | null;

    if (typeof parsed === "string") {
      return parsed.trim() || null;
    }

    return typeof parsed?.access_token === "string" ? parsed.access_token : null;
  } catch {
    return sessionValue.trim() || null;
  }
}

export async function validateSession(sessionValue: string | null | undefined) {
  const accessToken = extractAccessToken(sessionValue);
  const client = getAuthClient();

  if (!accessToken || !client) {
    return null;
  }

  const { data, error } = await client.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return { user: data.user };
}