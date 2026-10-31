# Linear (linear.app) feature inventory vs Orbit, as of late October 2026

Research date: 2026-10-31. The pricing page, changelog index and /now page did not render through the fetch tool (they load with JavaScript). Pricing therefore comes from Linear docs plus third-party pricing trackers, and the changelog comes from individual entries and a third-party monthly roundup. Each source is marked.

## 1. Core planning concepts and features

### Takeaway
Linear has the same sprint core as Orbit: cycles with automatic rollover, velocity and capacity. On top of that it has a full planning hierarchy (issues, projects, initiatives with nested sub-initiatives and health updates) and an intake layer (Triage inbox, Asks, customer requests, SLAs). Orbit has nothing equivalent to the hierarchy or the intake layer.

### Cited Findings
**Cycles (Linear's version of sprints)**
- Cycles are time-boxed like sprints but are not tied to releases. Linear schedules them automatically: length 1 to 8 weeks, a chosen start weekday, and up to 15 future cycles. You can start the next cycle early. — [Linear docs: Cycles](https://linear.app/docs/use-cycles)
- Optional cooldown breaks follow each cycle. Issues cannot be assigned to a cooldown, and issues completed during one count toward the previous cycle. — [Linear docs: Cycles](https://linear.app/docs/use-cycles)
- Unfinished issues roll over to the next cycle automatically; you cannot leave them in a closed cycle. Auto-add rules can put started or completed issues that have no cycle into the current cycle. — [Linear docs: Cycles](https://linear.app/docs/use-cycles)
- Cycle views show a success percentage, total effort, and an effort and scope graph. Completed cycles keep their graphs as snapshots. Upcoming cycles show a capacity dial based on velocity over the last 3 cycles, measured in issues or estimate points. — [Linear docs: Cycles](https://linear.app/docs/use-cycles)

**Initiatives and roadmap**
- Initiatives group projects under a company objective. They can be nested (sub-initiatives), and progress rolls up from sub-initiatives. — [Linear docs: Initiatives](https://linear.app/docs/initiatives)
- Initiative properties: status (Proposed, Planned, Active, Completed, Canceled), priority, labels, owner, lead team, target date, resources (linked docs or links), description, and contributing projects. — [Linear docs: Initiatives](https://linear.app/docs/initiatives)
- Health comes from the latest update (on track, at risk, off track). An Active Projects column rolls up each project's latest update with color coding. — [Linear docs: Initiatives](https://linear.app/docs/initiatives)
- Initiatives are on all plans. Team initiatives need Business or Enterprise; saved initiative views need Enterprise. — [Linear docs: Initiatives](https://linear.app/docs/initiatives)
- A changelog entry on 2026-07-02 added "Initiative properties". — [Linear changelog](https://linear.app/changelog/2026-07-02-initiative-properties)

**Triage, Asks, customer requests and SLAs (intake)**
- Triage is a shared inbox that captures new incoming issues such as bug reports, feature requests and other unplanned work. — [Linear: managing unplanned work](https://linear.app/learn/managing-unplanned-work) (via search summary)
- Triage responsibility, which links an on-call schedule to assign a triage owner automatically, is a Business-tier feature. — [Linear docs: making the most of Linear Business](https://linear.app/docs/making-the-most-of-linear-business); [changelog 2023-10-12](https://linear.app/changelog/2023-10-12-triage-responsibility) (via search summary)
- Linear Asks turns internal requests into issues:
  - Slack: from a message or the `/ask` command, with comments synced both ways.
  - Email: Linear-provided or custom forwarding address, with replies sent from Linear.
  - Web forms behind your identity provider (SSO): Enterprise only, as part of "Advanced Asks".
  - Templates apply default issue properties.
  - Asks is on Business and Enterprise only. — [Linear docs: Asks](https://linear.app/docs/linear-asks)
- Customer requests attach customer feedback to issues and projects:
  - Sources: Intercom (real-time), Zendesk and Front (every 12 hours), Slack, Asks, Salesforce, manual entry, Plain and Pylon, and the API.
  - Customers carry revenue, tier, size, status and owner. Issues can be sorted and filtered by customer count or revenue, and requests can be flagged "important".
  - Gating: Free gets manual and Slack requests; Business adds Asks, Intercom, Zendesk and Front; Enterprise adds Salesforce. — [Linear docs: Customer requests](https://linear.app/docs/customer-requests)
- A September 2026 case study says Commure logs and prioritizes more than 80,000 customer requests in Linear. — [spyingbee Sep 2026 roundup](https://spyingbee.com/updates/linear/2026-09), linking to [linear.app/customers/commure](https://linear.app/customers/commure)
- SLAs: admins set rules for which new issues get an SLA. A fire icon changes color as an issue nears and breaches the SLA, and Slack alerts go out 24 hours (or one business day) before a breach. — [Linear docs: SLA](https://linear.app/docs/sla.md) (via search summary)
- SLA plan tier conflicts across Linear's own docs:
  - The SLA doc says Business and Enterprise.
  - The "Small teams" guide says Enterprise only.
  - The 2023 launch was on the old Plus and Enterprise plans. — [Linear docs: SLA](https://linear.app/docs/sla.md); [Small teams guide](https://linear.app/docs/how-to-use-linear-small-teams); [changelog 2023-03-16](https://linear.app/changelog/2023-03-16-slas)

**Inbox and notifications**
- On 2026-09-03 Linear added a "Priority inbox" tab for high-impact notifications, mobile document editing, and richer diff previews. — [spyingbee Sep 2026 roundup](https://spyingbee.com/updates/linear/2026-09), linking to [changelog 2026-09-03](https://linear.app/changelog/2026-09-03-priority-inbox)
- Users can subscribe to notifications when requests are added to issues, views or customer pages. — [Linear docs: Customer requests](https://linear.app/docs/customer-requests)

**Keyboard-first UX and command menu**
- Cmd/Ctrl+K is the command menu; for example, "Find Suggestions" runs Triage Intelligence from it. Other documented shortcuts:
  - Cmd/Ctrl+Shift+I toggles Insights.
  - Cmd/Ctrl+Shift+. copies the git branch name.
  - Cmd/Ctrl+J opens the agent chat. — [Triage Intelligence docs](https://linear.app/docs/triage-intelligence); [Insights docs](https://linear.app/docs/insights); [GitHub docs](https://linear.app/docs/github); [Linear Agent changelog](https://linear.app/changelog/2026-03-24-introducing-linear-agent)
- Linear has desktop and mobile apps; Linear Agent runs in both. — [Linear Agent changelog](https://linear.app/changelog/2026-03-24-introducing-linear-agent)

### Inferences
- **Gaps that matter most for Orbit:** projects and initiatives above the epic level, a triage inbox, intake from Slack, email and forms, customer-request linking, SLAs, mobile, and saved custom views.
- **Rough parity:** Orbit's sprint start and complete, the move-incomplete-issues step, and the velocity report roughly match Linear cycles. Linear adds automatic scheduling, cooldowns and a capacity forecast.
- **Orbit's differentiators:** Linear has no whiteboard or flowchart, no mind map or idea voting, no timesheets, and no Gantt view in the sources reviewed. Treat this as "not found", not "confirmed absent".

### Gaps
- I did not fetch the docs for labels, priorities, estimates, sub-issues, issue relations (blocks, related, duplicate), templates, documents, project updates, or custom views and saved filters. Linear is widely known to have all of these, but this session did not verify current details, so they are not cited here.
- I found no source on whether Linear has custom fields or fully custom statuses per team in 2026.
- I could not confirm whether Linear has native time tracking or a Gantt or timeline view. A project timeline exists from earlier knowledge but was not verified here.

## 2. AI and agent features, MCP, API, webhooks and OAuth

### Takeaway
By late 2026 Linear's AI is a core part of the product:
- **Linear Agent** (chat, skills, automations, codebase-aware), launched March 2026.
- **Coding sessions** that write code with Claude Code and Codex and open PRs, from June 2026.
- **Loops**, recurring background agents, from July 2026.
- **Triage Intelligence**, which suggests issue routing.
- **Third-party agents** as assignable workspace members.
- A **hosted MCP server**, a **GraphQL API**, **webhooks** and **OAuth 2.0 with PKCE**.

Orbit has none of these.

### Cited Findings
**Linear Agent (first-party), public beta from 2026-03-24**
- What it does:
  - Gathers context from the roadmap, issues and code.
  - Finds and groups related issues into projects.
  - Pulls common requirements out of customer requests and drafts specs.
  - Creates and assigns issues from discussions.
  - Drafts project updates.
  - Spots repeated themes in the backlog and flags at-risk work. — [changelog: Introducing Linear Agent](https://linear.app/changelog/2026-03-24-introducing-linear-agent)
- Where it runs: desktop and mobile apps (Cmd/Ctrl+J), @Linear mentions in comments, Slack, and Microsoft Teams. — [same](https://linear.app/changelog/2026-03-24-introducing-linear-agent)
- Skills: a successful conversation can be saved as a reusable skill, run with a slash command or applied automatically. — [same](https://linear.app/changelog/2026-03-24-introducing-linear-agent)
- Automations start agent workflows when issues enter Triage (Business and Enterprise). — [same](https://linear.app/changelog/2026-03-24-introducing-linear-agent)
- Pricing at launch: Agent and Skills on all plans, free during the beta. Linear expects chat to stay in the seat price at general availability, while automations and Code Intelligence may move to usage-based pricing. — [same](https://linear.app/changelog/2026-03-24-introducing-linear-agent)

**Code Intelligence (2026-05-14)**
- Gives Linear Agent controlled access to repositories, so it can diagnose features, design technical specs, and answer non-engineers' questions about ownership and recent changes. Business and Enterprise only. — [changelog: Code Intelligence](https://linear.app/changelog/2026-05-14-code-intelligence); [Agent launch post](https://linear.app/changelog/2026-03-24-introducing-linear-agent)

**Coding sessions (2026-06-11)**
- Linear Agent writes code using Claude Code and Codex in a cloud sandbox. You start a session by assigning the issue to Linear or asking in chat, a comment or a Slack thread. It returns a diff with preview links and iterates in the same thread. — [changelog: Coding sessions](https://linear.app/changelog/2026-06-11-coding-sessions)
- In Triage settings, an agent can investigate new bug reports, pull evidence from Sentry or Datadog over MCP, and attempt a fix. Linear says this resolves about 30% of its own incoming bug reports, mostly on the first pass. This is a vendor-reported figure. — [same](https://linear.app/changelog/2026-06-11-coding-sessions)
- Requires a GitHub connection and consumes AI credits. Cost: model tokens at provider rates with no markup, plus $0.25 per 20-minute sandbox block. — [Coding sessions changelog](https://linear.app/changelog/2026-06-11-coding-sessions); [AI credits docs](https://linear.app/docs/ai-credits)
- On 2026-09-24 Linear added controls for the coding agent: adaptive model routing, access to environment secrets, and support for open-weight models. — [spyingbee Sep 2026](https://spyingbee.com/updates/linear/2026-09), linking to [changelog](https://linear.app/changelog/2026-09-24-new-controls-for-linear-coding-agent)

**Loops (changelog URL dated 2026-07-20)**
- You describe a recurring job in plain language and it runs on a schedule or an event trigger. Examples: triaging issues and dispatching them to coding agents, turning meeting notes or incidents into follow-ups, and keeping specs current. — [changelog: Introducing Loops](https://linear.app/changelog/2026-07-20-introducing-loops)
- "Loops for product management" (2026-09-14) react to initiative, project and cycle changes by updating docs and posting to Slack. — [spyingbee Sep 2026](https://spyingbee.com/updates/linear/2026-09)
- Plan gating conflicts by date:
  - The Loops changelog says "all plans".
  - A search summary of Linear content said Business and Enterprise.
  - A pricing tracker reports Loops added to the Basic plan card around October 2026.
  - The AI credits docs now list Free, Basic, Business and Enterprise. — [Loops changelog](https://linear.app/changelog/2026-07-20-introducing-loops); [usagepricing 2026-10-06](https://www.usagepricing.com/blueprint/activity/linear-2026-10-06-loops-basic-plan); [AI credits docs](https://linear.app/docs/ai-credits)
- Cost is about $0.07–$0.20 per run without a coding session. — [AI credits docs](https://linear.app/docs/ai-credits)

**AI credits model**
- AI credits are an opt-in, prepaid, workspace-level balance in USD. Only coding sessions and Loops use them; other AI features are included in the plan.
  - Top-up minimum is $10; auto-reload minimum is $50.
  - Only admins can buy, by credit card only.
  - Credits expire 12 months after purchase. — [Linear docs: AI credits](https://linear.app/docs/ai-credits)

**Triage Intelligence (Business and Enterprise)**
- LLMs suggest team, project, assignee and labels from history and content, and surface semantically similar duplicate or related issues. It takes about 1–4 minutes per issue, and you can view the reasoning behind each suggestion. — [Linear docs: Triage Intelligence](https://linear.app/docs/triage-intelligence)
- For each property, a team can show, hide or auto-apply suggestions, optionally only for specific values. Guidance can be set at workspace, team or sub-team level. It can also run on non-triage issues via Cmd+K "Find Suggestions". Other plans get only lighter search-based suggestions. — [same](https://linear.app/docs/triage-intelligence)
- AI-written titles and descriptions for `{TEAM}-NEW` issues created from PRs need Business or Enterprise. — [Linear docs: GitHub](https://linear.app/docs/github)

**Third-party agents ("Linear for Agents")**
- Agents install through OAuth with `actor=app`, which needs a workspace admin. They can be @mentioned or assigned; assignment makes the agent the "delegate" while a human stays assignee.
  - Agents cannot be project leads or members.
  - Agent sessions are created automatically and driven by AgentSessionEvent webhooks. Linear recommends a "thought" activity within 10 seconds, and `promptContext` provides issue context.
  - Scopes: `app:assignable`, `app:mentionable`, `customer:*`, `initiative:*`.
  - Agents do not count as billable users. — [Linear developers: Agents](https://linear.app/developers/agents)
- Agent integrations listed in September 2026: Devin, Factory (Droids), Warp, Charlie, Tembo, ChatPRD and Ranger. Linear's marketing presents agents as workspace members. — [spyingbee Sep 2026](https://spyingbee.com/updates/linear/2026-09), linking to [linear.app/agents](https://linear.app/agents) and [linear.app/integrations/devin](https://linear.app/integrations/devin)

**MCP server**
- Endpoint `https://mcp.linear.app/mcp` is read-write; `/mcp/readonly` exposes read tools only. Transport is Streamable HTTP; the SSE endpoint `/sse` is deprecated.
- Auth: OAuth 2.1 with dynamic client registration, or a Bearer API key or token. A read-only API key option exists, and Okta enterprise-managed auth is supported.
- Tools find, create and update issues, projects, comments and documents.
- Supported clients: Claude, Claude Code, Codex, Cursor, VS Code, Windsurf, Zed and v0, plus `mcp-remote` for others. — [Linear docs: MCP](https://linear.app/docs/mcp)

**GraphQL API, webhooks and OAuth (updates around September 2026)**
- API: cursor-based pagination, expanded filtering (case-insensitive matching, OR logic), complexity-based rate limiting with tracking headers, and a deprecation directive. — [spyingbee Sep 2026](https://spyingbee.com/updates/linear/2026-09), linking to [pagination](https://linear.app/developers/pagination), [filtering](https://linear.app/developers/filtering), [rate limiting](https://linear.app/developers/rate-limiting) and [deprecations](https://linear.app/developers/deprecations)
- Webhooks cover more resource types, including projects, documents and cycles. — [same](https://linear.app/developers/webhooks)
- The API has Customer and CustomerNeed objects and mutations. — [same](https://linear.app/developers/managing-customers)
- OAuth 2.0 supports PKCE, refresh tokens and new scopes. — [same](https://linear.app/developers/oauth-2-0-authentication)
- A TypeScript SDK exists; the sample agent "Weather Bot" uses it with Cloudflare. — [Linear developers: Agents](https://linear.app/developers/agents)

### Inferences
- **Where the market is:** in 2026, AI-native issue tracking means issue-to-PR coding agents, background automations billed per use, and an open agent platform. Orbit has no API, so it cannot take part in that ecosystem at all.
- **Smallest first step for Orbit:** a public API with keys, then webhooks, then an MCP server. Linear's MCP server shows how small the minimum can be: CRUD on issues, projects, comments and docs over Streamable HTTP with OAuth or a bearer key.
- **Pricing model to copy:** Linear's split puts chat and suggestions in the seat price and meters agent runs through credits.

### Gaps
- I did not fetch Linear's AI features for issue or thread summaries, similar-issue detection outside Triage, or "product intelligence" directly. The duplicate-detection evidence comes from the Triage Intelligence doc only.
- The exact plan gating of Linear Agent at general availability (if GA has happened) is unconfirmed.
- I did not find API rate-limit numbers or the personal API key policy.

## 3. Integrations and import tools

### Takeaway
Linear's GitHub integration is deep: magic-word PR and commit linking, automatic status changes per branch, and two-way issue sync. It also has support-desk integrations (Intercom, Zendesk, Front, Salesforce), Slack and Teams, Sentry, and dedicated importers for Jira, Asana, Shortcut and GitHub. Orbit has no integrations or importers.

### Cited Findings
**GitHub**
- Linking: PRs link through Linear's branch name or magic words in titles and descriptions:
  - Closing words ("Fixes ENG-123") and non-closing words ("refs") each act differently on status.
  - "skip" or "ignore" before an ID opts out of linking.
  - `{TEAM}-NEW` creates and links a new issue.
  - Commits link through magic words (In Progress on push, Done on reaching the default branch).
- Status rules: the default moves an issue to In Progress when a PR opens and to Done on merge, configurable per team. Rules can be set per target branch with regex (for example, staging moves the issue to "In QA"). Cancelling an issue closes linked PRs. — [Linear docs: GitHub](https://linear.app/docs/github)
- Issue sync: one-way or two-way. Two-way sync is limited to one repo per team and covers title, description, status, assignee, labels, sub-issues, priority and comments. Only new issues sync; existing ones need the importer. — [same](https://linear.app/docs/github)
- GitHub Enterprise Cloud and Server need the Enterprise plan; Server has no commit linking or sync. — [same](https://linear.app/docs/github)

**Support desks and other tools**
- Intercom, Zendesk and Front need Business; Salesforce Service Cloud needs Enterprise; Plain and Pylon are third-party options. — [Linear docs: Customer requests](https://linear.app/docs/customer-requests)
- Sentry: create or link issues from exceptions and alerts. — [spyingbee Sep 2026](https://spyingbee.com/updates/linear/2026-09), linking to [linear.app/integrations/sentry](https://linear.app/integrations/sentry)
- Slack and Microsoft Teams: Linear Agent chat, Asks intake and SLA alerts. — [Agent changelog](https://linear.app/changelog/2026-03-24-introducing-linear-agent); [Asks docs](https://linear.app/docs/linear-asks)

**Importers**
- Jira, GitHub Issues, Asana, Shortcut, Linear-to-Linear, and a CLI importer.
  - Admins only.
  - Users can be mapped, skipped or created.
  - Imports can go into an existing or a new team, and can be bulk-deleted for a limited time.
  - No ongoing sync; re-imports skip issues already imported. — [Linear docs: Import](https://linear.app/docs/import-issues)

### Inferences
- **GitHub first:** GitHub linking with automatic status is the most-used developer integration and fits Orbit's existing GitHub sign-in. GitLab sign-in is a natural follow-on.
- **Import tools:** a Jira or CSV importer lowers switching costs, and Linear treats importers as basic infrastructure.

### Gaps
- I did not verify the Linear GitLab integration, Figma integration or Zendesk details in this session. GitLab is not mentioned in the GitHub doc.
- I did not get the full integrations directory count.

## 4. Insights and analytics

### Takeaway
Linear Insights (Business and Enterprise) is an analytics panel that works on any view, rather than fixed reports. It measures count, effort, cycle time, lead time, triage time and issue age, with slice and segment controls and CSV export. Orbit's fixed reports (burndown, velocity, workload, time by project) cover sprint metrics. Linear goes further on flow metrics (cycle, lead and triage time) and on ad-hoc slicing.

### Cited Findings
- Measures and chart types:
  - Bar charts: issue count and effort.
  - Scatterplots with p25, p50, p75 and p95 markers: cycle time, lead time, triage time and issue age.
  - Burn-up (cumulative flow) charts, monthly or weekly. — [Linear docs: Insights](https://linear.app/docs/insights)
- Controls: Measure (y-axis), Slice (x-axis) and an optional Segment (color). Filters cover created and completed date, status type, label, project and team, with options to include archived issues and exclude no-priority issues. — [same](https://linear.app/docs/insights)
- Insights is a right-sidebar panel on issue, custom, team, project and cycle views. It supports a share link, CSV export and full screen. The docs describe no separate dashboards. Plan: Business and Enterprise. — [same](https://linear.app/docs/insights)
- Cycle graphs show effort and scope over time and a success percentage, and the capacity dial is velocity-based. — [Linear docs: Cycles](https://linear.app/docs/use-cycles)
- Project and initiative progress comes from update-based health (on track, at risk, off track) that rolls up. — [Linear docs: Initiatives](https://linear.app/docs/initiatives)

### Inferences
- **Cheap wins for Orbit:** cycle time and lead time scatterplots, and a status-update health field on epics or projects.
- **Where Orbit already leads:** time tracking and timesheets have no counterpart in Linear's analytics sources reviewed.

### Gaps
- No source here confirms whether Linear added standalone dashboards in 2026.

## 5. What users praise and complain about

### Takeaway
Users praise speed, design, keyboard UX and its developer focus. The main complaint is that its opinionated, low-customization model does not fit non-standard processes, followed by limited automations. Evidence was thin: Reddit and Hacker News threads did not surface in search, G2 blocked fetching, and some sources are vendor blogs.

### Cited Findings
- G2 reviewers: "Linear is opinionated by design, which is great for speed but can be frustrating if your team's workflow doesn't fit its assumptions." Another reviewer: "fewer configuration options, but what's there is well-designed and fast to learn." — [G2 review](https://www.g2.com/products/linear/reviews/linear-review-11207982); [G2 review](https://www.g2.com/products/linear/reviews/linear-review-9370144) (via search summary, not fetched directly)
- Product Hunt comments say the rigid structure limits roadmap planning, custom workflows, multiple assignees, swim lanes and some sprint views. — [Product Hunt shoutouts](https://www.producthunt.com/products/linear/shoutouts/347162) (via search summary)
- A reviewer on Subscribed.fyi: the workflow "feels a bit like a cage" if you want to customize. — [Subscribed.fyi](https://subscribed.fyi/linear/reviews/linear-review-6486) (via search summary)
- A G2 reviewer finds automations too limited and wants low-code workflows. This is a single review. — [G2 pricing/reviews](https://www.g2.com/products/linear/pricing) (via search summary)
- A Blind thread contrasts Jira, which is slow on large instances, with Linear, which is much faster. — [Blind](https://www.teamblind.com/post/why-is-jira-so-painful-4lu1rhtv) (via search summary)
- Linear's leadership calls opinionated software central to the "Linear Method". — [Figma blog](https://www.figma.com/blog/the-linear-method-opinionated-software/)
- A vendor blog (ONES, a competitor) reports that Reddit favors Linear for speed and developer experience, and Jira for large enterprises. Treat it with caution. — [ONES blog](https://ones.com/blog/linear-vs-jira-reddit-verdict-what-real-users-actually-recommend/)

### Inferences
- **Where Orbit can win:** Linear's gaps in customization (custom fields and statuses, multiple assignees, swim lanes) are things Orbit also lacks. Orbit could stand out by adding flexibility while keeping speed.
- **Existing differentiators:** whiteboards, ideas with voting, and time tracking already target needs Linear doesn't cover.

### Gaps
- I could not retrieve Hacker News or Reddit threads, or G2 aggregate rating and review counts (G2 returned 403).
- I found no user sentiment specifically on Linear's 2026 AI and agent features or AI credit pricing.

## 6. Pricing tiers and feature gating

### Takeaway
Seat prices (annual billing, per user per month): Free $0, Basic $10, Business $16, Enterprise custom. Third-party trackers confirm these, but the Linear pricing page did not render. The heavy features sit in Business: Insights, Asks, Triage Intelligence, the support-desk integrations, Code Intelligence and agent automations. Enterprise adds SAML, Salesforce, GitHub Enterprise, web-form Asks and saved initiative views. Coding sessions and Loops are metered through prepaid AI credits.

### Cited Findings
- Prices are Free $0; Basic $10 annual ($12 monthly); Business $16 annual; Enterprise custom. A snapshot dated 2026-10-23 shows the same seat prices. — [usagepricing 2026-10-06](https://www.usagepricing.com/blueprint/activity/linear-2026-10-06-loops-basic-plan); [Activepieces, 2026-10-29](https://www.activepieces.com/blog/linear-app-pricing-every-plan-and-seat-cost-2026.md)
- Price history for Business: $12 (Oct 2024), then $14 (Dec 2024), then $16 (Jan 2026). Basic was earlier $8 and called "Standard". Older listings ($8 and $14) are outdated. — [Activepieces](https://www.activepieces.com/blog/linear-app-pricing-every-plan-and-seat-cost-2026.md); [WebSearch summary of costbench and joinsecret](https://www.costbench.com/changelog/linear-plans-renamed-2026-02/)
- The Activepieces article contradicts itself ($16 vs $18 monthly for Business), so I would confirm on Linear's page. — [Activepieces](https://www.activepieces.com/blog/linear-app-pricing-every-plan-and-seat-cost-2026.md)
- Free plan limits:
  - 250 issues: after downgrading, a workspace with more than 250 issues cannot create new ones.
  - Everyone on Free is an Admin.
  - Third-party sources say 2 teams (vs 5 on Basic), but this is not confirmed on Linear's site. — [Linear docs: Billing](https://linear.app/docs/billing-and-plans); [search summary of pricing trackers](https://automationatlas.io/answers/linear-pricing-2026/)
- Billing and discounts:
  - Billed per unsuspended user; Enterprise is yearly only.
  - Education: free for a year for students; 75% off for staff.
  - Non-profits: 75% off Basic and Business.
  - Startups: up to 6 months of Business free. — [Linear docs: Billing](https://linear.app/docs/billing-and-plans)
- Admin roles and Google SSO start at Basic; SAML is Enterprise; guests are billed as paid seats. — [Activepieces](https://www.activepieces.com/blog/linear-app-pricing-every-plan-and-seat-cost-2026.md) (marked unconfirmed by the source itself)
- Gating confirmed in Linear docs:
  - Business and Enterprise: Insights, Asks, Triage Intelligence, team initiatives, AI-written `{TEAM}-NEW` issues, Code Intelligence, Agent triage automations, and the Intercom, Zendesk and Front integrations.
  - Enterprise: Advanced Asks (web forms), Salesforce, GitHub Enterprise, and saved initiative views.
  - SLAs: Business or Enterprise; the docs conflict.
  - Coding sessions and Loops: credits on all current plans (legacy plans excluded). — [Insights](https://linear.app/docs/insights); [Asks](https://linear.app/docs/linear-asks); [Triage Intelligence](https://linear.app/docs/triage-intelligence); [Initiatives](https://linear.app/docs/initiatives); [GitHub](https://linear.app/docs/github); [Customer requests](https://linear.app/docs/customer-requests); [Agent changelog](https://linear.app/changelog/2026-03-24-introducing-linear-agent); [AI credits](https://linear.app/docs/ai-credits)
- Promotional credits: $20 per seat at the Loops launch, expiring 2026-08-20 (now expired). — [Loops changelog](https://linear.app/changelog/2026-07-20-introducing-loops)

### Inferences
- **Upsell split:** Linear charges for intake, analytics and AI routing at Business ($16), but keeps the core tracker cheap. Orbit's gaps line up with what Linear charges for at Business.

### Gaps
- I could not read linear.app/pricing directly (rendered by JavaScript). The exact Free, Basic and Business team limits, file upload limits, SCIM and audit log gating, and private team gating are unverified.
