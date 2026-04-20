"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";

import { fetchApiJson } from "@/lib/api/client";
import { supabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RegisterResponse = {
  data: {
    session: Session | null;
  };
};

type RegisterFormProps = {
  onRegistered?: () => void;
  showLoginPrompt?: boolean;
  onLoginRequested?: () => void;
};

export default function RegisterForm({ onRegistered, showLoginPrompt = true, onLoginRequested }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    workspaceName: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleLoginClick = () => {
    if (onLoginRequested) {
      onLoginRequested();
      return;
    }

    router.push("/login");
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const { fullName, email, password, confirmPassword, workspaceName } = formData;

    if (fullName.trim().length < 2) {
      setErrorMessage("Full name must be at least 2 characters.");
      return;
    }

    if (workspaceName.trim().length < 2) {
      setErrorMessage("Workspace name must be at least 2 characters.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const payload = await fetchApiJson<RegisterResponse>("/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          workspaceName: workspaceName.trim(),
        }),
        session: {},
      });

      if (payload.data.session && supabaseClient) {
        const { error } = await supabaseClient.auth.setSession(payload.data.session);

        if (error) {
          throw new Error(error.message);
        }
      }

      if (onRegistered) {
        onRegistered();
      } else if (payload.data.session) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        router.replace("/login");
        router.refresh();
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm text-[var(--muted)]">Full Name</label>
        <Input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="John Doe"
          autoComplete="name"
          minLength={2}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-[var(--muted)]">Workspace Name</label>
        <Input
          type="text"
          name="workspaceName"
          value={formData.workspaceName}
          onChange={handleChange}
          placeholder="Orbit Team"
          autoComplete="organization"
          minLength={2}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-[var(--muted)]">Email</label>
        <Input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-[var(--muted)]">Password</label>
        <Input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a strong password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-[var(--muted)]">Confirm Password</label>
        <Input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      {errorMessage && <p className="text-sm text-rose-400">{errorMessage}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create Account & Workspace"}
      </Button>

      {showLoginPrompt && (
        <p className="text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <button type="button" onClick={handleLoginClick} className="text-[var(--accent)] transition-colors hover:opacity-80">
            Sign in
          </button>
        </p>
      )}
    </form>
  );
}