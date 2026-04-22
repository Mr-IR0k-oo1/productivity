"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/button";

type AuthMode = "login" | "register";

type AuthRoutePageProps = {
  mode: AuthMode;
};

const callbackErrorMessages: Record<string, string> = {
  oauth_failed: "OAuth sign-in failed. Please try again.",
  oauth_bootstrap_failed: "Sign-in succeeded, but workspace setup failed. Please contact support.",
  oauth_unavailable: "OAuth is not available right now. Check your Supabase client configuration.",
};

const queryNoticeMessages: Record<string, string> = {
  check_email: "Account created. Check your inbox to confirm your email before signing in.",
};

const copyByMode: Record<
  AuthMode,
  {
    eyebrow: string;
    title: string;
    description: string;
    alternateHref: string;
    alternateLabel: string;
    alternatePrompt: string;
  }
> = {
  login: {
    eyebrow: "Login",
    title: "Welcome back",
    description: "Sign in to your workspace and pick up where you left off.",
    alternateHref: "/register",
    alternateLabel: "Register",
    alternatePrompt: "Need an account?",
  },
  register: {
    eyebrow: "Register",
    title: "Create your workspace",
    description: "Start a new account and create the first workspace for your team.",
    alternateHref: "/login",
    alternateLabel: "Log in",
    alternatePrompt: "Already have an account?",
  },
};

export default function AuthRoutePage({ mode }: AuthRoutePageProps) {
  const { isReady, userId } = useSessionContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const copy = copyByMode[mode];
  const isLogin = mode === "login";
  const queryError = searchParams.get("error");
  const queryNotice = searchParams.get("notice");
  const queryReason = searchParams.get("reason")?.trim() || null;
  const errorMessage =
    queryError === "oauth_bootstrap_failed" && queryReason
      ? queryReason.toLowerCase().includes("did not provide an email")
        ? "GitHub did not provide an email address. In GitHub Settings > Emails, add/verify an email and allow it for sign-in, then try again."
        : queryReason
      : queryError
        ? callbackErrorMessages[queryError] ?? "Unable to complete sign in."
        : null;
  const noticeMessage = queryNotice ? queryNoticeMessages[queryNotice] ?? null : null;

  useEffect(() => {
    if (isReady && userId) {
      router.replace("/dashboard");
    }
  }, [isReady, router, userId]);

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
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">{copy.eyebrow}</p>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">{copy.title}</h2>
            <p className="text-sm text-[var(--muted)]">{copy.description}</p>
          </div>

          {errorMessage ? (
            <p className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{errorMessage}</p>
          ) : null}

          {noticeMessage ? (
            <p className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{noticeMessage}</p>
          ) : null}

          <div className="mt-8">{isLogin ? <LoginForm showSocialLogin showRegisterPrompt={false} /> : <RegisterForm showLoginPrompt={false} />}</div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-[color:var(--card-border)] pt-6 text-sm">
            <p className="text-[var(--muted)]">{copy.alternatePrompt}</p>
            <Button asChild variant="secondary" size="sm">
              <Link href={copy.alternateHref}>{copy.alternateLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
