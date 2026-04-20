"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Chrome, Github } from "lucide-react";

import { supabase } from "@/lib/supabase";

type OAuthProvider = "google" | "github" | "azure";

type ProviderConfig = {
  provider: OAuthProvider;
  label: string;
  icon: typeof Chrome;
  className: string;
};

const providers: ProviderConfig[] = [
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
  },
  {
    provider: "azure",
    label: "Continue with Microsoft",
    icon: Building2,
    className: "border border-cyan-500/40 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20",
  },
];

const callbackErrorMessages: Record<string, string> = {
  oauth_failed: "OAuth sign-in failed. Please try again.",
  oauth_bootstrap_failed: "Sign-in succeeded, but workspace setup failed. Please contact support.",
  oauth_unavailable: "OAuth is not available right now. Check your Supabase client configuration.",
};

export default function AuthPage() {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const callbackError = searchParams.get("error");

  const errorMessage = useMemo(() => {
    if (inlineError) {
      return inlineError;
    }

    if (!callbackError) {
      return null;
    }

    return callbackErrorMessages[callbackError] ?? "Unable to complete sign in.";
  }, [callbackError, inlineError]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isActive = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!isActive || !data.session) {
        return;
      }

      router.replace("/dashboard");
    });

    return () => {
      isActive = false;
    };
  }, [router]);

  const handleOAuth = async (provider: OAuthProvider) => {
    setInlineError(null);

    if (!supabase) {
      setInlineError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setLoadingProvider(provider);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setInlineError(error.message);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6 text-[var(--foreground)]">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]">
              <span className="text-3xl font-bold text-white">O</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)]">Orbit</h1>
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--card-border)] bg-[var(--surface)] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl">
          <h2 className="mb-8 text-center text-2xl font-semibold">Welcome to Orbit</h2>

          {errorMessage && (
            <p className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{errorMessage}</p>
          )}

          <div className="space-y-4">
            {providers.map(({ provider, label, icon: Icon, className }) => (
              <button
                key={provider}
                type="button"
                onClick={() => handleOAuth(provider)}
                disabled={loadingProvider !== null}
                className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
              >
                <Icon className="h-5 w-5" />
                {loadingProvider === provider ? "Redirecting..." : label}
              </button>
            ))}
          </div>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-700" />
            <span className="text-sm text-zinc-500">OR</span>
            <div className="h-px flex-1 bg-zinc-700" />
          </div>

          <Link
            href="/login"
            className="block w-full rounded-2xl border border-zinc-700 py-3.5 text-center font-medium text-zinc-300 transition-colors hover:text-white"
          >
            Continue with Email
          </Link>

          <p className="mt-4 text-center text-sm text-[var(--muted)]">
            Need an account?{" "}
            <Link href="/register" className="text-[var(--accent)] transition-colors hover:opacity-80">
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-sm text-[var(--muted)]">By signing in, you agree to our Terms and Privacy Policy.</p>
      </div>
    </div>
  );
}