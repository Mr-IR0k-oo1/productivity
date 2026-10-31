"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Flame,
  MessageSquare,
  Plus,
  Save,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  User,
} from "lucide-react";

import {
  useGoalQuery,
  useUpdateKeyResultMutation,
  type GoalStatus,
} from "@/hooks/useGoals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const goalId = resolvedParams.id;

  const { data: goal, isLoading, isError } = useGoalQuery(goalId);
  const updateKr = useUpdateKeyResultMutation();

  const [activeKrId, setActiveKrId] = useState<string | null>(null);
  const [newValue, setNewValue] = useState<number>(0);
  const [note, setNote] = useState("");
  const [checkInLog, setCheckInLog] = useState<Array<{ date: string; message: string; author: string }>>([
    {
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      message: "Quarterly progress check-in: 72% overall completion achieved.",
      author: "Alex Chen",
    },
  ]);

  const handleCheckIn = async (krId: string) => {
    await updateKr.mutateAsync({
      goalId,
      krId,
      current: Number(newValue),
    });

    if (note.trim()) {
      setCheckInLog((prev) => [
        {
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          message: note.trim(),
          author: goal?.owner || "Team Member",
        },
        ...prev,
      ]);
      setNote("");
    }
    setActiveKrId(null);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !goal) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <Target className="mx-auto h-10 w-10 text-[var(--color-accent)]" />
        <h2 className="mt-3 text-lg font-bold text-[var(--color-text-primary)]">Objective Not Found</h2>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          The requested goal does not exist or has been archived.
        </p>
        <Link href="/goals">
          <Button variant="outline" size="sm" className="mt-4 text-xs">
            Back to Goals
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Back Link */}
      <Link
        href="/goals"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Goals & OKRs</span>
      </Link>

      {/* Header Banner */}
      <div className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
                {goal.title}
              </h1>
              <Badge variant="outline" className="text-[10px] capitalize font-semibold py-0 px-2">
                {goal.status.replace("_", " ")}
              </Badge>
              <Badge variant="default" className="text-[10px] capitalize font-medium py-0 px-1.5">
                {goal.category}
              </Badge>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {goal.description}
            </p>
          </div>

          <div className="min-w-[170px] rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-3 text-right">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-[var(--color-text-tertiary)]">Achievement</span>
              <span className="font-bold text-[var(--color-text-primary)]">{goal.progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">
              Period: {goal.period}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-[var(--color-border-secondary)] pt-3 text-xs text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>Owner: <strong className="text-[var(--color-text-primary)]">{goal.owner}</strong></span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Cadence: <strong className="text-[var(--color-text-primary)]">{goal.period}</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Column: Key Results Check-in */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[var(--color-text-primary)]">
                Key Results & Target Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {goal.keyResults.map((kr) => {
                const isEditing = activeKrId === kr.id;

                return (
                  <div
                    key={kr.id}
                    className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">
                          {kr.title}
                        </h4>
                        <span className="text-[11px] text-[var(--color-text-tertiary)]">
                          Target: {kr.target} {kr.unit}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-[var(--color-accent)]">
                          {kr.progress}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300"
                        style={{ width: `${kr.progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-mono text-[11px] text-[var(--color-text-secondary)]">
                        Current: <strong>{kr.current}</strong> / {kr.target} {kr.unit}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveKrId(isEditing ? null : kr.id);
                          setNewValue(kr.current);
                        }}
                        className="h-7 text-[11px]"
                      >
                        {isEditing ? "Close" : "Check in value"}
                      </Button>
                    </div>

                    {/* Check in Drawer */}
                    {isEditing && (
                      <div className="mt-3 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-surface-strong)] p-3 space-y-3 animate-in fade-in">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-medium text-[var(--color-text-secondary)] shrink-0">
                            New Metric Value ({kr.unit}):
                          </label>
                          <Input
                            type="number"
                            value={newValue}
                            onChange={(e) => setNewValue(Number(e.target.value))}
                            className="h-7 text-xs bg-[var(--color-surface)] w-28"
                          />
                        </div>

                        <Input
                          type="text"
                          placeholder="Optional check-in note (e.g. Launched new marketing campaign)..."
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="h-7 text-xs bg-[var(--color-surface)]"
                        />

                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(kr.id)}
                            disabled={updateKr.isPending}
                            className="h-7 text-xs bg-[var(--color-accent)] text-white hover:opacity-90"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            <span>Save Check-in</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Check-in Activity Log */}
        <div className="space-y-6">
          <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[var(--color-text-primary)]">
                Check-in Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {checkInLog.map((log, i) => (
                <div key={i} className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[var(--color-text-tertiary)]">
                    <span className="font-semibold text-[var(--color-text-primary)]">{log.author}</span>
                    <span>{log.date}</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                    {log.message}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
