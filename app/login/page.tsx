"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    // Simulate enterprise auth handshake or seamless local fallback
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 600);
  };

  const handleDemoAccess = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[var(--color-space)] px-4 py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block">
          <BrandLogo className="h-8 w-auto mx-auto text-[var(--color-space-text)]" />
        </Link>
        <h2 className="mt-6 text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
          Sign in to your workspace
        </h2>
        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
          One workspace to align people, organize projects, and move company goals forward.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-6 shadow-xl sm:p-8">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <Input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-xs bg-[var(--color-surface)]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-[var(--color-accent)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 text-xs bg-[var(--color-surface)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[var(--color-text-secondary)]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[var(--color-border-secondary)] text-[var(--color-accent)]"
                />
                <span>Remember this device</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--color-accent)] text-white text-xs font-semibold py-2 hover:opacity-90 shadow-xs"
            >
              {isLoading ? "Signing in..." : "Sign In to Orbit"}
            </Button>
          </form>

          {/* Quick Demo Evaluation Option */}
          <div className="mt-5 border-t border-[var(--color-border-secondary)] pt-4">
            <button
              type="button"
              onClick={handleDemoAccess}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] py-2 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
              <span>Launch Instant Demo Workspace</span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-[var(--color-text-tertiary)]">
            <span>Don&apos;t have an organization workspace? </span>
            <Link href="/register" className="font-semibold text-[var(--color-accent)] hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
