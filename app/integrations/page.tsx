"use client";

import { useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  Code2,
  Cpu,
  ExternalLink,
  Github,
  Globe,
  Layers,
  Link2,
  Lock,
  MessageSquare,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type IntegrationItem = {
  id: string;
  name: string;
  category: "communication" | "developer" | "productivity" | "calendar" | "webhooks";
  description: string;
  iconBg: string;
  iconColor: string;
  status: "connected" | "disconnected" | "syncing";
  lastSync?: string;
  installedBy?: string;
  features: string[];
};

const initialIntegrations: IntegrationItem[] = [
  {
    id: "slack",
    name: "Slack",
    category: "communication",
    description: "Receive task notifications, trigger bot slash commands, and broadcast sprint summaries to channels.",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    status: "connected",
    lastSync: "3 mins ago",
    installedBy: "alex@company.com",
    features: [
      "Task assignment & priority alert webhooks",
      "Interactive /orbit command in Slack",
      "Daily asynchronous standup digests",
    ],
  },
  {
    id: "github",
    name: "GitHub",
    category: "developer",
    description: "Link commits, pull requests, and automated branch previews directly to Orbit tasks.",
    iconBg: "bg-slate-500/10",
    iconColor: "text-slate-200",
    status: "connected",
    lastSync: "12 mins ago",
    installedBy: "sarah@company.com",
    features: [
      "Automatic ticket resolution on PR merge",
      "Branch name suggestion (#ORB-*)",
      "CI/CD build pipeline status chips",
    ],
  },
  {
    id: "linear",
    name: "Linear",
    category: "developer",
    description: "Two-way synchronization for engineering teams migrating or mirroring backlog cycles.",
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-400",
    status: "disconnected",
    features: [
      "Bidirectional status & estimation sync",
      "Shared triage inbox bridge",
      "Milestone and project mapping",
    ],
  },
  {
    id: "gcal",
    name: "Google Calendar",
    category: "calendar",
    description: "Sync company meetings, sprint reviews, and automatically carve out deep focus blocks in your day.",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    status: "connected",
    lastSync: "Just now",
    installedBy: "alex@company.com",
    features: [
      "Auto-scheduling of focus timer blocks",
      "Two-way calendar event sync",
      "Time tracker timeline attribution",
    ],
  },
  {
    id: "figma",
    name: "Figma",
    category: "productivity",
    description: "Embed live interactive design files into Orbit documents, tasks, and flowchart boards.",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    status: "disconnected",
    features: [
      "Rich interactive canvas embeds in Docs",
      "Component link previews in Task descriptions",
      "Design revision alerts",
    ],
  },
  {
    id: "webhooks",
    name: "Custom Webhooks (REST)",
    category: "webhooks",
    description: "Outbound cryptographic HTTP POST callbacks signed with HMAC-SHA256 for internal corporate tooling.",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    status: "connected",
    lastSync: "1 hour ago",
    installedBy: "system",
    features: [
      "Signed payload deliveries with retry backoff",
      "Granular event subscriptions",
      "Full request/response trace logs",
    ],
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(initialIntegrations);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<IntegrationItem | null>(null);

  // Configuration modal state
  const [apiKey, setApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const filteredIntegrations = integrations.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  const handleOpenConfig = (item: IntegrationItem) => {
    setSelectedItem(item);
    setApiKey(item.status === "connected" ? "••••••••••••••••••••••••••••" : "");
    setWebhookUrl(item.status === "connected" ? "https://hooks.orbit.internal/v1/dispatch" : "");
  };

  const handleSaveConfig = () => {
    if (!selectedItem) return;
    setIsConnecting(true);

    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? { ...i, status: "connected", lastSync: "Just now" }
            : i
        )
      );
      setIsConnecting(false);
      setSelectedItem(null);
    }, 600);
  };

  const handleDisconnect = () => {
    if (!selectedItem) return;
    setIntegrations((prev) =>
      prev.map((i) => (i.id === selectedItem.id ? { ...i, status: "disconnected" } : i))
    );
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Integrations & Connected Apps
            </h1>
            <Badge variant="outline" className="text-xs font-semibold py-0.5 px-2">
              Ecosystem
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Connect Orbit with the developer, communication, and calendar tools your company relies on.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs font-medium py-1 px-3">
            {connectedCount} of {integrations.length} Services Connected
          </Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
            <Input
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-[var(--color-surface-strong)] border-[var(--color-border-secondary)]"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto py-1">
            {[
              { id: "all", label: "All" },
              { id: "communication", label: "Communication" },
              { id: "developer", label: "Developer & Code" },
              { id: "calendar", label: "Calendar" },
              { id: "productivity", label: "Productivity & Design" },
              { id: "webhooks", label: "Webhooks" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap",
                  selectedCategory === cat.id
                    ? "bg-[var(--color-accent)] text-white shadow-xs font-semibold"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredIntegrations.map((item) => (
          <Card
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-5 hover:shadow-xs transition-all"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl font-bold shadow-xs",
                      item.iconBg,
                      item.iconColor
                    )}
                  >
                    {item.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                      {item.name}
                    </h3>
                    <span className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)]">
                      {item.category}
                    </span>
                  </div>
                </div>

                <Badge
                  variant={item.status === "connected" ? "default" : "outline"}
                  className={cn(
                    "text-[10px] font-semibold py-0 px-2 capitalize",
                    item.status === "connected"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "text-[var(--color-text-tertiary)]"
                  )}
                >
                  {item.status}
                </Badge>
              </div>

              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
                {item.description}
              </p>

              {/* Feature bullet list */}
              <div className="space-y-1.5 border-t border-[var(--color-border-secondary)] pt-3 mb-4">
                {item.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                    <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--color-border-secondary)] pt-3 text-[11px] text-[var(--color-text-tertiary)]">
              <span>{item.lastSync ? `Synced ${item.lastSync}` : "Not connected"}</span>
              <Button
                size="sm"
                variant={item.status === "connected" ? "outline" : "default"}
                onClick={() => handleOpenConfig(item)}
                className={cn(
                  "h-7 text-xs font-semibold rounded-lg",
                  item.status === "connected"
                    ? "border-[var(--color-border-secondary)] hover:bg-[var(--color-surface-hover)]"
                    : "bg-[var(--color-accent)] text-white hover:opacity-90"
                )}
              >
                {item.status === "connected" ? "Configure" : "Connect"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Configuration Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm",
                  selectedItem.iconBg,
                  selectedItem.iconColor
                )}
              >
                {selectedItem.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  Configure {selectedItem.name}
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Manage authentication and dispatch permissions.
                </p>
              </div>
            </div>

            <div className="space-y-4 my-4">
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">
                  API Key / OAuth Secret
                </label>
                <Input
                  type="password"
                  placeholder="Enter token or OAuth secret"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="text-xs bg-[var(--color-surface-strong)] border-[var(--color-border-secondary)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">
                  Webhook Dispatch URL
                </label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="text-xs bg-[var(--color-surface-strong)] border-[var(--color-border-secondary)]"
                />
              </div>

              <div className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-3 text-xs space-y-2">
                <span className="font-semibold text-[var(--color-text-primary)] block">
                  Permissions Granted:
                </span>
                <div className="space-y-1 text-[11px] text-[var(--color-text-secondary)]">
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span>Read task & project titles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span>Send outgoing event triggers</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-secondary)]">
              {selectedItem.status === "connected" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDisconnect}
                  className="text-xs text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
                >
                  Disconnect
                </Button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedItem(null)}
                  className="text-xs border-[var(--color-border-secondary)]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={isConnecting}
                  className="text-xs bg-[var(--color-accent)] text-white hover:opacity-90 font-semibold"
                >
                  {isConnecting ? "Validating..." : "Save Connection"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
