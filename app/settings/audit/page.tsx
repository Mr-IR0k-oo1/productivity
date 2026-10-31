"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Info,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuditEvent = {
  id: string;
  event: string;
  actor: {
    name: string;
    email: string;
    ip: string;
  };
  resource: string;
  timestamp: string;
  relativeTime: string;
  severity: "info" | "warning" | "critical";
  metadata: string;
};

const initialEvents: AuditEvent[] = [
  {
    id: "aud-001",
    event: "user.role_updated",
    actor: { name: "Alex Chen", email: "alex@company.com", ip: "192.168.1.42" },
    resource: "Member sarah@company.com",
    timestamp: "2026-10-31T12:45:00Z",
    relativeTime: "25 minutes ago",
    severity: "warning",
    metadata: "Role changed from 'member' to 'admin'",
  },
  {
    id: "aud-002",
    event: "api_key.generated",
    actor: { name: "Alex Chen", email: "alex@company.com", ip: "192.168.1.42" },
    resource: "CI/CD Deployment Token",
    timestamp: "2026-10-31T11:15:00Z",
    relativeTime: "1 hour ago",
    severity: "info",
    metadata: "Scopes: read:tasks, write:backlog",
  },
  {
    id: "aud-003",
    event: "billing.seats_added",
    actor: { name: "Alex Chen", email: "alex@company.com", ip: "192.168.1.42" },
    resource: "Workspace Subscription",
    timestamp: "2026-10-31T09:30:00Z",
    relativeTime: "3 hours ago",
    severity: "info",
    metadata: "Increased seat count from 35 to 40",
  },
  {
    id: "aud-004",
    event: "task.bulk_deleted",
    actor: { name: "Marcus Brody", email: "marcus@company.com", ip: "10.0.0.88" },
    resource: "Backlog (8 archived tasks)",
    timestamp: "2026-10-30T17:22:00Z",
    relativeTime: "Yesterday, 5:22 PM",
    severity: "warning",
    metadata: "Permanently purged 8 stale backlog items",
  },
  {
    id: "aud-005",
    event: "workspace.sso_configured",
    actor: { name: "Alex Chen", email: "alex@company.com", ip: "192.168.1.42" },
    resource: "Security / SAML Provider",
    timestamp: "2026-10-29T14:10:00Z",
    relativeTime: "2 days ago",
    severity: "critical",
    metadata: "Enforced Okta SSO mandatory login requirement",
  },
  {
    id: "aud-006",
    event: "data.compliance_exported",
    actor: { name: "Sarah Connor", email: "sarah@company.com", ip: "172.16.0.12" },
    resource: "Full Workspace JSON",
    timestamp: "2026-10-28T08:00:00Z",
    relativeTime: "3 days ago",
    severity: "info",
    metadata: "Automated SOC 2 monthly compliance archive snapshot",
  },
];

export default function AuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filteredEvents = events.filter((e) => {
    const matchesSeverity = severityFilter === "all" || e.severity === severityFilter;
    const matchesQuery =
      !searchQuery ||
      e.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.actor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.metadata.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesQuery;
  });

  const exportCsv = () => {
    const headers = ["Event ID", "Event", "Actor Name", "Actor Email", "IP Address", "Resource", "Timestamp", "Severity", "Details"];
    const rows = filteredEvents.map((e) => [
      e.id,
      e.event,
      `"${e.actor.name}"`,
      e.actor.email,
      e.actor.ip,
      `"${e.resource}"`,
      e.timestamp,
      e.severity,
      `"${e.metadata}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orbit-audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] mb-1">
            <Link href="/settings" className="hover:text-[var(--color-text-primary)] transition-colors">
              Settings
            </Link>
            <span>/</span>
            <span className="text-[var(--color-text-primary)]">Audit Log</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Enterprise Audit Trail
            </h1>
            <Badge variant="outline" className="text-xs font-semibold py-0.5 px-2">
              SOC 2 Compliant
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Tamper-evident chronological log of security events, administrative mutations, and access traces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={exportCsv}
            className="gap-1.5 text-xs font-semibold rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90 active:scale-95 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
            <Input
              placeholder="Search actor, event, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-[var(--color-surface-strong)] border-[var(--color-border-secondary)]"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-8 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-2.5 text-xs text-[var(--color-text-secondary)] outline-hidden"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
          <span>Retention: 365 Days</span>
          <span>•</span>
          <span>{filteredEvents.length} events logged</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <Card className="rounded-2xl border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border-secondary)] bg-[var(--color-surface)]/80 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                <th className="px-5 py-3.5">Event</th>
                <th className="px-4 py-3.5">Actor</th>
                <th className="px-4 py-3.5">Resource Target</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Severity</th>
                <th className="px-5 py-3.5">Mutation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-secondary)]">
              {filteredEvents.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                  <td className="px-5 py-3 font-mono font-semibold text-[var(--color-text-primary)]">
                    {item.event}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {item.actor.name}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">
                      {item.actor.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)] font-medium">
                    {item.resource}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[var(--color-text-tertiary)]">
                    {item.actor.ip}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-tertiary)] whitespace-nowrap">
                    <p>{item.relativeTime}</p>
                    <p className="text-[10px] opacity-75">{new Date(item.timestamp).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        item.severity === "critical"
                          ? "error"
                          : item.severity === "warning"
                          ? "warning"
                          : "default"
                      }
                      className="text-[10px] font-semibold py-0 px-2 capitalize"
                    >
                      {item.severity}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-secondary)] max-w-xs truncate text-[11px]">
                    {item.metadata}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
