"use client";

import { useState } from "react";
import { Building2, Chrome, Github } from "lucide-react";

import { getPublicAppUrl, REMEMBER_ME_STORAGE_KEY } from "@/lib/auth/session";
import { supabaseClient } from "@/lib/supabase/client";

type OAuthProvider = "google" | "github" | "azure";

type OAuthProviderConfig = {
  provider: OAuthProvider;
  label: string;
  icon: typeof Chrome;
  className: string;
  scopes?: string;
};

const oauthProviders: OAuthProviderConfig[] = [
  {
    provider: "google",
    label: "Continue with Google",
    icon: Chrome,
    className: "bg-white text-black hover:bg-zinc-100",
  },
  {
    provider: "github",
    label: "Continue with GitHub",
    icon: Github,
    className: "border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800",
    scopes: "read:user user:email",
  },
  {
    provider: "azure",
    label: "Continue with Microsoft",
    icon: Building2,
    className: "border border-sky-700/50 bg-sky-950/60 text-sky-100 hover:bg-sky-900/70",
  },
];

type OAuthButtonsProps = {
  mode?: "login" | "register";
  rememberMe?: boolean;
  onError?: (error: string) => void;
  onSuccess?: () => void;
  disabled?: boolean;
};

function normalizeOAuthError(message: string) {
  const lowered = message.toLowerCase();

  if (lowered.includes("access denied") || lowered.includes("canceled")) {
    return "OAuth sign-in was canceled. Please try again.";
  }

  if (lowered.includes("invalid flow state") || lowered.includes("code verifier")) {
    return "OAuth session expired. Please try signing in again.";
  }

  if (lowered.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (lowered.includes("provider not found") || lowered.includes("unsupported provider")) {
    return "OAuth is not configured for this provider in Supabase yet.";
  }

  if (lowered.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  return message || "Failed to start OAuth sign-in";
}

export function OAuthButtons({
  mode = "login",
  rememberMe = true,
  onError,
  onSuccess,
  disabled = false,
}: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  const isBusy = disabled || loadingProvider !== null;

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    if (!supabaseClient) {
      const error = "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";
      if (onError) onError(error);
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, rememberMe ? "true" : "false");
    }

    setLoadingProvider(provider);

    try {
      const providerConfig = oauthProviders.find((entry) => entry.provider === provider);
      const redirectTo = `${getPublicAppUrl()}/auth/callback`;

      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          ...(providerConfig?.scopes ? { scopes: providerConfig.scopes } : {}),
        },
      });

      if (error) {
        throw error;
      }

      // Success - redirecting to OAuth provider
      if (onSuccess) onSuccess();
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : "Failed to start OAuth sign-in";
      const normalizedError = normalizeOAuthError(fallbackMessage);
      if (onError) onError(normalizedError);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      {oauthProviders.map(({ provider, label, icon: Icon, className }) => {
        const isRegister = mode === "register";
        const buttonLabel = isRegister
          ? label.replace("Continue with", "Sign up with")
          : label;

        return (
          <button
            key={provider}
            type="button"
            onClick={() => void handleOAuthLogin(provider)}
            disabled={isBusy}
            className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
          >
            <Icon className="h-5 w-5" />
            {loadingProvider === provider ? "Redirecting..." : buttonLabel}
          </button>
        );
      })}
    </div>
  );
}
