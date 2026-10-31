"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building,
  Check,
  Lock,
  Mail,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("5-50");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !companyName.trim()) return;

    setIsLoading(true);
    // Route directly to the 6-step guided onboarding wizard
    setTimeout(() => {
      setIsLoading(false);
      router.push(`/onboarding?org=${encodeURIComponent(companyName)}`);
    }, 600);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[var(--color-space)] px-4 py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block">
          <BrandLogo className="h-8 w-auto mx-auto text-[var(--color-space-text)]" />
        </Link>
        <h2 className="mt-6 text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
          Create your organization workspace
        </h2>
        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
          Free 14-day full platform access. No credit card required.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-6 shadow-xl sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <Input
                  type="text"
                  required
                  placeholder="Alex Chen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-9 text-xs bg-[var(--color-surface)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <Input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-xs bg-[var(--color-surface)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Company / Organization Name
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <Input
                  type="text"
                  required
                  placeholder="Acme Technologies"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-9 text-xs bg-[var(--color-surface)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Team Size
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] pl-9 pr-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-hidden"
                >
                  <option value="1-5">1 – 5 employees (Early Stage)</option>
                  <option value="5-50">5 – 50 employees (Growing Startup)</option>
                  <option value="50-200">50 – 200 employees (Scaleup)</option>
                  <option value="200+">200+ employees (Enterprise)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <Input
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 text-xs bg-[var(--color-surface)]"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded border-[var(--color-border-secondary)] text-[var(--color-accent)]"
              />
              <span className="text-[11px] text-[var(--color-text-secondary)] leading-tight">
                I agree to the{" "}
                <Link href="/terms" className="text-[var(--color-accent)] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[var(--color-accent)] hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !acceptTerms}
              className="w-full bg-[var(--color-accent)] text-white text-xs font-semibold py-2 hover:opacity-90 shadow-xs"
            >
              {isLoading ? "Setting up workspace..." : "Continue to Workspace Setup →"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-[var(--color-text-tertiary)]">
            <span>Already have an account? </span>
            <Link href="/login" className="font-semibold text-[var(--color-accent)] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
