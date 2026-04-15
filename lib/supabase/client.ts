import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { AUTH_SESSION_STORAGE_KEY, REMEMBER_ME_STORAGE_KEY } from "@/lib/auth/session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseConfig && process.env.NODE_ENV !== "production") {
  console.warn("Supabase client env vars are missing.");
}

export const supabaseClient: SupabaseClient | null = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: {
          getItem: (key) => {
            if (typeof window === "undefined") {
              return null;
            }

            const rememberMe = window.localStorage.getItem(REMEMBER_ME_STORAGE_KEY);
            const preferredStorage = rememberMe === "false" ? window.sessionStorage : window.localStorage;
            return preferredStorage.getItem(key);
          },
          setItem: (key, value) => {
            if (typeof window === "undefined") {
              return;
            }

            const rememberMe = window.localStorage.getItem(REMEMBER_ME_STORAGE_KEY);
            const preferredStorage = rememberMe === "false" ? window.sessionStorage : window.localStorage;
            const alternateStorage = preferredStorage === window.localStorage ? window.sessionStorage : window.localStorage;

            preferredStorage.setItem(key, value);
            alternateStorage.removeItem(key);
          },
          removeItem: (key) => {
            if (typeof window === "undefined") {
              return;
            }

            window.localStorage.removeItem(key);
            window.sessionStorage.removeItem(key);
          },
        },
        storageKey: AUTH_SESSION_STORAGE_KEY,
        persistSession: true,
      },
    })
  : null;

export const isSupabaseConfigured = hasSupabaseConfig;
