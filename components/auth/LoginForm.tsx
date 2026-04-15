"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { REMEMBER_ME_STORAGE_KEY } from "@/lib/auth/session";

type LoginResponse = {
  data: {
    session: {
      access_token: string;
      refresh_token: string;
    };
    user: {
      id: string;
      email: string;
      fullName: string | null;
    } | null;
  };
};

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (!supabase) {
        throw new Error("Supabase is not configured in this environment.");
      }

      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, rememberMe ? "true" : "false");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const payload = (await response.json().catch(() => null)) as LoginResponse | { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload && "error" in payload ? payload.error ?? "Failed to sign in" : "Failed to sign in");
      }

      const session = payload && "data" in payload ? payload.data.session : null;

      if (!session) {
        throw new Error("Missing session from authentication response.");
      }

      const { error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (error) {
        throw new Error(error.message);
      }

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

      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Remember me
        </label>

        <Link href="/auth/forgot-password" className="text-sm text-[var(--accent)] transition-colors hover:opacity-80">
          Forgot password?
        </Link>
      </div>

      {errorMessage && <p className="text-sm text-rose-400">{errorMessage}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </Button>

      <p className="text-center text-sm text-[var(--muted)]">
        Don&apos;t have an account?{" "}
        <Link href="/auth?tab=register" className="text-[var(--accent)] transition-colors hover:opacity-80">
          Sign up
        </Link>
      </p>
    </form>
  );
}