"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { cn } from "@/lib/utils";

type AuthTab = "login" | "register";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AuthTab>(() => (searchParams.get("tab") === "register" ? "register" : "login"));
  const { isReady, userId } = useSessionContext();
  const router = useRouter();

  useEffect(() => {
    const tab = searchParams.get("tab");

    if (tab === "login" || tab === "register") {
      setActiveTab(tab);
    }

    if (isReady && userId) {
      router.replace("/dashboard");
    }
  }, [isReady, router, searchParams, userId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6 text-[var(--foreground)]">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]">
              <span className="text-3xl font-bold text-white">P</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)]">PulseForge</h1>
          </div>
        </div>

        <div className="mb-8 flex border-b border-[color:var(--card-border)]">
          <button
            onClick={() => setActiveTab("login")}
            className={cn(
              "flex-1 pb-4 text-lg font-medium transition-colors",
              activeTab === "login"
                ? "border-b-2 border-[var(--accent)] text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]",
            )}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={cn(
              "flex-1 pb-4 text-lg font-medium transition-colors",
              activeTab === "register"
                ? "border-b-2 border-[var(--accent)] text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]",
            )}
          >
            Register
          </button>
        </div>

        <div className="rounded-3xl border border-[color:var(--card-border)] bg-[var(--surface)] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl">
          {activeTab === "login" ? (
            <LoginForm />
          ) : (
            <RegisterForm onRegistered={() => setActiveTab("login")} />
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}