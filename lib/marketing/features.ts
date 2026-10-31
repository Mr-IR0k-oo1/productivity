/**
 * Copy for the /features pages. Every claim here must match what the app actually does;
 * check the code before adding a capability.
 */

export type VignetteName = "backlog" | "board" | "ideas" | "flow" | "reports";

export type FeaturePage = {
  slug: string;
  name: string;
  /** Shown in navigation and cards. */
  tagline: string;
  /** Page headline. */
  headline: string;
  intro: string;
  vignette: VignetteName;
  highlights: Array<{ title: string; body: string }>;
  /** Other feature slugs worth reading next. */
  related: string[];
};

export const featurePages: FeaturePage[] = [
  {
    slug: "sprints",
    name: "Backlog and sprints",
    tagline: "One backlog, planned sprints, shipped work.",
    headline: "Plan sprints your team can actually finish.",
    intro:
      "Keep one backlog of epics, stories, tasks and bugs. Estimate in story points, pull work into a sprint until it's full, and start it. When it ends, unfinished issues move on in one step.",
    vignette: "backlog",
    highlights: [
      { title: "One backlog", body: "Every issue that isn't in a sprint, in one list. Each gets a readable key like QTX-42, so it's easy to refer to." },
      { title: "Epics, stories, tasks and bugs", body: "Group work under epics and see each epic fill up as its issues close." },
      { title: "Story points", body: "Estimate work in points and see how full a sprint is before you start it." },
      { title: "Start and complete", body: "Set dates and a goal, start the sprint, and complete it when it's done." },
      { title: "Carry over", body: "On completion, send unfinished issues to the next sprint or back to the backlog." },
      { title: "The orbit on your dashboard", body: "Each issue is a dot on the sprint ring, and the trail shows how much of the sprint has passed." },
    ],
    related: ["board", "reports"],
  },
  {
    slug: "board",
    name: "Board and views",
    tagline: "Kanban, list, calendar and gantt, from the same issues.",
    headline: "Every view of the work, always in sync.",
    intro:
      "Drag issues across To do, In progress, In review and Done, or switch to a list, calendar or gantt view of the same issues. Filters narrow it to what you need right now.",
    vignette: "board",
    highlights: [
      { title: "Kanban board", body: "Four clear columns. Move an issue and everyone sees the change." },
      { title: "List view", body: "A dense table for sorting, scanning and bulk changes." },
      { title: "Calendar view", body: "Issues placed on their due dates, next to your events." },
      { title: "Gantt view", body: "Start and end dates on a timeline, with milestones." },
      { title: "Filters", body: "Narrow by assignee, priority, due date, or just your own issues." },
      { title: "Subtasks and comments", body: "Break issues down, discuss them in place, and track dependencies." },
    ],
    related: ["sprints", "flowcharts"],
  },
  {
    slug: "ideas",
    name: "Ideas",
    tagline: "Collect, vote, and convert the best into issues.",
    headline: "Good ideas shouldn't get lost in chat.",
    intro:
      "Give everyone a place to suggest ideas. Discuss them, vote, link related ideas, and turn the strongest into issues with one click, without losing the conversation that got them there.",
    vignette: "ideas",
    highlights: [
      { title: "Draft to validated", body: "Ideas move from draft to validated, archived or converted, on a board or a list." },
      { title: "Votes and comments", body: "See what the team cares about, and why." },
      { title: "Dependencies", body: "Link ideas that build on each other." },
      { title: "Mind map", body: "See how ideas relate on a single map." },
      { title: "One-click conversion", body: "Turn an idea into an issue; the idea keeps a link to it." },
    ],
    related: ["sprints", "flowcharts"],
  },
  {
    slug: "flowcharts",
    name: "Flowcharts",
    tagline: "Diagrams that link straight to the work.",
    headline: "Draw the flow, then link it to the work that builds it.",
    intro:
      "Sketch user flows, process maps and architecture on a canvas, then place issue and idea cards right on it. Share a read-only link with anyone, and roll back with version history.",
    vignette: "flow",
    highlights: [
      { title: "Shapes, notes and code", body: "Shapes, text, sticky notes, images, groups and code blocks, with snapping and a grid." },
      { title: "Issue and idea cards", body: "Put live issue and idea cards on the canvas and open them from there." },
      { title: "Comments on the canvas", body: "Pin a comment to any spot and resolve it when it's handled." },
      { title: "Version history", body: "Look back at earlier versions and restore one." },
      { title: "Share and export", body: "Turn on a public read-only link, or export the diagram." },
    ],
    related: ["ideas", "board"],
  },
  {
    slug: "reports",
    name: "Reports and time",
    tagline: "Burndown, velocity, workload and hours.",
    headline: "Know whether the sprint will land, before it ends.",
    intro:
      "Burndown shows the sprint's remaining work against the ideal line. Velocity shows what the team really finishes. Time tracking and timesheets add up the hours per person and project.",
    vignette: "reports",
    highlights: [
      { title: "Burndown", body: "Remaining points per day against the ideal line for the active sprint." },
      { title: "Velocity", body: "Committed against completed, sprint after sprint." },
      { title: "Workload", body: "How open work is spread across the team." },
      { title: "Time tracking", body: "Start a timer on an issue, or log hours afterwards." },
      { title: "Timesheets", body: "Weekly hours per person, ready to review." },
      { title: "Calendar export", body: "Export events to any calendar app as an .ics file." },
    ],
    related: ["sprints", "board"],
  },
];

export function getFeaturePage(slug: string) {
  return featurePages.find((page) => page.slug === slug) ?? null;
}

/** Feature pages listed under `related`, skipping unknown slugs. */
export function relatedFeaturePages(page: FeaturePage) {
  return page.related.map(getFeaturePage).filter((related): related is FeaturePage => related !== null && related.slug !== page.slug);
}
