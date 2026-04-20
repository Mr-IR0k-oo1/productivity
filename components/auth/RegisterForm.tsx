"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterForm({ onRegistered }: { onRegistered?: () => void }) {
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
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "register",
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          workspaceName: workspaceName.trim(),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create account");
      }

      document.cookie = `session_token=${payload.data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;

      if (onRegistered) {
        onRegistered();
      } else {
        router.replace("/dashboard");
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

      {errorMessage && <p className="text-sm text-rose-400">{errorMessage}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create Account & Workspace"}
      </Button>

      <p className="text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-[var(--accent)] transition-colors hover:opacity-80"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}