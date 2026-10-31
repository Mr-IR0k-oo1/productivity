"use client";

import { useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  Flame,
  Layers,
  MoreVertical,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Workflow,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AutomationRule = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: {
    event: string;
    details: string;
  };
  condition?: {
    field: string;
    operator: string;
    value: string;
  };
  action: {
    type: string;
    target: string;
  };
  lastRun?: {
    timestamp: string;
    status: "success" | "failed";
  };
  runCount: number;
  category: "tasks" | "projects" | "notifications" | "devops";
};

const initialRules: AutomationRule[] = [
  {
    id: "auto-1",
    name: "Urgent Task Escalation",
    description: "Instantly notify the engineering leads channel when an urgent blocker is filed.",
    isActive: true,
    trigger: {
      event: "Task Created / Updated",
      details: "Priority changes to Urgent or Blocker",
    },
    condition: {
      field: "priority",
      operator: "in",
      value: "urgent, blocker",
    },
    action: {
      type: "Send Slack Notification",
      target: "#incidents-and-alerts",
    },
    lastRun: {
      timestamp: "18 minutes ago",
      status: "success",
    },
    runCount: 142,
    category: "tasks",
  },
  {
    id: "auto-2",
    name: "Sprint Incomplete Task Rollover",
    description: "Automatically move unfinished backlog issues into the upcoming sprint upon sprint completion.",
    isActive: true,
    trigger: {
      event: "Sprint Completed",
      details: "Sprint state transitions to Closed",
    },
    condition: {
      field: "status",
      operator: "!=",
      value: "done",
    },
    action: {
      type: "Reassign Sprint",
      target: "Next Active Sprint",
    },
    lastRun: {
      timestamp: "Yesterday, 6:00 PM",
      status: "success",
    },
    runCount: 24,
    category: "projects",
  },
  {
    id: "auto-3",
    name: "Sync Linear PRs to Backlog",
    description: "Cross-link open GitHub pull requests to matching Orbit task tickets.",
    isActive: true,
    trigger: {
      event: "GitHub Pull Request Opened",
      details: "PR branch or title contains #ORB-*",
    },
    action: {
      type: "Update Task Status & Link PR",
      target: "In Review",
    },
    lastRun: {
      timestamp: "2 hours ago",
      status: "success",
    },
    runCount: 512,
    category: "devops",
  },
  {
    id: "auto-4",
    name: "Weekly Monday Executive Digest",
    description: "Synthesize team velocity and OKR status into an executive summary email.",
    isActive: false,
    trigger: {
      event: "Scheduled Cron",
      details: "Every Monday at 09:00 AM UTC",
    },
    action: {
      type: "Generate & Email Report",
      target: "executives@company.com",
    },
    lastRun: {
      timestamp: "5 days ago",
      status: "success",
    },
    runCount: 18,
    category: "notifications",
  },
  {
    id: "auto-5",
    name: "Auto-Archive Completed Milestone Tasks",
    description: "Archive tasks 14 days after milestone completion to maintain high board density.",
    isActive: true,
    trigger: {
      event: "Task Idle in Done",
      details: "Task in Done status for > 14 days",
    },
    action: {
      type: "Archive Record",
      target: "Workspace Cold Storage",
    },
    lastRun: {
      timestamp: "3 days ago",
      status: "failed",
    },
    runCount: 89,
    category: "tasks",
  },
];

type ExecutionLog = {
  id: string;
  ruleName: string;
  triggerEvent: string;
  timestamp: string;
  durationMs: number;
  status: "success" | "failed";
  details: string;
};

const mockLogs: ExecutionLog[] = [
  {
    id: "log-1",
    ruleName: "Urgent Task Escalation",
    triggerEvent: "Task #ORB-204 marked Urgent",
    timestamp: "18 minutes ago",
    durationMs: 145,
    status: "success",
    details: "Dispatched payload to webhook Slack #incidents-and-alerts",
  },
  {
    id: "log-2",
    ruleName: "Sync Linear PRs to Backlog",
    triggerEvent: "PR #89 opened on repo core-api",
    timestamp: "2 hours ago",
    durationMs: 230,
    status: "success",
    details: "Attached PR branch link to task #ORB-198",
  },
  {
    id: "log-3",
    ruleName: "Auto-Archive Completed Milestone Tasks",
    triggerEvent: "Cron sweep (24 items scanned)",
    timestamp: "3 days ago",
    durationMs: 820,
    status: "failed",
    details: "Connection timeout while writing archive batch to Cold Storage",
  },
  {
    id: "log-4",
    ruleName: "Weekly Monday Executive Digest",
    triggerEvent: "Cron scheduled 09:00 AM UTC",
    timestamp: "5 days ago",
    durationMs: 1420,
    status: "success",
    details: "Generated metrics PDF and delivered to 4 recipients",
  },
];

