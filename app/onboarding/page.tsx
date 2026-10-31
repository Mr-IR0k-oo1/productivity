"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building,
  Check,
  CheckCircle2,
  Clock,
  Globe,
  Mail,
  Plus,
  Rocket,
  Shield,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Welcome" },
  { id: 2, title: "Organization" },
  { id: 3, title: "Preferences" },
  { id: 4, title: "Teams" },
  { id: 5, title: "Invite" },
  { id: 6, title: "Complete" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrg = searchParams.get("org") || "Acme Technologies";

  const [currentStep, setCurrentStep] = useState(1);

  // Step 2: Org
  const [orgName, setOrgName] = useState(initialOrg);
  const [orgSlug, setOrgSlug] = useState(
    initialOrg.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  );
  const [industry, setIndustry] = useState("Technology & Software");

  // Step 3: Preferences
  const [timezone, setTimezone] = useState("UTC (GMT+00:00)");
  const [weekStart, setWeekStart] = useState("Monday");
  const [workingHours, setWorkingHours] = useState("09:00 - 17:00");

  // Step 4: Teams
  const [selectedTeams, setSelectedTeams] = useState<string[]>([
    "Engineering",
    "Product & Design",
    "Operations",
  ]);

  // Step 5: Invites
  const [inviteEmails, setInviteEmails] = useState("");

  const toggleTeam = (team: string) => {
    setSelectedTeams((prev) =>
      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team],
    );
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    } else {
      router.push("/dashboard");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-space)] text-[var(--color-space-text)] transition-colors">
      {/* Top Bar with Step Indicators */}
      <header className="border-b border-[var(--color-border-secondary)] bg-[var(--color-surface)]/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <BrandLogo className="h-6 w-auto" />

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {STEPS.map((s) => {
              const isPassed = s.id < currentStep;
              const isCurrent = s.id === currentStep;

              return (
                <div key={s.id} className="flex items-center gap-1.5 sm:gap-2">
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all",
                      isPassed
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-[var(--color-accent)] text-white ring-2 ring-[var(--color-accent)]/30"
                        : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]",
                    )}
                  >
                    {isPassed ? <Check className="h-3.5 w-3.5" /> : s.id}
                  </div>
                  <span
                    className={cn(
                      "hidden text-xs font-medium md:inline",
                      isCurrent
                        ? "text-[var(--color-text-primary)] font-semibold"
                        : "text-[var(--color-text-tertiary)]",
                    )}
                  >
                    {s.title}
                  </span>
                  {s.id !== 6 && (
                    <span className="hidden h-px w-3 bg-[var(--color-border-secondary)] sm:block" />
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
          >
            Skip setup
          </button>
        </div>
      </header>

      {/* Main Wizard Form Area */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-6 shadow-2xl sm:p-8 animate-in fade-in-50 zoom-in-95">
            {/* STEP 1: WELCOME */}
            {currentStep === 1 && (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] shadow-xs">
                  <Sparkles className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
                    Welcome to ORBIT
                  </h2>
                  <p className="mt-2 text-xs text-[var(--color-text-secondary)] sm:text-sm leading-relaxed">
                    Let&apos;s personalize your business workspace in under two minutes so your team can align people, organize projects, and move goals forward.
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-4 text-left text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Cross-platform desktop & cloud sync</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Real-time project portfolios, Kanban & backlogs</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Built-in time tracking, flowcharts, and team reports</span>
                  </div>
                </div>

                <Button
                  onClick={handleNext}
                  className="w-full bg-[var(--color-accent)] text-white text-xs font-semibold py-2.5 hover:opacity-90 shadow-xs"
                >
                  Start Setup →
                </Button>
              </div>
            )}

            {/* STEP 2: ORGANIZATION */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                    Organization Profile
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Define your company workspace identity.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Company Name
                  </label>
                  <Input
                    type="text"
                    value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }}
                    className="text-xs bg-[var(--color-surface)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Workspace URL Identifier
                  </label>
                  <div className="flex items-center rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text-primary)]">
                    <span className="text-[var(--color-text-tertiary)] mr-1">orbit.app/</span>
                    <input
                      type="text"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="w-full bg-transparent outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Industry Sector
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-hidden"
                  >
                    <option value="Technology & Software">Technology & Software</option>
                    <option value="Fintech & Banking">Fintech & Banking</option>
                    <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                    <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                    <option value="Media & Creative Agency">Media & Creative Agency</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" size="sm" onClick={handleBack} className="text-xs">
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90"
                  >
                    Next: Preferences →
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: PREFERENCES */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                    Working Schedule & Formats
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Align your calendar defaults and working cadence.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Default Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-hidden"
                  >
                    <option value="UTC (GMT+00:00)">UTC (GMT+00:00)</option>
                    <option value="America/New_York (EST)">America/New_York (EST)</option>
                    <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
                    <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                    <option value="Asia/Tokyo (JST)">Asia/Tokyo (JST)</option>
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Week Starts On
                    </label>
                    <select
                      value={weekStart}
                      onChange={(e) => setWeekStart(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-hidden"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Working Hours
                    </label>
                    <Input
                      type="text"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      className="text-xs bg-[var(--color-surface)]"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" size="sm" onClick={handleBack} className="text-xs">
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90"
                  >
                    Next: Squads →
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: TEAMS */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                    Departments & Squads
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Select the initial functional groups you wish to configure.
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    "Engineering",
                    "Product & Design",
                    "Operations",
                    "Marketing & Growth",
                    "Customer Success",
                  ].map((team) => {
                    const isSelected = selectedTeams.includes(team);
                    return (
                      <div
                        key={team}
                        onClick={() => toggleTeam(team)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all",
                          isSelected
                            ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]/20 text-[var(--color-text-primary)] font-semibold"
                            : "border-[var(--color-border-secondary)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]",
                        )}
                      >
                        <span className="text-xs">{team}</span>
                        {isSelected && <Check className="h-4 w-4 text-[var(--color-accent)]" />}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" size="sm" onClick={handleBack} className="text-xs">
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90"
                  >
                    Next: Invite Teammates →
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5: INVITE */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                    Invite Initial Teammates
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Paste emails separated by commas or new lines. You can skip this step.
                  </p>
                </div>

                <div>
                  <textarea
                    rows={4}
                    placeholder="sarah@company.com, david@company.com"
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-2.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-hidden"
                  />
                  <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
                    Invited members will receive a magic sign-in link to join your workspace.
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" size="sm" onClick={handleBack} className="text-xs">
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90"
                  >
                    {inviteEmails.trim() ? "Send Invites & Finish →" : "Skip & Finish →"}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 6: COMPLETE */}
            {currentStep === 6 && (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-xs">
                  <Rocket className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
                    Workspace Ready!
                  </h2>
                  <p className="mt-2 text-xs text-[var(--color-text-secondary)] sm:text-sm leading-relaxed">
                    <strong>{orgName}</strong> is initialized. Your team dashboard, project portfolio, backlogs, and time trackers are configured and active.
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-tertiary)]">Workspace URL:</span>
                    <span className="font-mono text-[var(--color-accent)] font-semibold">
                      orbit.app/{orgSlug}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-tertiary)]">Configured Squads:</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {selectedTeams.length} squads
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-tertiary)]">Timezone:</span>
                    <span className="text-[var(--color-text-primary)]">{timezone}</span>
                  </div>
                </div>

                <Button
                  onClick={handleNext}
                  className="w-full bg-[var(--color-accent)] text-white text-xs font-semibold py-2.5 hover:opacity-90 shadow-xs"
                >
                  Enter Workspace Dashboard →
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
