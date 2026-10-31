import { ArrowRight, Check, CheckCircle2, ChevronRight, Layers, Sparkles, ThumbsUp, Zap } from "lucide-react";

/* High-fidelity, beautifully styled product illustrations used on marketing pages. */

export function BacklogVignette() {
  const rows = [
    { key: "QTX-52", title: "SSO for Microsoft accounts", pts: 5, type: "epic", priority: "High" },
    { key: "QTX-49", title: "Bulk-edit issue labels", pts: 3, type: "task", priority: "Med" },
    { key: "QTX-47", title: "Empty state for new boards", pts: 1, type: "story", priority: "Low" },
  ];
  return (
    <div className="orbit-card overflow-hidden p-5 shadow-lg">
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-[var(--color-accent-soft)] to-transparent p-3 border border-[var(--color-accent)]/20">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]" />
          <span className="font-semibold text-sm text-[var(--color-text-primary)]">Sprint 15</span>
        </div>
        <span className="text-xs font-medium text-[var(--color-accent)]">9 of 24 points planned</span>
      </div>

      <div className="mt-4 flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">Backlog queue</p>
        <span className="text-[11px] text-[var(--color-text-tertiary)]">3 issues</span>
      </div>

      <ul className="mt-2.5 space-y-2">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-3.5 py-2.5 text-sm transition-all hover:border-[var(--color-border-tertiary)] hover:bg-[var(--color-surface-hover)] shadow-2xs"
          >
            <span className="font-mono text-[11px] font-semibold text-[var(--color-accent)]">{row.key}</span>
            <span className="min-w-0 flex-1 truncate font-medium text-[var(--color-text-primary)]">{row.title}</span>
            <span className="flex h-6 px-2 items-center justify-center rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-secondary)] text-xs font-semibold tabular-nums text-[var(--color-text-secondary)]">
              {row.pts} pts
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BoardVignette() {
  const columns = [
    { name: "To do", count: 2, dot: "bg-slate-400", cards: ["Pricing page copy", "Audit log export"] },
    { name: "In progress", count: 1, dot: "bg-[var(--color-accent)]", cards: ["Safari checkout bug"] },
    { name: "In review", count: 1, dot: "bg-amber-400", cards: ["Invite by email"] },
    { name: "Done", count: 2, dot: "bg-emerald-500", cards: ["Usage export", "API key rotation"] },
  ];
  return (
    <div className="orbit-card overflow-hidden p-4 shadow-lg">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {columns.map((column) => (
          <div key={column.name} className="rounded-xl bg-[var(--color-background)] p-2.5 border border-[var(--color-border-secondary)]">
            <div className="flex items-center justify-between px-1 pb-2">
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${column.dot}`} />
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">{column.name}</p>
              </div>
              <span className="text-[10px] font-mono text-[var(--color-text-tertiary)]">{column.count}</span>
            </div>
            <div className="space-y-1.5">
              {column.cards.map((card) => (
                <div
                  key={card}
                  className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-2.5 text-xs font-medium text-[var(--color-text-primary)] shadow-2xs transition-transform hover:-translate-y-0.5"
                >
                  <p className="leading-snug">{card}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--color-text-tertiary)]">
                    <span className="font-mono">QTX</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-border-tertiary)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IdeasVignette() {
  return (
    <div className="orbit-card overflow-hidden p-4 shadow-lg space-y-2.5">
      {[
        { title: "Slack digest of sprint progress", votes: 12, converted: true, author: "Maya L." },
        { title: "Dark mode for public flowcharts", votes: 7, converted: false, author: "Alex K." },
        { title: "AI-assisted issue breakdown", votes: 19, converted: false, author: "Sarah P." },
      ].map((idea) => (
        <div
          key={idea.title}
          className="flex items-center gap-3 rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-3 transition-colors hover:bg-[var(--color-surface-hover)]"
        >
          <span className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] shadow-2xs">
            <ThumbsUp className="h-3.5 w-3.5 text-[var(--color-accent)]" aria-hidden="true" />
            {idea.votes}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{idea.title}</p>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">Suggested by {idea.author}</p>
          </div>
          {idea.converted ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-accent-soft)] px-2.5 py-1 font-mono text-xs font-semibold text-[var(--color-accent)] border border-[var(--color-accent)]/30">
              <Check className="h-3 w-3" />
              QTX-53
            </span>
          ) : (
            <span className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
              Convert →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function FlowVignette() {
  return (
    <div className="orbit-card overflow-hidden p-5 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-secondary)] text-xs text-[var(--color-text-secondary)]">
        <span className="font-semibold text-[var(--color-text-primary)]">User Onboarding Flow</span>
        <span className="flex items-center gap-1 text-[var(--color-accent)]">
          <Sparkles className="h-3 w-3" />
          Live canvas
        </span>
      </div>
      <svg viewBox="0 0 400 170" className="mt-3 h-auto w-full" aria-hidden="true">
        <defs>
          <linearGradient id="flow-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-accent)" />
            <stop offset="100%" stopColor="var(--color-flare)" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#flow-line)" strokeWidth="2" strokeDasharray="4 4">
          <path d="M108 45 H150" />
          <path d="M250 45 H292" />
          <path d="M200 65 V100" />
        </g>
        {[
          { x: 8, y: 25, label: "Sign up" },
          { x: 150, y: 25, label: "Verify email" },
          { x: 292, y: 25, label: "Workspace" },
        ].map((node) => (
          <g key={node.label}>
            <rect x={node.x} y={node.y} width="100" height="40" rx="10" fill="var(--color-surface-strong)" stroke="var(--color-border-secondary)" strokeWidth="1.5" />
            <text x={node.x + 50} y={node.y + 25} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--color-text-primary)">
              {node.label}
            </text>
          </g>
        ))}
        {/* Linked issue card on the canvas */}
        <rect x="115" y="100" width="170" height="48" rx="10" fill="var(--color-accent-soft)" stroke="var(--color-accent)" strokeWidth="1.5" />
        <text x="200" y="120" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-accent)" fontFamily="var(--font-plex-mono)">
          QTX-44 (Linked Issue)
        </text>
        <text x="200" y="137" textAnchor="middle" fontSize="11" fill="var(--color-text-primary)">
          Email verification flow
        </text>
      </svg>
    </div>
  );
}

export function ReportsVignette() {
  const remaining = [24, 24, 21, 21, 17, 14, 14, 10, 7];
  const step = 360 / 9;
  const y = (v: number) => 20 + (1 - v / 24) * 120;
  const points = remaining.map((v, i) => `${20 + i * step},${y(v)}`).join(" ");
  return (
    <div className="orbit-card overflow-hidden p-5 shadow-lg">
      <div className="flex items-baseline justify-between px-1">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Sprint 14 burndown</p>
        <span className="rounded-full bg-[var(--color-flare)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-flare)]">
          7 points left
        </span>
      </div>
      <svg viewBox="0 0 400 160" className="mt-3 h-auto w-full" aria-hidden="true">
        <defs>
          <linearGradient id="burndown-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((row) => (
          <line key={row} x1="20" x2="380" y1={20 + row * 40} y2={20 + row * 40} stroke="var(--color-border-secondary)" strokeDasharray="2 4" />
        ))}
        <line x1="20" y1="20" x2="380" y2="140" stroke="var(--color-border-tertiary)" strokeDasharray="4 4" strokeWidth="1.5" />
        
        {/* Area fill */}
        <polygon points={`20,140 ${points} ${20 + 8 * step},140`} fill="url(#burndown-fill)" />
        
        <polyline points={points} fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinejoin="round" />
        <circle cx={20 + 8 * step} cy={y(7)} r="6" fill="var(--color-flare)" stroke="var(--color-surface)" strokeWidth="2.5" className="flare-glow" />
      </svg>
      <div className="mt-2 flex gap-4 px-1 text-xs text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="h-1 w-4 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
          Actual remaining
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-4 border-t-2 border-dashed border-[var(--color-border-tertiary)]" aria-hidden="true" />
          Ideal pace
        </span>
      </div>
    </div>
  );
}
