import { CalendarDays, Check, CheckSquare, Clock, LayoutDashboard, Lightbulb, ListTodo, Sparkles, TrendingUp, Workflow, Zap } from "lucide-react";

import { OrbitGlyph } from "@/components/brand/BrandLogo";

/*
  A high-fidelity, coded picture of Orbit's dashboard for the marketing hero. It mirrors the real
  screen with sample data, glowing ambient accents, and floating glass chips.
*/

type Status = "done" | "review" | "progress" | "todo";
const ringStatuses: Status[] = ["done", "done", "done", "done", "done", "done", "done", "done", "done", "review", "review", "progress", "progress", "todo"];

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function MiniOrbit() {
  const c = 90;
  const ring = 66;
  const track = 80;
  const end = polar(c, c, track, 0.62 * 360);
  const start = polar(c, c, track, 0);
  return (
    <svg viewBox="0 0 180 180" className="h-auto w-full max-w-[180px] overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="preview-trail" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9d90ff" />
          <stop offset="100%" stopColor="#ff8a3d" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx={c} cy={c} r={ring} fill="none" stroke="#23273b" strokeWidth="1.5" />
      <circle cx={c} cy={c} r={track} fill="none" stroke="#23273b" strokeDasharray="2 5" />
      <path d={`M${start.x} ${start.y}A${track} ${track} 0 1 1 ${end.x} ${end.y}`} fill="none" stroke="url(#preview-trail)" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)" />
      
      {/* Pulsing satellite */}
      <circle cx={end.x} cy={end.y} r="8" fill="#ff8a3d" opacity="0.3" className="animate-pulse" />
      <circle cx={end.x} cy={end.y} r="4.5" fill="#ff8a3d" stroke="#0b0d16" strokeWidth="2" />
      
      {ringStatuses.map((status, index) => {
        const p = polar(c, c, ring, (index * 360) / ringStatuses.length);
        if (status === "done") return <circle key={index} cx={p.x} cy={p.y} r="5" fill="#9d90ff" filter="url(#glow)" />;
        if (status === "todo") return <circle key={index} cx={p.x} cy={p.y} r="3.6" fill="#34395a" />;
        return (
          <g key={index}>
            <circle cx={p.x} cy={p.y} r="4.2" fill="#0b0d16" stroke="#9d90ff" strokeWidth="2" />
            {status === "review" ? <circle cx={p.x} cy={p.y} r="1.6" fill="#9d90ff" /> : null}
          </g>
        );
      })}
      <text x={c} y={c + 6} textAnchor="middle" fontSize="28" fontWeight="600" fill="#f5efe8" fontFamily="var(--font-unbounded)" letterSpacing="-1.5">
        9<tspan fill="#7c8298">/14</tspan>
      </text>
      <text x={c} y={c + 22} textAnchor="middle" fontSize="9" fontWeight="500" fill="#a3a8bf">
        issues done
      </text>
    </svg>
  );
}

const nav = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Lightbulb, label: "Ideas" },
  { icon: ListTodo, label: "Backlog" },
  { icon: CheckSquare, label: "Tasks" },
  { icon: CalendarDays, label: "Calendar" },
  { icon: Workflow, label: "Flowcharts" },
  { icon: Clock, label: "Time" },
];

const upNext = [
  { key: "QTX-41", title: "Checkout fails on Safari 18", due: "today", late: false, level: 3 },
  { key: "QTX-38", title: "Invite teammates by email", due: "in 2 days", late: false, level: 2 },
  { key: "QTX-29", title: "Pricing page copy", due: "1 day late", late: true, level: 2 },
  { key: "QTX-35", title: "Rotate API keys from settings", due: "in 4 days", late: false, level: 1 },
];

function Bars({ level }: { level: number }) {
  const color = level === 3 ? "bg-rose-400" : level === 2 ? "bg-amber-400" : "bg-[#a3a8bf]";
  return (
    <span className="flex h-2.5 items-end gap-[2px]" aria-hidden="true">
      {[1, 2, 3].map((bar) => (
        <span key={bar} className={`w-[2.5px] rounded-full ${bar === 1 ? "h-1" : bar === 2 ? "h-2" : "h-2.5"} ${bar <= level ? color : "bg-[#2e3448]"}`} />
      ))}
    </span>
  );
}

