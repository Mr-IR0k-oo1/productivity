"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

type RegisterFormProps = {
  onError: (message: string | null) => void;
};

export default function RegisterForm({ onError }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    onError(null);

    if (password.length < 8) {
      onError("Use at least 8 characters for your password.");
      return;
    }

    setLoading(true);
    const { error } = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password });
    setLoading(false);

    if (error) {
      onError(error.status === 422 ? "An account with this email already exists. Sign in instead." : error.message ?? "Could not create the account.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="grid gap-1.5 text-sm text-[var(--color-text-secondary)]">
        Name
        <Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" minLength={2} required />
      </label>
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
          autoComplete="new-password"
          minLength={8}
          required
        />
        <span className="text-xs text-[var(--color-text-tertiary)]">At least 8 characters.</span>
      </label>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
