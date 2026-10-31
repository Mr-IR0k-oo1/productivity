"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Filter,
  Flame,
  Layers,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import {
  useCreateGoalMutation,
  useGoalsQuery,
  type GoalCategory,
  type GoalDTO,
  type GoalStatus,
  type KeyResultDTO,
} from "@/hooks/useGoals";
import { useWorkspaceMembersQuery } from "@/hooks/useWorkspaceMembers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function GoalsPage() {
  const { data: goals = [], isLoading } = useGoalsQuery();
  const { data: members = [] } = useWorkspaceMembersQuery();
  const createGoal = useCreateGoalMutation();

  const [activeCategory, setActiveCategory] = useState<"all" | GoalCategory>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Q4 2026");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("company");
  const [owner, setOwner] = useState("Alex Chen");
  const [period, setPeriod] = useState("Q4 2026");
  const [keyResults, setKeyResults] = useState<Array<{ title: string; target: number; unit: string }>>([
    { title: "", target: 10, unit: "units" },
  ]);

  const onTrackCount = useMemo(() => goals.filter((g) => g.status === "on_track").length, [goals]);
  const atRiskCount = useMemo(() => goals.filter((g) => g.status === "at_risk").length, [goals]);
  const completedCount = useMemo(() => goals.filter((g) => g.status === "completed").length, [goals]);

  const filteredGoals = useMemo(() => {
    let list = [...goals];

    if (activeCategory !== "all") {
      list = list.filter((g) => g.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.owner.toLowerCase().includes(q),
      );
    }

    return list;
  }, [goals, activeCategory, searchQuery]);

  const handleAddKr = () => {
    setKeyResults((prev) => [...prev, { title: "", target: 10, unit: "units" }]);
  };

  const handleRemoveKr = (index: number) => {
    setKeyResults((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validKrs: KeyResultDTO[] = keyResults
      .filter((kr) => kr.title.trim())
      .map((kr, idx) => ({
        id: `kr-${Date.now()}-${idx}`,
        title: kr.title.trim(),
        current: 0,
        target: Number(kr.target) || 1,
        unit: kr.unit.trim() || "%",
        progress: 0,
      }));

    await createGoal.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      category,
      owner,
      period,
      status: "on_track",
      progress: 0,
      keyResults: validKrs,
    });

    setIsModalOpen(false);
    setTitle("");
    setDescription("");
    setKeyResults([{ title: "", target: 10, unit: "units" }]);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
            Goals & OKRs
          </h1>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">
            Align company strategy, squad key results, and measurable progress metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="h-8 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-2.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-hidden"
          >
            <option value="Q4 2026">Q4 2026 (Oct – Dec)</option>
            <option value="Q3 2026">Q3 2026 (Jul – Sep)</option>
            <option value="Annual 2026">Annual 2026</option>
          </select>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="gap-1.5 bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>New Objective</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
              <span>Total Objectives</span>
              <Target className="h-4 w-4 text-[var(--color-accent)]" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {goals.length}
            </p>
            <span className="text-[11px] text-[var(--color-text-tertiary)]">{selectedPeriod}</span>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
              <span>On Track</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-500">{onTrackCount}</p>
            <span className="text-[11px] text-[var(--color-text-tertiary)]">Pacing to target</span>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
              <span>At Risk</span>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-amber-500">{atRiskCount}</p>
            <span className="text-[11px] text-[var(--color-text-tertiary)]">Requires attention</span>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
              <span>Completed</span>
              <Sparkles className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-blue-500">{completedCount}</p>
            <span className="text-[11px] text-[var(--color-text-tertiary)]">100% achieved</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border-secondary)] pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
              activeCategory === "all"
                ? "bg-[var(--color-accent)] text-white shadow-xs"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
            )}
          >
            All Goals ({goals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("company")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
              activeCategory === "company"
                ? "bg-[var(--color-accent)] text-white shadow-xs"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
            )}
          >
            Company Objectives
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("team")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
              activeCategory === "team"
                ? "bg-[var(--color-accent)] text-white shadow-xs"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
            )}
          >
            Team OKRs
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("personal")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
              activeCategory === "personal"
                ? "bg-[var(--color-accent)] text-white shadow-xs"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
            )}
          >
            Personal Growth
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <Input
            type="text"
            placeholder="Search goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-[var(--color-surface-strong)]"
          />
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]/40 py-16 text-center">
            <Target className="h-10 w-10 text-[var(--color-accent)]" />
            <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">
              No Objectives Found
            </h3>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)] max-w-sm">
              Create an overarching company objective to track milestones, key results, and squad alignment.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 gap-1.5 bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Objective</span>
            </Button>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const statusColor =
              goal.status === "completed"
                ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/10"
                : goal.status === "on_track"
                ? "border-blue-500/20 text-blue-500 bg-blue-500/10"
                : "border-amber-500/20 text-amber-500 bg-amber-500/10";

            return (
              <div
                key={goal.id}
                className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-5 shadow-xs hover:border-[var(--color-border-tertiary)] transition-all"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/goals/${goal.id}`}
                        className="text-sm font-bold tracking-tight text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
                      >
                        {goal.title}
                      </Link>
                      <Badge variant="outline" className={cn("text-[10px] capitalize font-semibold py-0 px-2", statusColor)}>
                        {goal.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="default" className="text-[10px] capitalize font-medium py-0 px-1.5">
                        {goal.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                      {goal.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">
                        {goal.progress}%
                      </span>
                      <p className="text-[10px] text-[var(--color-text-tertiary)]">Overall Progress</p>
                    </div>
                    <div className="h-2 w-24 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Key Results Breakdown */}
                {goal.keyResults.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-[var(--color-border-secondary)] pt-3">
                    <div className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                      Key Results ({goal.keyResults.length})
                    </div>
                    <div className="space-y-2">
                      {goal.keyResults.map((kr) => (
                        <div
                          key={kr.id}
                          className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-2.5 text-xs"
                        >
                          <span className="font-medium text-[var(--color-text-primary)] flex-1 truncate">
                            {kr.title}
                          </span>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono text-[11px] text-[var(--color-text-secondary)]">
                              {kr.current} / {kr.target} {kr.unit}
                            </span>
                            <div className="h-1.5 w-20 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                              <div
                                className="h-full bg-[var(--color-accent)] rounded-full"
                                style={{ width: `${kr.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)] w-8 text-right">
                              {kr.progress}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer metadata */}
                <div className="mt-4 flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)] pt-2 border-t border-[var(--color-border-secondary)]/60">
                  <div className="flex items-center gap-3">
                    <span>Owner: <strong>{goal.owner}</strong></span>
                    <span>•</span>
                    <span>Period: <strong>{goal.period}</strong></span>
                  </div>
                  <Link
                    href={`/goals/${goal.id}`}
                    className="font-medium text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Check-in details</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Objective Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <Target className="h-4 w-4" />
                </div>
                <Dialog.Title className="text-base font-semibold text-[var(--color-text-primary)]">
                  Create Objective & OKR
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <Dialog.Description className="text-xs text-[var(--color-text-secondary)] mb-4">
              Set a qualitative objective and attach measurable key results with target metrics.
            </Dialog.Description>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Objective Title *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Expand European Enterprise Market Presence"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xs bg-[var(--color-surface-strong)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Context & Strategic Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Why this objective matters and how it aligns with company vision..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-2.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GoalCategory)}
                    className="w-full rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-hidden"
                  >
                    <option value="company">Company</option>
                    <option value="team">Team</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Cadence / Period
                  </label>
                  <Input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="text-xs bg-[var(--color-surface-strong)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Owner
                  </label>
                  <Input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="text-xs bg-[var(--color-surface-strong)]"
                  />
                </div>
              </div>

              {/* Key Results Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                    Measurable Key Results
                  </span>
                  <button
                    type="button"
                    onClick={handleAddKr}
                    className="text-xs font-medium text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Key Result</span>
                  </button>
                </div>

                {keyResults.map((kr, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-2.5"
                  >
                    <Input
                      type="text"
                      placeholder="e.g. Sign 15 enterprise logos"
                      value={kr.title}
                      onChange={(e) => {
                        const copy = [...keyResults];
                        copy[index].title = e.target.value;
                        setKeyResults(copy);
                      }}
                      className="text-xs bg-[var(--color-surface)] flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Target"
                      value={kr.target}
                      onChange={(e) => {
                        const copy = [...keyResults];
                        copy[index].target = Number(e.target.value);
                        setKeyResults(copy);
                      }}
                      className="text-xs bg-[var(--color-surface)] w-20"
                    />
                    <Input
                      type="text"
                      placeholder="Unit"
                      value={kr.unit}
                      onChange={(e) => {
                        const copy = [...keyResults];
                        copy[index].unit = e.target.value;
                        setKeyResults(copy);
                      }}
                      className="text-xs bg-[var(--color-surface)] w-20"
                    />
                    {keyResults.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveKr(index)}
                        className="p-1 text-[var(--color-text-tertiary)] hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2.5 pt-4">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" size="sm" className="text-xs">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  disabled={createGoal.isPending || !title.trim()}
                  className="bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90 shadow-xs"
                >
                  {createGoal.isPending ? "Creating..." : "Create Objective"}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