export function DashboardPreview() {
  return (
    <div className="relative">
      {/* Floating Glass Chips around Preview */}
      <div className="pointer-events-none absolute -left-6 -top-6 z-20 hidden items-center gap-2.5 rounded-xl border border-white/15 bg-black/75 px-3.5 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-xl md:flex animate-orbit-pulse">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <Check className="h-3 w-3" />
        </span>
        <span>QTX-36 shipped to production</span>
      </div>

      <div className="pointer-events-none absolute -bottom-6 -right-6 z-20 hidden items-center gap-2.5 rounded-xl border border-[var(--color-accent)]/30 bg-black/80 px-4 py-2.5 text-xs font-medium text-white shadow-2xl backdrop-blur-xl md:flex">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
          <Zap className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="font-semibold text-white">Sprint Velocity: 28 pts</p>
          <p className="text-[10px] text-[var(--color-space-muted)]">+14% vs previous sprint</p>
        </div>
      </div>

      <figure className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#090b12] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.06)]">
        <figcaption className="sr-only">
          Preview of the Orbit dashboard: a sprint with 9 of 14 issues done and 4 days left, and the issues up next.
        </figcaption>

        {/* Window bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0b0d16] px-4 py-3" aria-hidden="true">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56] shadow-[0_0_6px_#ff5f56]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e] shadow-[0_0_6px_#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f] shadow-[0_0_6px_#27c93f]" />
          </div>
          <span className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.04] px-6 py-1 text-[11px] font-mono text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8b7cff]" />
            app.orbit.studio / dashboard
          </span>
          <div className="w-12" />
        </div>

        <div className="grid grid-cols-1 text-left sm:grid-cols-[auto_1fr]" aria-hidden="true">
          {/* Sidebar */}
          <aside className="hidden w-[160px] border-r border-white/[0.08] bg-[#0b0d16] p-3.5 sm:block">
            <div className="flex items-center gap-2 px-2 pb-4 pt-1 text-[#f5efe8]">
              <OrbitGlyph className="h-4 w-4 text-[#9d90ff]" satelliteClassName="fill-[#ff8a3d]" />
              <span className="font-display text-xs font-bold tracking-tight">Orbit</span>
            </div>
            <ul className="space-y-1">
              {nav.map(({ icon: Icon, label, active }) => (
                <li
                  key={label}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    active ? "bg-[#9d90ff]/20 text-white ring-1 ring-[#9d90ff]/40 shadow-xs" : "text-[#8b90a8]"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? "text-[#9d90ff]" : ""}`} />
                  {label}
                </li>
              ))}
            </ul>
          </aside>

          {/* Main Content */}
          <div className="min-w-0 p-5 sm:p-6 bg-gradient-to-b from-[#0e111c] to-[#090b12]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-semibold tracking-wider text-[#6f7590]">Friday, October 31</p>
                <p className="mt-0.5 font-display text-base font-bold tracking-[-0.03em] text-[#f5efe8] sm:text-lg">
                  Good morning, Maya
                </p>
                <p className="mt-0.5 text-xs text-[#a3a8bf]">1 issue past due and 1 due today. Sprint 14 ends in 4 days.</p>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live sprint
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1.5fr_1fr]">
              {/* Sprint Hero Widget */}
              <div className="orbit-hero relative grid items-center gap-5 p-5 sm:grid-cols-[150px_1fr]">
                <MiniOrbit />
                <div>
                  <span className="inline-block rounded-md bg-[#ff8a3d]/15 px-2 py-0.5 text-[10px] font-semibold text-[#ff8a3d]">
                    4 days left • Oct 26 to Nov 6
                  </span>
                  <p className="mt-2 font-display text-base font-bold tracking-tight text-[#f5efe8]">Sprint 14</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#a3a8bf]">Ship self-serve billing and the new onboarding.</p>
                  
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {[
                      ["Done", 9],
                      ["In review", 2],
                      ["In progress", 2],
                      ["To do", 1],
                    ].map(([label, count]) => (
                      <div key={label} className="flex justify-between border-b border-white/[0.06] pb-1 text-[#a3a8bf]">
                        <span>{label}</span>
                        <span className="font-semibold text-white">{count}</span>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              {/* Up Next List Widget */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#10131d] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <p className="text-xs font-semibold text-[#f5efe8]">Up next for you</p>
                    <span className="text-[10px] text-[#9d90ff]">4 open</span>
                  </div>
                  <ul className="divide-y divide-white/[0.06]">
                    {upNext.map((item) => (
                      <li key={item.key} className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 py-2.5">
                        <Bars level={item.level} />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium text-[#f5efe8]">{item.title}</span>
                          <span className="block font-mono text-[9px] text-[#6f7590]">{item.key}</span>
                        </span>
                        <span className={`text-[10px] font-mono ${item.late ? "text-rose-400" : "text-[#8b90a8]"}`}>{item.due}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </figure>
    </div>
  );
}
