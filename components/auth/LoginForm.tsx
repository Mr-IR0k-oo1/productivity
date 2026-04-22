"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { Building2, Chrome, Github, Mail } from "lucide-react";

import { fetchApiJson } from "@/lib/api/client";
import { REMEMBER_ME_STORAGE_KEY } from "@/lib/auth/session";
import { supabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginResponse = {
  data: {
    session: Session;
  };
};

type MagicLinkResponse = {
  success: boolean;
  message: string;
};

type LoginFormProps = {
  showSocialLogin?: boolean;
  showRegisterPrompt?: boolean;
  onRegisterRequested?: () => void;
  onSignedIn?: () => void;
};

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

function normalizeLoginError(message: string) {
  const lowered = message.toLowerCase();

  if (lowered.includes("invalid login credentials") || lowered.includes("invalid credentials")) {
    return "Invalid email or password.";
  }

  if (lowered.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  return message;
}

function normalizeOAuthLoginError(message: string) {
  const lowered = message.toLowerCase();

  if (lowered.includes("access denied") || lowered.includes("canceled")) {
    return "OAuth sign-in was canceled. Please try again.";
  }

  if (lowered.includes("invalid flow state") || lowered.includes("code verifier")) {
    return "OAuth session expired. Please try signing in again.";
  }

  if (lowered.includes("provider not found") || lowered.includes("unsupported provider")) {
    return "OAuth is not configured for this provider in Supabase yet.";
  }

  return normalizeLoginError(message);
}

export default function LoginForm({ showSocialLogin = true, showRegisterPrompt = true, onRegisterRequested, onSignedIn }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const router = useRouter();

  const rememberMeStorageValue = rememberMe ? "true" : "false";
  const isBusy = loading || magicLinkLoading || loadingProvider !== null;

  const handleRegisterClick = () => {
    if (onRegisterRequested) {
      onRegisterRequested();
      return;
    }

    router.push("/register");
  };

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setErrorMessage(null);
    setNoticeMessage(null);

    if (!supabaseClient) {
      setErrorMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, rememberMeStorageValue);
    }

    setLoadingProvider(provider);

    try {
      const providerConfig = oauthProviders.find((entry) => entry.provider === provider);

      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          ...(providerConfig?.scopes ? { scopes: providerConfig.scopes } : {}),
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : "Failed to start OAuth sign-in";
      setErrorMessage(normalizeOAuthLoginError(fallbackMessage));
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleMagicLink = async () => {
    setErrorMessage(null);
    setNoticeMessage(null);

    const normalizedEmail = magicLinkEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage("Enter an email address to receive a magic link.");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, rememberMeStorageValue);
    }

    setMagicLinkLoading(true);

    try {
      const payload = await fetchApiJson<MagicLinkResponse>("/api/auth/magic-link", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail }),
        session: {},
      });

      setMagicLinkEmail("");
      setNoticeMessage(payload.message || "If an account exists, a magic link has been sent.");
    } catch (err) {
      const fallbackMessage = err instanceof Error ? err.message : "Failed to send magic link";
      setErrorMessage(normalizeLoginError(fallbackMessage));
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setNoticeMessage(null);

    try {
      const payload = await fetchApiJson<LoginResponse>("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, rememberMe }),
        session: {},
      });

      if (typeof window !== "undefined") {
        window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, rememberMeStorageValue);
      }

      if (supabaseClient) {
        const { error } = await supabaseClient.auth.setSession(payload.data.session);

        if (error) {
          throw new Error(error.message);
        }
      }

      if (onSignedIn) {
        onSignedIn();
      } else {
        router.replace("/dashboard");
        router.refresh();
      }
    } catch (err) {
      const fallbackMessage = err instanceof Error ? err.message : "Failed to sign in";
      setErrorMessage(normalizeLoginError(fallbackMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {showSocialLogin && (
        <>
          <div className="space-y-3">
            {oauthProviders.map(({ provider, label, icon: Icon, className }) => (
              <button
                key={provider}
                type="button"
                onClick={() => void handleOAuthLogin(provider)}
                disabled={isBusy}
                className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
              >
                <Icon className="h-5 w-5" />
                {loadingProvider === provider ? "Redirecting..." : label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">OR</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>
        </>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {errorMessage}
        </div>
      )}

      {noticeMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {noticeMessage}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm text-zinc-400">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-zinc-400">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="********"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-zinc-400">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border border-zinc-600 bg-zinc-900 text-[var(--accent)]"
          />
          Remember me
        </label>

        <Link href="/auth/forgot-password" className="text-[var(--accent)] transition-colors hover:opacity-80">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="w-full" disabled={isBusy}>
        {loading ? "Signing in..." : "Sign In"}
      </Button>

      <div className="space-y-3">
        <label className="text-sm text-zinc-400">Email for Magic Link</label>
        <div className="flex gap-2">
          <Input
            type="email"
            value={magicLinkEmail}
            onChange={(event) => setMagicLinkEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <button
            type="button"
            onClick={() => void handleMagicLink()}
            disabled={isBusy}
            className="flex min-w-[132px] items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Mail className="h-4 w-4" />
            {magicLinkLoading ? "Sending..." : "Magic Link"}
          </button>
        </div>
      </div>

      {showRegisterPrompt && (
        <p className="text-center text-sm text-[var(--muted)]">
          Don&apos;t have an account?{" "}
          <button type="button" onClick={handleRegisterClick} className="text-[var(--accent)] transition-colors hover:opacity-80">
            Sign up
          </button>
        </p>
      )}
    </form>
  );
}
