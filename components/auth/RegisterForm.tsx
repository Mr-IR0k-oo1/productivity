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

type RegisterResult = {
  requiresEmailConfirmation: boolean;
};

type RegisterFormProps = {
  onRegistered?: (result?: RegisterResult) => void;
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
    jobTitle: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
    setSuccessMessage(null);

    const { fullName, email, password, confirmPassword, workspaceName, jobTitle } = formData;

    if (fullName.trim().length < 2) {
      setErrorMessage("Full name must be at least 2 characters.");
      return;
    }

    if (workspaceName.trim().length < 2) {
      setErrorMessage("Workspace name must be at least 2 characters.");
      return;
    }

    if (jobTitle.trim().length > 0 && jobTitle.trim().length < 2) {
      setErrorMessage("Job title must be at least 2 characters when provided.");
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
          email: email.trim().toLowerCase(),
          password,
          fullName: fullName.trim(),
          workspaceName: workspaceName.trim(),
          jobTitle: jobTitle.trim() ? jobTitle.trim() : undefined,
        }),
        session: {},
      });

      if (payload.data.session && supabaseClient) {
        const { error } = await supabaseClient.auth.setSession(payload.data.session);

        if (error) {
          throw new Error(error.message);
        }
      }

      const result: RegisterResult = {
        requiresEmailConfirmation: !payload.data.session,
      };

      if (onRegistered) {
        onRegistered(result);
        return;
      }

      if (!result.requiresEmailConfirmation) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setSuccessMessage("Account created. Please check your email to confirm your account.");
      router.replace("/login?notice=check_email");
      router.refresh();
    } catch (err) {
      setSuccessMessage(null);
      setErrorMessage(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-6">
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {successMessage}
        </div>
      )}

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
          placeholder="My Startup Team"
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
        <label className="text-sm text-[var(--muted)]">Job Title (Optional)</label>
        <Input
          type="text"
          name="jobTitle"
          value={formData.jobTitle}
          onChange={handleChange}
          placeholder="Founder / Product Manager"
          autoComplete="organization-title"
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
