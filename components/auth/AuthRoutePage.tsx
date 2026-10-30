"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";
import OAuthButtons from "@/components/auth/OAuthButtons";
import RegisterForm from "@/components/auth/RegisterForm";
import { OrbitMark } from "@/components/brand/OrbitMark";
import { fetchAuthConfig, type AuthConfig } from "@/lib/auth/client";

type AuthRoutePageProps = {
  mode: "login" | "register";
};

// Better Auth redirects back with ?error=<code> when an OAuth sign-in fails.
const oauthErrorMessages: Record<string, string> = {
  access_denied: "Sign-in was canceled.",
  email_not_found: "That provider didn't share an email address. Add a verified email to your account there and try again.",
  account_not_linked: "This email already has an account. Sign in with your password first.",
};

export default function AuthRoutePage({ mode }: AuthRoutePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("error");
    if (code) {
      setError(oauthErrorMessages[code] ?? "Sign-in failed. Please try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    fetchAuthConfig()
      .then((loaded) => {
        // Single-user mode has nothing to sign in to.
        if (!loaded.loginEnabled) {
          router.replace("/dashboard");
          return;
        }
        setConfig(loaded);
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not reach the Orbit API"));
  }, [router]);

  const isLogin = mode === "login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <OrbitMark className="mx-auto mb-4 h-11 w-11 rounded-xl" />
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {isLogin ? "Sign in to Orbit" : "Create your Orbit account"}
          </h1>
        </div>

        <div className="orbit-card grid gap-5 p-6">
          {error ? (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          {config ? (
            <>
              <OAuthButtons providers={config.providers} onError={setError} />
              {config.providers.length > 0 ? (
                <div className="flex items-center gap-3 text-xs text-[var(--color-text-tertiary)]">
                  <span className="h-px flex-1 bg-[var(--color-border-secondary)]" />
                  or with email
                  <span className="h-px flex-1 bg-[var(--color-border-secondary)]" />
                </div>
              ) : null}
              {isLogin ? <LoginForm onError={setError} /> : <RegisterForm onError={setError} />}
            </>
          ) : !error ? (
            <div className="h-48 animate-pulse rounded-lg bg-[var(--color-surface-hover)]" aria-busy="true" />
          ) : null}
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link href={isLogin ? "/register" : "/login"} className="font-medium text-[var(--color-accent)] hover:underline">
            {isLogin ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </div>
    </main>
  );
}
