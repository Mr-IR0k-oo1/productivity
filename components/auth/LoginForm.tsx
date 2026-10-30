"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

type LoginFormProps = {
  onError: (message: string | null) => void;
};

export default function LoginForm({ onError }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    onError(null);
    setLoading(true);

    const { error } = await authClient.signIn.email({ email: email.trim(), password, rememberMe });

    setLoading(false);

    if (error) {
      onError(error.status === 401 ? "Email or password is incorrect." : error.message ?? "Could not sign in.");
      return;
    }

    // Full navigation so the session provider picks up the new cookie.
    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="grid gap-1.5 text-sm text-[var(--color-text-secondary)]">
        Email
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
      </label>
      <label className="grid gap-1.5 text-sm text-[var(--color-text-secondary)]">
        Password
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          minLength={8}
          required
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
          className="h-4 w-4 rounded accent-[var(--color-accent)]"
        />
        Keep me signed in
      </label>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
