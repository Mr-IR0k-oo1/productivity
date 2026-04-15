"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { REMEMBER_ME_STORAGE_KEY, WORKSPACE_STORAGE_KEY } from "@/lib/auth/session";
import { supabase } from "@/lib/supabase";

type RegisterResponse = {
  data: {
    userId: string;
    workspaceId: string;
    authUserId: string;
    session: {
      access_token: string;
      refresh_token: string;
    } | null;
  };
};

type RegisterFormProps = {
  onRegistered?: () => void;
};

type RegisterFormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  workspaceName: string;
  jobTitle: string;
};

export default function RegisterForm({ onRegistered }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
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

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const workspaceName = formData.workspaceName.trim();
    const jobTitle = formData.jobTitle.trim();

    if (fullName.length < 2) {
      setErrorMessage("Full name must be at least 2 characters.");
      return;
    }

    if (workspaceName.length < 2) {
      setErrorMessage("Workspace name must be at least 2 characters.");
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Supabase is not configured in this environment.");
      }

      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, "true");

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: formData.password,
          fullName,
          workspaceName,
          jobTitle: jobTitle || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as RegisterResponse | { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload && "error" in payload ? payload.error ?? "Failed to create account" : "Failed to create account");
      }

      const session = payload && "data" in payload ? payload.data.session : null;

      if (session) {
        const { error } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        if (error) {
          throw new Error(error.message);
        }

        if (payload && "data" in payload && payload.data.workspaceId) {
          window.localStorage.setItem(WORKSPACE_STORAGE_KEY, payload.data.workspaceId);
        }

        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setSuccessMessage("Registration successful. Please check your email to confirm your account.");
      onRegistered?.();
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
          placeholder="PulseForge Team"
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

      <div className="space-y-2">
        <label className="text-sm text-[var(--muted)]">
          Job Title <span className="opacity-80">(optional)</span>
        </label>
        <Input
          type="text"
          name="jobTitle"
          value={formData.jobTitle}
          onChange={handleChange}
          placeholder="Founder / Product Manager"
          autoComplete="organization-title"
        />
      </div>

      {errorMessage && <p className="text-sm text-rose-400">{errorMessage}</p>}
      {successMessage && <p className="text-sm text-emerald-400">{successMessage}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create Account & Workspace"}
      </Button>

      <p className="text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => window.location.assign("/login")}
          className="text-[var(--accent)] transition-colors hover:opacity-80"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}