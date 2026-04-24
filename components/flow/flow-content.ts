import type { ComponentType } from "react";
import type { Metadata } from "next";
import {
  BarChart3,
  Calendar,
  CheckSquare,
  Clock,
  Lightbulb,
} from "lucide-react";

export type FlowStepSlug = "ideas" | "tasks" | "calendar" | "time" | "results";
export type FlowDemoVariant = FlowStepSlug;

export type FlowHighlight = {
  eyebrow: string;
  title: string;
  description: string;
};

export type FlowStepAccent = {
  iconWrapClassName: string;
  tagClassName: string;
  borderClassName: string;
  cardHoverClassName: string;
  buttonClassName: string;
  glowClassName: string;
};

export type FlowStep = {
  slug: FlowStepSlug;
  order: number;
  marketingHref: string;
  appHref: string;
  appLabel: string;
  title: string;
  stepTitle: string;
  description: string;
  detailEyebrow: string;
  detailTitle: string;
  detailDescription: string;
  demoVariant: FlowDemoVariant;
  highlights: FlowHighlight[];
  benefits: string[];
  accent: FlowStepAccent;
  icon: ComponentType<{ className?: string }>;
};

export const FLOW_STEPS: FlowStep[] = [
  {
    slug: "ideas",
    order: 1,
    marketingHref: "/flow/ideas",
    appHref: "/ideas",
    appLabel: "Open Ideas Hub",
    title: "Capture Ideas",
    stepTitle: "1. Capture Ideas",
    description: "Brainstorm, vote, and organize promising ideas before they disappear into chat history.",
    detailEyebrow: "Ideas Hub",
    detailTitle: "Capture rough thinking while the team still has energy around it",
    detailDescription:
      "Orbit gives early-stage ideas a home, lets the team add signal fast, and makes it easy to promote the strongest concepts into execution without losing the original context.",
    demoVariant: "ideas",
    highlights: [
      {
        eyebrow: "Signal first",
        title: "Vote on the ideas that deserve real planning time",
        description: "Quick team voting surfaces demand and urgency before you spend a sprint shaping the wrong thing.",
      },
      {
        eyebrow: "Organized capture",
        title: "Keep notes, tags, and adjacent concepts together",
        description: "Ideas stay searchable, cluster naturally, and remain understandable when you revisit them later.",
      },
      {
        eyebrow: "Fast handoff",
        title: "Promote a winning idea into a task without rewriting it",
        description: "The original title, motivation, and supporting context travel forward into the execution phase.",
      },
    ],
    benefits: [
      "Replace scattered brainstorm notes with one ranked idea board.",
      "Give every teammate a low-friction way to contribute and signal priority.",
      "Move directly from validation into execution when an idea is ready.",
    ],
    accent: {
      iconWrapClassName: "bg-amber-500/15 text-amber-300",
      tagClassName: "bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-400/20",
      borderClassName: "border-amber-400/25",
      cardHoverClassName: "hover:border-amber-400/70",
      buttonClassName: "bg-amber-400 text-zinc-950 hover:bg-amber-300",
      glowClassName: "bg-amber-400/20",
    },
    icon: Lightbulb,
  },
  {
    slug: "tasks",
    order: 2,
    marketingHref: "/flow/tasks",
    appHref: "/tasks",
    appLabel: "Open Tasks",
    title: "Turn into Tasks",
    stepTitle: "2. Turn into Tasks",
    description: "Break ideas into accountable work with subtasks, owners, priorities, and dependencies.",
    detailEyebrow: "Task Execution",
    detailTitle: "Turn validated ideas into work the whole team can actually finish",
    detailDescription:
      "Once something matters, Orbit helps you shape it into clear tasks, sequence the dependencies, and keep execution visible from backlog to done.",
    demoVariant: "tasks",
    highlights: [
      {
        eyebrow: "Clear ownership",
        title: "Assign work without losing the original why",
        description: "Tasks stay connected to the idea, intent, and dependencies that justified the work in the first place.",
      },
      {
        eyebrow: "Multiple views",
        title: "See the same work as kanban, list, calendar, or gantt",
        description: "Different teammates can plan from the view that fits their job without fragmenting the source of truth.",
      },
      {
        eyebrow: "Dependency-aware",
        title: "Spot blockers before they slow the whole sprint",
        description: "Orbit keeps linked work visible so handoffs and risky paths are easier to manage in real time.",
      },
    ],
    benefits: [
      "Translate ideas into specific, accountable deliverables.",
      "Track blockers and dependencies before they turn into surprise delays.",
      "Let product, design, and engineering work from the same execution board.",
    ],
    accent: {
      iconWrapClassName: "bg-sky-500/15 text-sky-300",
      tagClassName: "bg-sky-500/10 text-sky-300 ring-1 ring-inset ring-sky-400/20",
      borderClassName: "border-sky-400/25",
      cardHoverClassName: "hover:border-sky-400/70",
      buttonClassName: "bg-sky-500 text-white hover:bg-sky-400",
      glowClassName: "bg-sky-400/20",
    },
    icon: CheckSquare,
  },
  {
    slug: "calendar",
    order: 3,
    marketingHref: "/flow/calendar",
    appHref: "/calendar",
    appLabel: "Open Calendar",
    title: "Schedule & Plan",
    stepTitle: "3. Schedule & Plan",
    description: "Place work on the calendar, align deadlines, and see how the team’s time is actually shaped.",
    detailEyebrow: "Calendar Planning",
    detailTitle: "Schedule the work before capacity becomes a surprise",
    detailDescription:
      "Orbit turns tasks into a visible plan. Teams can place work on the calendar, protect focus time, and balance deadlines against the reality of meetings and availability.",
    demoVariant: "calendar",
    highlights: [
      {
        eyebrow: "Drag to plan",
        title: "Move tasks into real calendar time",
        description: "Scheduling happens in context, making the plan easier to trust than a static backlog alone.",
      },
      {
        eyebrow: "Capacity view",
        title: "See availability before overcommitting the team",
        description: "Deadlines, meetings, and focus blocks share one timeline so tradeoffs stay visible.",
      },
      {
        eyebrow: "Shared context",
        title: "Connect plans back to the work they represent",
        description: "Every event can point back to the task, project, or milestone that created it.",
      },
    ],
    benefits: [
      "Turn backlog intent into a realistic weekly plan.",
      "Protect deep work while still coordinating deadlines and reviews.",
      "Make schedule tradeoffs obvious before they create churn.",
    ],
    accent: {
      iconWrapClassName: "bg-fuchsia-500/15 text-fuchsia-300",
      tagClassName: "bg-fuchsia-500/10 text-fuchsia-300 ring-1 ring-inset ring-fuchsia-400/20",
      borderClassName: "border-fuchsia-400/25",
      cardHoverClassName: "hover:border-fuchsia-400/70",
      buttonClassName: "bg-fuchsia-500 text-white hover:bg-fuchsia-400",
      glowClassName: "bg-fuchsia-400/20",
    },
    icon: Calendar,
  },
  {
    slug: "time",
    order: 4,
    marketingHref: "/flow/time",
    appHref: "/time",
    appLabel: "Open Time Tracking",
    title: "Track Time",
    stepTitle: "4. Track Time",
    description: "Capture real effort with timers, manual logs, approvals, and weekly timesheet context.",
    detailEyebrow: "Time Tracking",
    detailTitle: "Understand the real effort behind the plan while work is happening",
    detailDescription:
      "Timers, manual entries, and timesheet review help teams see how long work actually takes, which projects consume the most attention, and where planning assumptions drift from reality.",
    demoVariant: "time",
    highlights: [
      {
        eyebrow: "Live capture",
        title: "Track work as it happens with one-click timers",
        description: "Fast timer controls reduce friction so people can log accurately without leaving their flow.",
      },
      {
        eyebrow: "Team visibility",
        title: "Review personal logs or team approvals in one place",
        description: "Leads can approve, correct, and understand where time is going without spreadsheet cleanup.",
      },
      {
        eyebrow: "Planning feedback",
        title: "Compare estimated effort against real execution time",
        description: "Better estimates come from seeing what the work actually cost, not guessing after the sprint ends.",
      },
    ],
    benefits: [
      "Measure effort with less overhead during the workday.",
      "Give managers a clear review path for approvals and corrections.",
      "Feed real time data back into future planning and staffing choices.",
    ],
    accent: {
      iconWrapClassName: "bg-emerald-500/15 text-emerald-300",
      tagClassName: "bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/20",
      borderClassName: "border-emerald-400/25",
      cardHoverClassName: "hover:border-emerald-400/70",
      buttonClassName: "bg-emerald-500 text-white hover:bg-emerald-400",
      glowClassName: "bg-emerald-400/20",
    },
    icon: Clock,
  },
  {
    slug: "results",
    order: 5,
    marketingHref: "/flow/results",
    appHref: "/reports",
    appLabel: "Open Reports",
    title: "See Results",
    stepTitle: "5. See Results",
    description: "Use dashboards, reports, and team insights to understand progress, risk, and momentum.",
    detailEyebrow: "Reports & Insights",
    detailTitle: "Turn daily delivery into visible results the whole team can learn from",
    detailDescription:
      "Orbit closes the loop with live reporting. Teams can see what shipped, where time went, who is overloaded, and which projects are gaining or losing momentum.",
    demoVariant: "results",
    highlights: [
      {
        eyebrow: "Live dashboards",
        title: "See work, time, and momentum in one reporting layer",
        description: "The same system that captures execution can tell the story of what changed and what needs attention next.",
      },
      {
        eyebrow: "Team signals",
        title: "Compare throughput, load, and completion patterns",
        description: "Leaders can spot imbalance early and adjust scope, staffing, or deadlines before burnout compounds.",
      },
      {
        eyebrow: "Actionable review",
        title: "Use trends to improve the next planning cycle",
        description: "Insight is most valuable when it feeds the next round of ideas, tasks, schedules, and team decisions.",
      },
    ],
    benefits: [
      "Make progress visible without building a reporting process on the side.",
      "Spot delivery risk, overload, and momentum shifts earlier.",
      "Use real outcomes to improve future planning and prioritization.",
    ],
    accent: {
      iconWrapClassName: "bg-violet-500/15 text-violet-300",
      tagClassName: "bg-violet-500/10 text-violet-300 ring-1 ring-inset ring-violet-400/20",
      borderClassName: "border-violet-400/25",
      cardHoverClassName: "hover:border-violet-400/70",
      buttonClassName: "bg-violet-500 text-white hover:bg-violet-400",
      glowClassName: "bg-violet-400/20",
    },
    icon: BarChart3,
  },
];

export function getFlowStep(slug: FlowStepSlug) {
  const step = FLOW_STEPS.find((entry) => entry.slug === slug);

  if (!step) {
    throw new Error(`Unknown flow step: ${slug}`);
  }

  return step;
}

export function getNextFlowStep(slug: FlowStepSlug) {
  const currentIndex = FLOW_STEPS.findIndex((entry) => entry.slug === slug);
  const nextIndex = currentIndex === FLOW_STEPS.length - 1 ? 0 : currentIndex + 1;

  return FLOW_STEPS[nextIndex];
}

export function buildFlowStepMetadata(step: FlowStep): Metadata {
  return {
    title: `Orbit | ${step.title}`,
    description: step.detailDescription,
  };
}
