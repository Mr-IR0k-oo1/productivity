"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/button";

type AuthMode = "login" | "register";

type AuthRoutePageProps = {
  mode: AuthMode;
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
  const copy = copyByMode[mode];
  const isLogin = mode === "login";

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
              <span className="text-3xl font-bold text-white">P</span>
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

          <div className="mt-8">{isLogin ? <LoginForm /> : <RegisterForm />}</div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-[color:var(--card-border)] pt-6 text-sm">
            <p className="text-[var(--muted)]">{copy.alternatePrompt}</p>
            <Button asChild variant="secondary" size="sm">
              <Link href={copy.alternateHref}>{copy.alternateLabel}</Link>
            </Button>
          </div>

          <div className="mt-4 text-center">
            <Link href="/auth" className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
              Open tabbed auth
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}