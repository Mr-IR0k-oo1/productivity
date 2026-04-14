"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  Code2,
  Palette,
  Save,
  Settings2,
  Shield,
  Users,
  Workflow,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CategoryId =
  | "general"
  | "team"
  | "notifications"
  | "tasks"
  | "calendar"
  | "reports"
  | "integrations"
  | "security"
  | "appearance"
  | "advanced";

type SettingsCategory = {
  id: CategoryId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const categories: SettingsCategory[] = [
  { id: "general", label: "General", description: "Workspace profile", icon: Settings2 },
  { id: "team", label: "Team", description: "Members and roles", icon: Users },
  {
    id: "notifications",
    label: "Notifications",
    description: "Delivery channels",
    icon: Bell,
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Workflow defaults",
    icon: Workflow,
  },
  {
    id: "calendar",
    label: "Calendar",
    description: "Hours and scheduling",
    icon: CalendarDays,
  },
  {
    id: "reports",
    label: "Reports",
    description: "Analytics behavior",
    icon: CalendarDays,
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Connected services",
    icon: Wrench,
  },
  {
    id: "security",
    label: "Security",
    description: "Security and billing",
    icon: Shield,
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "UI customization",
    icon: Palette,
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "Developer options",
    icon: Code2,
  },
];

const selectClassName =
  "h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-zinc-600";
const textareaClassName =
  "min-h-[100px] w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-600";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-200">{label}</p>
      {children}
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  defaultChecked = false,
  disabled = false,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-900 bg-zinc-950/50 px-3 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-200">{title}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <input type="checkbox" defaultChecked={defaultChecked} disabled={disabled} className="mt-1 h-4 w-4" />
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  buttonLabel = "Save Section",
  danger = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  buttonLabel?: string;
  danger?: boolean;
}) {
  return (
    <Card className={cn(danger && "border-red-950/80 bg-red-950/20")}> 
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
      <CardFooter className="justify-end border-t border-zinc-900 pt-4">
        <Button
          variant="secondary"
          className={cn(danger && "border-red-900 bg-red-950/40 text-red-200 hover:bg-red-950/60")}
        >
          {buttonLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}

function GeneralSettingsSection() {
  return (
    <div className="space-y-4">
      <SectionCard title="General Settings" description="Workspace identity, locale and theme defaults.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Workspace Name">
            <Input defaultValue="PulseForge" />
          </Field>
          <Field label="Workspace Icon / Logo" hint="PNG or SVG up to 2 MB.">
            <Input type="file" />
          </Field>
        </div>
        <Field label="Workspace Description">
          <textarea className={textareaClassName} defaultValue="Execution stack for startup teams." />
        </Field>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Default Time Zone">
            <select className={selectClassName} defaultValue="Asia/Kolkata">
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="UTC">UTC</option>
            </select>
          </Field>
          <Field label="Date & Time Format">
            <select className={selectClassName} defaultValue="24h">
              <option value="12h">12h</option>
              <option value="24h">24h</option>
            </select>
          </Field>
          <Field label="Language">
            <select className={selectClassName} defaultValue="en">
              <option value="en">English</option>
              <option value="ta" disabled>
                Tamil (future)
              </option>
              <option value="hi" disabled>
                Hindi (future)
              </option>
            </select>
          </Field>
          <Field label="Theme">
            <select className={selectClassName} defaultValue="dark" disabled>
              <option value="dark">Dark (current)</option>
              <option value="light">Light (future)</option>
            </select>
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

function TeamSettingsSection() {
  return (
    <div className="space-y-4">
      <SectionCard title="Team & Members" description="Invite teammates, manage roles and member lifecycle.">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_auto]">
          <Input placeholder="teammate@startup.com" />
          <select className={selectClassName} defaultValue="member">
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="member">Member</option>
            <option value="guest">Guest</option>
          </select>
          <Button>Invite Member</Button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-900">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-zinc-950/70 text-zinc-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Avatar</th>
                <th className="px-3 py-2">Join Date</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Arun K", "arun@pulseforge.io", "Owner", "A", "2026-01-10", "Active"],
                ["Bala M", "bala@pulseforge.io", "Admin", "B", "2026-02-01", "Active"],
                ["Chitra R", "chitra@pulseforge.io", "Manager", "C", "2026-04-01", "Invited"],
              ].map((row) => (
                <tr key={row[1]} className="border-t border-zinc-900 text-zinc-200">
                  <td className="px-3 py-2.5">{row[0]}</td>
                  <td className="px-3 py-2.5">{row[1]}</td>
                  <td className="px-3 py-2.5">{row[2]}</td>
                  <td className="px-3 py-2.5">{row[3]}</td>
                  <td className="px-3 py-2.5">{row[4]}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={row[5] === "Active" ? "success" : "warning"}>{row[5]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 md:grid-cols-[220px_auto_auto]">
          <select className={selectClassName} defaultValue="manager">
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="member">Member</option>
            <option value="guest">Guest (read-only)</option>
          </select>
          <Button variant="secondary">Bulk Role Update</Button>
          <Button variant="secondary" className="border-red-900 text-red-200">
            Remove / Deactivate
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function NotificationsSettingsSection() {
  return (
    <div className="space-y-4">
      <SectionCard title="Notifications" description="Control what, where and when notifications are sent.">
        <div className="space-y-2">
          <ToggleRow title="Task assigned to me" description="Email me when I am assigned a task." defaultChecked />
          <ToggleRow title="Task due soon / overdue" description="Send deadline reminders by email." defaultChecked />
          <ToggleRow title="Mentioned in comments" description="Notify me when tagged in discussion." defaultChecked />
          <ToggleRow title="Idea converted to task" description="Email when idea enters execution." defaultChecked />
          <ToggleRow title="Weekly digest" description="Send weekly summary report." />
          <ToggleRow title="In-App Notifications" description="Enable in-app feed notifications." defaultChecked />
          <ToggleRow title="Push Notifications" description="Enable mobile and PWA push alerts." />
          <ToggleRow title="Slack Integration" description="Future integration toggle." disabled />
          <ToggleRow title="WhatsApp Integration" description="Future integration toggle." disabled />
        </div>
      </SectionCard>
    </div>
  );
}

function TasksSettingsSection() {
  return (
    <div className="space-y-4">
      <SectionCard title="Tasks & Workflow" description="Default task behavior and automation rules.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Default Task View">
            <select className={selectClassName} defaultValue="kanban">
              <option value="kanban">Kanban</option>
              <option value="list">List</option>
              <option value="calendar">Calendar</option>
            </select>
          </Field>
          <Field label="Default Priority Levels">
            <Input defaultValue="High, Medium, Low" />
          </Field>
          <Field label="Task Statuses">
            <Input defaultValue="To Do, In Progress, Review, Done" />
          </Field>
        </div>
        <Field label="Recurring Task Templates">
          <Input defaultValue="Daily Standup, Weekly Sprint Review" />
        </Field>
        <ToggleRow
          title="When task completed -> notify manager"
          description="Send automatic completion notification."
          defaultChecked
        />
        <ToggleRow
          title="When task overdue -> send reminder"
          description="Send reminder to assignee and owner."
          defaultChecked
        />
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow
            title="Enable billable hours"
            description="Allow billable flag for tracked time."
            defaultChecked
          />
          <Field label="Default estimate unit">
            <select className={selectClassName} defaultValue="hours">
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

function CalendarSettingsSection() {
  return (
    <div className="space-y-4">
      <SectionCard title="Calendar & Time" description="Working schedule, leave and sync defaults.">
        <div className="space-y-2 rounded-lg border border-zinc-900 p-3">
          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
            <div key={day} className="grid items-center gap-2 md:grid-cols-[60px_1fr_1fr]">
              <span className="text-sm text-zinc-400">{day}</span>
              <Input type="time" defaultValue="09:00" />
              <Input type="time" defaultValue="18:00" />
            </div>
          ))}
        </div>
        <ToggleRow title="Weekend Settings" description="Hide weekends in calendar views." defaultChecked />
        <Field label="Time Off / Leave Types">
          <Input defaultValue="Vacation, Sick, Personal" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow title="Google Calendar Sync" description="Connect and sync events." defaultChecked />
          <Field label="Default Event Duration">
            <select className={selectClassName} defaultValue="60">
              <option value="30">30 min</option>
              <option value="60">60 min</option>
            </select>
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

function ReportsSettingsSection() {
  return (
    <div className="space-y-4">
      <SectionCard title="Reports & Analytics" description="Reporting defaults and dashboard widgets.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Default Report Period">
            <select className={selectClassName} defaultValue="weekly">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>
          <Field label="Export Format">
            <Input defaultValue="PDF, Excel, CSV" />
          </Field>
          <ToggleRow
            title="Show sensitive data for admins"
            description="Sensitive fields visible only to admins."
            defaultChecked
          />
        </div>
        <Field label="Dashboard Widget Preferences">
          <Input defaultValue="Total Tasks, Active Ideas, Hours Tracked, Completion Rate" />
        </Field>
      </SectionCard>
    </div>
  );
}

function IntegrationsSettingsSection() {
  return (
    <div className="space-y-4">
      <SectionCard title="Integrations" description="External tools and automation providers.">
        <div className="space-y-2">
          {[
            ["Google Calendar", "Connect / Disconnect"],
            ["Slack", "Connect"],
            ["Google Drive", "Connect"],
            ["Zapier / Make.com", "API key display"],
            ["WhatsApp Business", "Future"],
          ].map((row) => (
            <div
              key={row[0]}
              className="flex items-center justify-between rounded-md border border-zinc-900 bg-zinc-950/50 px-3 py-2.5"
            >
              <p className="text-sm text-zinc-200">{row[0]}</p>
              <Button variant="secondary" disabled={row[1] === "Future"}>
                {row[1]}
              </Button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function SecuritySettingsSection() {
  return (
    <div className="space-y-4">
      <SectionCard title="Security & Billing" description="Account security, sessions, data and SaaS billing.">
        <ToggleRow title="Two-Factor Authentication" description="Allow users to enable 2FA." />
        <div className="rounded-md border border-zinc-900 bg-zinc-950/50 p-3">
          <p className="text-sm font-medium text-zinc-200">Session Management</p>
          <p className="text-xs text-zinc-500">2 active sessions</p>
          <Button variant="secondary" className="mt-2">
            Logout All Devices
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Button variant="secondary">Data Export</Button>
          <Button variant="secondary">Billing & Plans</Button>
        </div>
      </SectionCard>
      <SectionCard
        title="Danger Zone"
        description="Permanent workspace deletion action."
        buttonLabel="Delete Workspace"
        danger
      >
        <p className="text-sm text-red-200">Deleting the workspace will remove all tasks, ideas and history.</p>
      </SectionCard>
    </div>
  );
}

function AppearanceSettingsSection() {
  return (
    <div className="space-y-4">
      <SectionCard title="Appearance & Customization" description="Visual behavior and productivity preferences.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Custom Workspace Color">
            <Input type="color" defaultValue="#22c55e" className="h-10" />
          </Field>
          <Field label="Sidebar Density">
            <select className={selectClassName} defaultValue="normal">
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
            </select>
          </Field>
          <ToggleRow title="Show Activity Feed" description="Display feed on dashboard." defaultChecked />
          <Field label="Command Palette Shortcuts">
            <Input defaultValue="Ctrl+K" />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

function AdvancedSettingsSection() {
  return (
    <div className="space-y-4">
      <SectionCard title="Advanced / Developer" description="Programmatic and audit-level controls.">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <Input readOnly value="pf_api_live_xxxxxxxxxxxxx" />
          <Button variant="secondary">Generate</Button>
          <Button variant="secondary">Revoke</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Webhook URL" defaultValue="https://hooks.example.com/pulseforge" />
          <Input placeholder="Webhook secret" defaultValue="whsec_xxxxxx" />
        </div>
        <Field label="Audit Log">
          <textarea
            className={textareaClassName}
            defaultValue={"Arun changed role from Member to Manager\nBala updated webhook settings"}
          />
        </Field>
        <Button variant="secondary">Export Schema</Button>
      </SectionCard>
    </div>
  );
}

function SettingsSection({ category }: { category: CategoryId }) {
  if (category === "general") return <GeneralSettingsSection />;
  if (category === "team") return <TeamSettingsSection />;
  if (category === "notifications") return <NotificationsSettingsSection />;
  if (category === "tasks") return <TasksSettingsSection />;
  if (category === "calendar") return <CalendarSettingsSection />;
  if (category === "reports") return <ReportsSettingsSection />;
  if (category === "integrations") return <IntegrationsSettingsSection />;
  if (category === "security") return <SecuritySettingsSection />;
  if (category === "appearance") return <AppearanceSettingsSection />;
  return <AdvancedSettingsSection />;
}

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("general");

  const activeMeta = useMemo(
    () => categories.find((item) => item.id === activeCategory) ?? categories[0],
    [activeCategory],
  );

  const ActiveIcon = activeMeta.icon;

  return (
    <div className="space-y-6 page-animate">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-zinc-400">Startup workspace control center for team operations.</p>
        </div>
        <Button>
          <Save className="h-4 w-4" />
          Save All Changes
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-2">
          <div className="space-y-1">
            {categories.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeCategory;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveCategory(item.id)}
                  className={cn(
                    "w-full rounded-lg border border-transparent px-3 py-2 text-left transition-colors",
                    isActive
                      ? "border-zinc-800 bg-zinc-900 text-zinc-100"
                      : "text-zinc-400 hover:border-zinc-900 hover:bg-zinc-950",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <p className="text-sm font-medium">{item.label}</p>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ActiveIcon className="h-5 w-5 text-zinc-300" />
                <CardTitle>{activeMeta.label}</CardTitle>
              </div>
              <CardDescription>{activeMeta.description}</CardDescription>
            </CardHeader>
          </Card>

          <SettingsSection category={activeCategory} />
        </section>
      </div>
    </div>
  );
}
