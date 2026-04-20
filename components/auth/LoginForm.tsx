"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { Github } from "lucide-react";

import { fetchApiJson } from "@/lib/api/client";
import { supabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginResponse = {
  data: {
    session: Session;
  };
};

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleGitHubLogin = async () => {
    setErrorMessage(null);

    if (!supabaseClient) {
      setErrorMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setOauthLoading(true);

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setOauthLoading(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const payload = await fetchApiJson<LoginResponse>("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        session: {},
      });

      if (supabaseClient) {
        const { error } = await supabaseClient.auth.setSession(payload.data.session);

        if (error) {
          throw new Error(error.message);
        }
      }

      // Cookie is set by the server

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <button
        type="button"
        onClick={handleGitHubLogin}
        disabled={loading || oauthLoading}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 py-4 font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Github className="h-5 w-5" />
        {oauthLoading ? "Redirecting..." : "Continue with GitHub"}
      </button>

      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">OR</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-zinc-400">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-zinc-400">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      {errorMessage && <p className="text-sm text-rose-400">{errorMessage}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </Button>

      <p className="text-center text-sm text-[var(--muted)]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[var(--accent)] transition-colors hover:opacity-80">
          Sign up
        </Link>
      </p>
    </form>
  );
}