const recipes = [
  {
    title: "Linear & GitHub Issue Bridge",
    category: "DevOps",
    description: "Automatically move tasks to In Progress when a branch with the ticket ID is created in Git.",
    trigger: "Git branch created",
    action: "Move task to In Progress",
  },
  {
    title: "Stale Task Reminder",
    category: "Productivity",
    description: "Ping the assignee if a task has remained in 'In Progress' with no commits or comments for 4 days.",
    trigger: "Inactivity > 4 days",
    action: "Send direct message reminder",
  },
  {
    title: "New Team Member Workspace Tour",
    category: "People",
    description: "Assign onboarding checklist tasks and invite to project channels upon account acceptance.",
    trigger: "User accepts invitation",
    action: "Generate onboarding task bundle",
  },
  {
    title: "High-Confidence Customer Idea Escalation",
    category: "Strategy",
    description: "When an idea on the board reaches 10 customer upvotes, convert it into an engineering RFC task.",
    trigger: "Idea reaches 10 upvotes",
    action: "Create Task in Product Backlog",
  },
];

export default function AutomationsPage() {
  const [rules, setRules] = useState<AutomationRule[]>(initialRules);
  const [activeTab, setActiveTab] = useState<"workflows" | "logs" | "recipes">("workflows");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New rule form state
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleDescription, setNewRuleDescription] = useState("");
  const [newTriggerEvent, setNewTriggerEvent] = useState("Task Created");
  const [newActionType, setNewActionType] = useState("Send Slack Notification");
  const [newActionTarget, setNewActionTarget] = useState("#general");

  const toggleRuleActive = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const newRule: AutomationRule = {
      id: `auto-${Date.now()}`,
      name: newRuleName,
      description: newRuleDescription || "Automated team productivity workflow.",
      isActive: true,
      trigger: {
        event: newTriggerEvent,
        details: "Evaluates on state mutation",
      },
      action: {
        type: newActionType,
        target: newActionTarget,
      },
      runCount: 0,
      category: "tasks",
    };

    setRules([newRule, ...rules]);
    setIsModalOpen(false);
    setNewRuleName("");
    setNewRuleDescription("");
  };

  const filteredRules = rules.filter((rule) => {
    const matchesCategory = categoryFilter === "all" || rule.category === categoryFilter;
    const matchesQuery =
      !searchQuery ||
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const activeCount = rules.filter((r) => r.isActive).length;
  const totalRuns = rules.reduce((acc, r) => acc + r.runCount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Workflow Automations
            </h1>
            <Badge variant="outline" className="text-xs font-semibold py-0.5 px-2">
              B2B Enterprise
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Automate routine project operations, alert channels, and cross-platform sync.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="gap-1.5 rounded-xl bg-[var(--color-accent)] font-medium text-white hover:opacity-90 active:scale-95 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Automation</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                Active Rules
              </p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                {activeCount} <span className="text-xs font-normal text-[var(--color-text-tertiary)]">/ {rules.length} total</span>
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                Monthly Runs
              </p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                {totalRuns.toLocaleString()}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                Success Reliability
              </p>
              <p className="text-2xl font-bold text-emerald-500 mt-1">
                99.8%
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                Est. Time Saved
              </p>
              <p className="text-2xl font-bold text-[var(--color-accent)] mt-1">
                ~46 hrs <span className="text-xs font-normal text-[var(--color-text-tertiary)]">/ mo</span>
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-[var(--color-border-secondary)] pb-1">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("workflows")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors",
              activeTab === "workflows"
                ? "bg-[var(--color-surface-strong)] text-[var(--color-text-primary)] shadow-xs"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            Configured Workflows ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors",
              activeTab === "logs"
                ? "bg-[var(--color-surface-strong)] text-[var(--color-text-primary)] shadow-xs"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            Audit & Execution Logs
          </button>
          <button
            onClick={() => setActiveTab("recipes")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors",
              activeTab === "recipes"
                ? "bg-[var(--color-surface-strong)] text-[var(--color-text-primary)] shadow-xs"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            Recipe Library
          </button>
        </div>
      </div>

      {/* Tab: Workflows */}
      {activeTab === "workflows" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                <Input
                  placeholder="Filter automation rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-[var(--color-surface-strong)] border-[var(--color-border-secondary)]"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-2.5 text-xs text-[var(--color-text-secondary)] outline-hidden"
              >
                <option value="all">All Categories</option>
                <option value="tasks">Tasks & Backlog</option>
                <option value="projects">Projects & Sprints</option>
                <option value="notifications">Notifications & Email</option>
                <option value="devops">Developer & Integrations</option>
              </select>
            </div>

            <p className="text-xs text-[var(--color-text-tertiary)]">
              Showing {filteredRules.length} rules
            </p>
          </div>

          {/* Rules List */}
          <div className="space-y-3">
            {filteredRules.map((rule) => (
              <Card
                key={rule.id}
                className={cn(
                  "rounded-2xl border transition-all hover:shadow-xs",
                  rule.isActive
                    ? "border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]"
                    : "border-[var(--color-border-secondary)]/50 bg-[var(--color-surface-strong)]/40 opacity-70"
                )}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-bold tracking-tight text-[var(--color-text-primary)]">
                          {rule.name}
                        </h3>
                        <Badge
                          variant={rule.isActive ? "default" : "outline"}
                          className={cn(
                            "text-[10px] font-semibold py-0 px-2",
                            rule.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : ""
                          )}
                        >
                          {rule.isActive ? "Active" : "Paused"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold py-0 px-1.5 text-[var(--color-text-tertiary)]">
                          {rule.category}
                        </Badge>
                      </div>

                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {rule.description}
                      </p>

                      {/* Execution Diagram */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                        <div className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-2.5 py-1 text-[var(--color-text-secondary)]">
                          <span className="font-semibold text-emerald-500 text-[10px] uppercase">WHEN</span>
                          <span className="font-medium text-[var(--color-text-primary)]">{rule.trigger.event}</span>
                        </div>

                        {rule.condition && (
                          <>
                            <ArrowRight className="h-3 w-3 text-[var(--color-text-tertiary)]" />
                            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-2.5 py-1 text-[var(--color-text-secondary)]">
                              <span className="font-semibold text-amber-500 text-[10px] uppercase">IF</span>
                              <span className="font-medium text-[var(--color-text-primary)]">
                                {rule.condition.field} {rule.condition.operator} &quot;{rule.condition.value}&quot;
                              </span>
                            </div>
                          </>
                        )}

                        <ArrowRight className="h-3 w-3 text-[var(--color-text-tertiary)]" />
                        <div className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-2.5 py-1 text-[var(--color-text-secondary)]">
                          <span className="font-semibold text-blue-500 text-[10px] uppercase">THEN</span>
                          <span className="font-medium text-[var(--color-text-primary)]">{rule.action.type}</span>
                          <span className="text-[var(--color-text-tertiary)]">→ {rule.action.target}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions & State */}
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:justify-between shrink-0">
                      <button
                        onClick={() => toggleRuleActive(rule.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                        title={rule.isActive ? "Pause workflow" : "Enable workflow"}
                      >
                        {rule.isActive ? (
                          <ToggleRight className="h-6 w-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-[var(--color-text-tertiary)]" />
                        )}
                        <span>{rule.isActive ? "Enabled" : "Disabled"}</span>
                      </button>

                      <div className="text-right text-[11px] text-[var(--color-text-tertiary)]">
                        {rule.lastRun ? (
                          <span>Last run {rule.lastRun.timestamp}</span>
                        ) : (
                          <span>Never executed</span>
                        )}
                        <p className="font-medium text-[var(--color-text-secondary)] mt-0.5">
                          {rule.runCount} total runs
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Audit & Execution Logs */}
      {activeTab === "logs" && (
        <Card className="rounded-2xl border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
          <CardHeader className="p-4 sm:p-5 border-b border-[var(--color-border-secondary)]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[var(--color-text-primary)]">
                  Recent Automation Activity
                </CardTitle>
                <CardDescription className="text-xs text-[var(--color-text-secondary)]">
                  Live execution traces with timing diagnostics and status codes.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Retention: 30 days
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border-secondary)] bg-[var(--color-surface)]/50 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    <th className="px-4 py-3">Rule Name</th>
                    <th className="px-4 py-3">Trigger Event</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Trace Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-secondary)]">
                  {mockLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                      <td className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">
                        {log.ruleName}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                        {log.triggerEvent}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={log.status === "success" ? "default" : "error"}
                          className={cn(
                            "text-[10px] font-semibold py-0 px-2 capitalize",
                            log.status === "success"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : ""
                          )}
                        >
                          {log.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-[var(--color-text-tertiary)]">
                        {log.durationMs}ms
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-tertiary)]">
                        {log.timestamp}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)] truncate max-w-xs font-mono text-[11px]">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Recipe Library */}
      {activeTab === "recipes" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {recipes.map((recipe, idx) => (
            <Card
              key={idx}
              className="rounded-2xl border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] hover:shadow-xs transition-shadow"
            >
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge variant="outline" className="text-[10px] font-semibold">
                      {recipe.category}
                    </Badge>
                    <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> One-Click Install
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {recipe.description}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-2.5 text-xs space-y-1">
                  <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
                    <span className="font-semibold text-emerald-500 text-[10px]">WHEN:</span>
                    <span>{recipe.trigger}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
                    <span className="font-semibold text-blue-500 text-[10px]">THEN:</span>
                    <span>{recipe.action}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newRule: AutomationRule = {
                      id: `auto-${Date.now()}`,
                      name: recipe.title,
                      description: recipe.description,
                      isActive: true,
                      trigger: { event: recipe.trigger, details: "Preset Recipe" },
                      action: { type: recipe.action, target: "Configured channel" },
                      runCount: 0,
                      category: "tasks",
                    };
                    setRules([newRule, ...rules]);
                    setActiveTab("workflows");
                  }}
                  className="w-full text-xs font-semibold gap-1.5 rounded-xl border-[var(--color-border-secondary)] hover:bg-[var(--color-surface-hover)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Use This Recipe</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Automation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
              Create Automation Workflow
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              Set trigger criteria, conditions, and automated executions.
            </p>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">
                  Workflow Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Notify on High-Priority Blocker"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="text-xs bg-[var(--color-surface-strong)] border-[var(--color-border-secondary)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">
                  Description
                </label>
                <Input
                  placeholder="Brief note about what this automation accomplishes..."
                  value={newRuleDescription}
                  onChange={(e) => setNewRuleDescription(e.target.value)}
                  className="text-xs bg-[var(--color-surface-strong)] border-[var(--color-border-secondary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">
                    Trigger (WHEN)
                  </label>
                  <select
                    value={newTriggerEvent}
                    onChange={(e) => setNewTriggerEvent(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-2.5 text-xs text-[var(--color-text-primary)] outline-hidden"
                  >
                    <option value="Task Created">Task Created</option>
                    <option value="Task Status Changed">Task Status Changed</option>
                    <option value="Task Due in 24h">Task Due in 24h</option>
                    <option value="Milestone Completed">Milestone Completed</option>
                    <option value="Sprint Ended">Sprint Ended</option>
                    <option value="GitHub PR Merged">GitHub PR Merged</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">
                    Action (THEN)
                  </label>
                  <select
                    value={newActionType}
                    onChange={(e) => setNewActionType(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-2.5 text-xs text-[var(--color-text-primary)] outline-hidden"
                  >
                    <option value="Send Slack Notification">Send Slack Notification</option>
                    <option value="Assign Lead Reviewer">Assign Lead Reviewer</option>
                    <option value="Update Task Status">Update Task Status</option>
                    <option value="Send Email Alert">Send Email Alert</option>
                    <option value="Trigger Custom Webhook">Trigger Custom Webhook</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">
                  Target Destination / Channel
                </label>
                <Input
                  placeholder="e.g. #engineering, https://api.corp.internal/webhook, or lead@acme.com"
                  value={newActionTarget}
                  onChange={(e) => setNewActionTarget(e.target.value)}
                  className="text-xs bg-[var(--color-surface-strong)] border-[var(--color-border-secondary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border-secondary)]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs border-[var(--color-border-secondary)]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-[var(--color-accent)] text-white hover:opacity-90 font-semibold"
                >
                  Save & Activate Rule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
