"use client";

import Link from "next/link";

import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6 text-[var(--foreground)]">
      <div className="w-full max-w-md rounded-3xl border border-[color:var(--card-border)] bg-[var(--surface)] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl">
        <div className="mb-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Password recovery</p>
          <h1 className="text-3xl font-semibold tracking-tight">Set a new password</h1>
          <p className="text-sm text-[var(--muted)]">Choose a new password for your account.</p>
        </div>

        <UpdatePasswordForm />

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-[var(--accent)] transition-colors hover:opacity-80">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}