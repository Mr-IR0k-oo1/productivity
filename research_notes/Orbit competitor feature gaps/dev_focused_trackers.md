# Developer-focused and open-source issue trackers vs Orbit (Plane, Shortcut, GitHub Projects/Issues, YouTrack, Huly, Taiga, Zoho Sprints)

Research date: 2026-10-31. Primary sources were used where reachable; aggregator sources are flagged. G2 blocked fetching (HTTP 403), and taiga.io/pricing returned 404, so some review and pricing data comes from secondary summaries.

## Plane: cycles, modules, pages, intake, work item types, custom properties, epics, initiatives, AI, MCP, API, importers, self-hosting, pricing

### Takeaway
Plane is the closest open-source analogue to Orbit. It already ships almost everything on Orbit's "NO" list: epics as a work item type with enforced hierarchy, custom properties, intake forms/email, wiki, initiatives, workflows with approvals, webhooks v2, AI agents and credits, an official MIT-licensed MCP server, a Cursor agent, and importers from Jira, Linear, Asana, ClickUp and CSV. Pricing: Free (12 users), Pro $6/$8, Business $13/$15 per user per month (annual/monthly).

### Cited Findings
- Plans: Free $0 (up to 12 users); Pro $6/user/mo annual or $8 monthly; Business $13 annual or $15 monthly; Enterprise Grid custom and marked "Coming soon" — [Plane pricing](https://plane.so/pricing)
- Aggregators agree on $6/$13 annual (CostBench says it cross-checked the official page on 2026-06-13). TrustRadius lists "starting at $29", which conflicts and is likely stale — [CostBench](https://costbench.com/software/contractor-management/plane-so/); [TrustRadius](https://www.trustradius.com/products/plane/pricing)
- Cycles and Modules are included on every tier, Free included — [Plane pricing](https://plane.so/pricing)
- Pages/Wiki: Free gets Pages only. Pro adds "Workspace Wiki". Business adds Wiki, Nested Pages and Shared Pages — [Plane pricing](https://plane.so/pricing)
- Intake: Free and Pro have "Intake In-app" only. Business adds Intake Forms, Intake Email and "Intake Responsibility" (triage owner) — [Plane pricing](https://plane.so/pricing)
- Work item types and properties start at Pro. Custom properties are project-level on Pro and Business; Enterprise adds workspace-level properties with roll-ups — [Plane pricing](https://plane.so/pricing)
- Initiatives start at Pro. Teamspaces are Basic on Pro and Advanced on Business — [Plane pricing](https://plane.so/pricing)
- Workflows: Business gets a "Single Workflow"; Enterprise gets "Multiple Workflows + Approvals" — [Plane pricing](https://plane.so/pricing)
- Time tracking: "Time Tracking and Work Logs" on Pro, with time approvals on Business and above — [Plane pricing](https://plane.so/pricing)
- Dashboards: Basic on Pro, "Dashboards with Advanced Widgets" on Business — [Plane pricing](https://plane.so/pricing)
- AI: Pro includes 500 AI credits per seat, Business 1,000 per seat, Enterprise "Flexible AI credits". "AI Agents" are listed from Pro up — [Plane pricing](https://plane.so/pricing)
- Importers: Free covers Jira, Linear, Asana, ClickUp and CSV. Pro adds workspace member import. Business adds Confluence and Notion — [Plane pricing](https://plane.so/pricing)
- Changelog of 2026-05-31: Epics are now a regular work item type with custom properties, filters and relations. Admins can define parent-child rules between types (Epic > Story > Task); invalid nesting is blocked, and the setting can't be disabled once on — [Plane changelog 2026-05-31](https://plane.so/changelog/2026-05-31-epics-work-item-type-publish-mcp-apps)
- The same release added webhooks v2 (one webhook carries related events, coexisting with v1), a "Send webhook" step in workflow automations, publishing MCP applications through the API and UI, a Cursor agent (view and update work items, link branches, open PRs linked back to work items), due-date reminders, private dashboards, bulk CSV member import, and custom properties as spreadsheet columns — [Plane changelog 2026-05-31](https://plane.so/changelog/2026-05-31-epics-work-item-type-publish-mcp-apps)
- MCP server: official, open source (MIT), hosted endpoint. Tools cover work items (create, update, search, comment, attach, link, relate, nest, log time) and planning (cycles, modules, milestones, initiatives). The hosted server only reaches Plane Cloud; self-hosted instances use local mode or run their own server — [Plane developer docs: MCP server](https://developers.plane.so/dev-tools/mcp-server.md); [Plane docs: MCP server](https://docs.plane.so/ai/mcp-server)
- An older community MCP server on Glama says epics, initiatives and teamspaces are Commercial/Cloud-only and omits them. It predates the official server — [Glama](https://glama.ai/mcp/servers/goto-software/plane-mcp-server/tree)
- Self-hosting complaint: users find the feature split between self-hosted and paid tiers "very ambiguous", including whether there's a user cap — [GitHub discussion #4532](https://github.com/orgs/makeplane/discussions/4532)
- Self-hosted support issues on Plane's forum include OAuth toggles resetting, HTTPS defaulting to HTTP, and questions about the archived MinIO dependency — [Plane forum, self-hosted](https://forum.plane.so/c/support/self-hosted/7)
- Plane positions self-hosting as its main differentiator over cloud-only Linear (vendor marketing) — [Plane vs Linear](https://plane.so/plane-vs-linear)

### Inferences
- Plane's 2026 trajectory sets the benchmark for an "open Linear/Jira": typed hierarchy plus custom properties plus workflows plus AI/MCP. Orbit's epics/stories/tasks/bugs types would compete directly with Plane's work item types, but Plane adds configurable properties and enforced hierarchy rules.
- Plane gates a lot behind paid tiers: custom properties, wiki, intake forms, workflows. An open-source or self-hosted Orbit could stand out by putting those in the base product.

### Gaps
- I couldn't confirm the "Plane AI" or "Pi" product names, or exactly what the AI agents do; neither the pricing page nor the May 2026 changelog names them.
- I couldn't confirm the names of the self-hosting editions (Community, Commercial, Airgapped) from 2026 primary sources.
- API and webhook tier placement isn't shown on the pricing page.

## Shortcut: stories, iterations, epics, objectives, docs, Korey AI, GitHub integration, API/webhooks

### Takeaway
Shortcut's model is Stories, Epics, Iterations and Objectives, plus Docs and Roadmap even on the free tier. Its AI story is "Korey", an agent that writes stories and acceptance criteria and assigns work to human or AI teammates. It also has an MCP server and REST API v3 with outgoing webhooks. The most common user complaint is weak reporting.

### Cited Findings
- Plans: Free $0 (10 users, 1 workspace, 1 team, 1 workflow, 5 GB). Team $8.50/user (up to 5 teams and 5 workflows, 250 GB). Business $12/user (unlimited workspaces, teams and workflows). Enterprise custom. Yearly billing saves "up to 25%" — [Shortcut pricing](https://www.shortcut.com/pricing)
- Free includes Kanban, Roadmap, Reports, Iterations, Docs, and GitHub/Slack/Figma integrations. Team adds WIP limits, multiple workflows, Automations and all integrations. Business adds Objectives and key results, advanced Custom Fields, advanced Reports, and multiple workspaces for sandboxing. Enterprise adds SSO/SCIM — [Shortcut pricing](https://www.shortcut.com/pricing)
- The comparison table lists "AI Agent Collaboration", an MCP Server, GitHub/GitLab/Bitbucket integrations, basic custom fields and a Metrics dashboard, but its tier markers were unclear in the extracted page — [Shortcut pricing](https://www.shortcut.com/pricing)
- Korey is an "AI agent for product development". It writes user stories, breaks work into tasks, defines acceptance criteria, assigns work to "human or AI teammates", finds stories, summarizes completed work, and reports on the current iteration. It's labeled "New", with sign-up at korey.ai. No Korey-specific price or launch date is given — [Shortcut Korey page](https://www.shortcut.com/korey)
- Shortcut exposes REST API v3 for custom integrations and automations, and the trial FAQ mentions outgoing webhooks — [Shortcut Korey page](https://www.shortcut.com/korey); [Shortcut pricing](https://www.shortcut.com/pricing)
- Reviews: G2 shows 4.4/5 from 177 reviews; Capterra lists 363 reviews. Reporting is the most common complaint, alongside requests for better mobile and cross-team collaboration. Ease of use and a clean UI get praise (summarized via search; G2 blocked direct fetch) — [Capterra Shortcut reviews](https://www.capterra.com/p/160498/Shortcut/reviews/); [G2 Shortcut](https://www.g2.com/products/clubhouse/reviews); [GetApp](https://www.getapp.com/project-management-planning-software/a/shortcut/)
- Some reviewers found the number of options distracting for small teams — [G2](https://www.g2.com/products/clubhouse/reviews)

### Inferences
- Shortcut gives away Docs, Roadmap and Iterations for free and puts Objectives/OKRs on the Business tier. That suggests docs and a roadmap are baseline expectations, while OKRs are an upsell.
- Korey's "assign to AI teammate" mirrors GitHub's assign-to-Copilot pattern. Agent assignees are becoming a common idea across trackers.

### Gaps
- I couldn't fetch Shortcut's developer docs for webhook event lists or MCP server details.
- I found no Hacker News or Reddit sentiment about Korey specifically.

## GitHub Projects/Issues: sub-issues, issue types, iterations, custom fields, insights, Copilot coding agent, MCP server

### Takeaway
By 2026 GitHub Issues has sub-issues, org-level issue types, issue dependencies, and (GA July 2026) org-level typed "issue fields". Projects adds iteration fields, a roadmap layout, and up to 50,000 items. Copilot can take issues and open PRs, including issues from Jira and Linear, and the GitHub MCP server reads and writes issue fields. GitHub still has no velocity or burndown reports, and older threads complain about the lack of native sprints.

### Cited Findings
- Sub-issues and issue types became GA in 2025, and the project item limit rose from 1,200 to 50,000 — [GitHub changelog 2025-04-08](https://github.blog/changelog/2025-04-08-evolving-github-issues-and-projects/)
- Issue fields entered public preview on 2026-03-12 with single-select, text, number and date types, up to 25 per org — [GitHub changelog 2026-03-12](https://github.blog/changelog/2026-03-12-issue-fields-structured-issue-metadata-is-in-public-preview/)
- Issue fields went GA on 2026-07-02. Every org gets default fields (Priority, Effort, Start date, Target date), which can be configured per issue type and shown on the repo issues list. They work in public projects with visibility controls, are readable and settable through the GitHub MCP server, and are available on Free, Team and Enterprise plans. Over 40,000 orgs had adopted them, and GHES support arrives in 3.23 — [GitHub changelog 2026-07-02](https://github.blog/changelog/2026-07-02-issue-fields-are-now-generally-available)
- GitHub CLI v2.94.0 (2026-06-10) can set and filter issue types, link parent/sub-issues with `--parent`, and manage dependencies — [GitHub changelog 2026-06-10](https://github.blog/changelog/2026-06-10-manage-sub-issues-types-and-dependencies-from-github-cli/)
- Iteration fields can be any length, can include breaks, and support filters like `@current`, `@previous` and `@next`. Grouping a view by iteration lets you bulk-move a group's items to another iteration, which is how unfinished work rolls over. Iterations can also show on the roadmap layout — [GitHub Docs: iteration fields](https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-iteration-fields)
- Assign to Copilot: a one-click "Assign to Copilot" lets you pick the repo, base branch and extra instructions (September 2025) — [GitHub changelog 2025-09-23](https://github.blog/changelog/2025-09-23-pick-the-repository-and-base-branch-when-assigning-issues-to-copilot)
- The Copilot coding agent for Linear entered public preview in October 2025 (draft PRs, progress updates in Linear). The Jira version entered public preview in March 2026 — [GitHub changelog 2025-10-28](https://github.blog/changelog/2025-10-28-github-copilot-for-linear-available-in-public-preview); [GitHub changelog 2026-03-05](https://github.blog/changelog/2026-03-05-github-copilot-coding-agent-for-jira-is-now-in-public-preview/)
- Current docs: the coding agent plans, edits, and runs tests and linters in a cloud environment, opening one PR per task. "Agent Merge" can fix failing Actions runs and merge conflicts. Work can be delegated from Slack and Teams. Repository and personal MCP servers extend its context. A new "Copilot in the cloud" experience is available to paid Copilot plans from 2026-10-28 — [GitHub Docs: about coding agent](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent)
- Complaints: the lack of native sprints, with milestones used as a workaround (Mozilla Test Pilot forum post, old and pre-iteration-fields). An Eclipse Che contributor said sprint planning in Jira is a simple query but in GitHub is just a list of issues. Vendor pages cite missing velocity/burndown, weak cross-repo views and limited automation — [Mozilla Discourse](https://discourse.mozilla.org/t/test-pilot-is-trying-out-github-projects-this-sprint/11402) (OLD); [Eclipse che-dev](https://www.eclipse.org/lists/che-dev/msg04036.html) (OLD); [ONES blog](https://ones.com/blog/?p=1103118) (vendor)

### Inferences
- The "no sprints" complaint is partly outdated because iteration fields exist. The lack of built-in burndown and velocity charts doesn't appear addressed in the sources found, and Orbit already has both.
- GitHub's default field set (Priority, Effort, Start date, Target date) is a good minimum spec for Orbit custom fields.
- "Assign issue to an AI agent that opens a PR" is now available from GitHub itself and through Jira and Linear. A tracker with no GitHub integration or agent hook (Orbit) will look dated to developer teams.

### Gaps
- I didn't fetch current details on Projects "Insights" charts. As far as I know they're configurable bar, line and stacked charts with historical data, but I didn't verify 2026 status.
- I didn't fetch primary docs for the GitHub MCP server's full toolset; it's confirmed only through the issue-fields and coding-agent pages.
- I found no recent Hacker News thread.

## JetBrains YouTrack: workflows scripting, helpdesk, knowledge base, time tracking, AI assistant

### Takeaway
YouTrack is the most "all-in-one for dev teams" of the group. It has scriptable workflows (now with TypeScript typings), a built-in helpdesk with SLAs and customer groups, a knowledge base, Gantt charts, whiteboards, an AI assistant included free on weekly-replenished credits, and (2026.2) OAuth-style MCP access for agents like Claude Code. It also imports from ClickUp and Asana.

### Cited Findings
- YouTrack 2026.2 (released 2026-06-23 per ComponentSource) added Helpdesk customer groups. Reporters can be grouped by company, team or org (manually or by email domain), each group can have its own SLAs, support teams and rules, and members of a group can see and comment on each other's tickets. Free tier: unlimited reporters and 3 agents — [YouTrack What's New](https://www.jetbrains.com/youtrack/whatsnew/); [ComponentSource](https://www.componentsource.com/product/youtrack/releases/2969381)
- 2026.2 MCP: admins can set up MCP access without permanent tokens, and users sign in with their YouTrack account from tools like ChatGPT desktop and Claude Code — [YouTrack What's New](https://www.jetbrains.com/youtrack/whatsnew/)
- 2026.2 whiteboards gained auto-layout based on dependencies, interactive widgets, multi-card commands and undo/redo. Gantt charts were redesigned, with task creation from the timeline and adding backlog items through search — [YouTrack What's New](https://www.jetbrains.com/youtrack/whatsnew/)
- 2026.2 added built-in import from ClickUp and Asana, with "continuous import" that keeps data in sync during migration — [YouTrack What's New](https://www.jetbrains.com/youtrack/whatsnew/)
- 2026.2 developer tools: TypeScript for apps, a scaffolding command, a `@jetbrains/youtrack-workflow-types` package for workflow typings, and GitHub App authentication for VCS integration — [YouTrack What's New](https://www.jetbrains.com/youtrack/whatsnew/)
- Marketplace apps include Smart Sprint Planner, Better Backlog, Test Manager, Time in State, Knowledge Base exporters, and "Webhook Triggers by JetBrains" — [YouTrack What's New](https://www.jetbrains.com/youtrack/whatsnew/)
- AI Assistant: a "Summarize this issue" action, summaries and action items from selected text, turning selected text into multiple new issues, and comment drafting and tone adjustment. It needs a description to work — [YouTrack Help: AI assistant](https://www.jetbrains.com.cn/en-us/help/youtrack/cloud/ai-assistant.html); [YouTrack AI feature page](https://jetbrains.com/youtrack/features/ai_assistant.html)
- AI is included in YouTrack Cloud, free teams included, through credits replenished weekly (per search summary of JetBrains pages) — [YouTrack buy page](https://jetbrains.com/youtrack/buy)
- Pricing: a price increase and new plans took effect 2025-10-01. A secondary source puts YouTrack Cloud at $5.40/user/mo, or about $4.50 averaged annually; unverified on the official page — [SecurityOnline](https://securityonline.info/jetbrains-youtrack-price-hike-new-plans-features-arrive-october-1-2025/); [YouTrack pricing blog tag](https://blog.jetbrains.com/youtrack/tag/new-pricing-model)

### Inferences
- YouTrack's "text selection → multiple issues" AI action, and its helpdesk-in-tracker, are distinctive ideas Orbit could borrow. Orbit's ideas board already resembles an intake surface; a public request form plus ticket portal would extend it.
- Sign-in-based MCP auth (no long-lived tokens) is a good pattern if Orbit builds an MCP server.

### Gaps
- I couldn't get the official free-tier user limit or per-user price; the buy page content didn't render.
- I didn't verify the details of core time tracking (work items, timesheets) or the knowledge base from 2026 docs.

## Huly, Taiga, Zoho Sprints: notable distinctive features

### Takeaway
Huly bundles tracker, docs, chat and video calls with per-workspace (not per-user) pricing; its AI is still "TBD". Taiga is a mature AGPL Scrum/Kanban tool with per-role estimation and team-health dashboards, but development appears quiet. Zoho Sprints is a cheap, feature-dense Scrum tool with mobile apps, meetings, client portals, release management, OKRs, test cases and Zia/OpenAI/Anthropic AI options.

### Cited Findings
**Huly**
- Pricing is per workspace with unlimited users on every plan: Common $0 (10 GB), Rare $19.99/mo (100 GB), Epic $99.99/mo (1 TB), Legendary $399.99/mo (10 TB). Network charges apply only to audio and video calls. AI allowances are "TBD", and Huly AI/MetaBrain compute can be paid through your own OpenAI account — [Huly pricing](https://huly.io/pricing)
- Huly combines tracker (vs Jira/Linear), documents (vs Notion/Confluence), chat (vs Slack) and calls in one app. It's EPL-2.0 licensed and self-hostable with Docker Compose — [Elest.io blog](https://blog.elest.io/self-host-huly-one-open-source-app-to-replace-jira-linear-and-notion/); [dev.co](https://dev.co/crm/open-source/platform)
- Reviewers say AI isn't shipped, the integration ecosystem is small, it needs a large VM to self-host, and it's "not there yet" for enterprise compliance or mobile — [Dupple review](https://dupple.com/reviews/huly)
- Activity: about 26.8k GitHub stars and release v0.7.426 on 2026-07-05 (dev.co). One unverified dev.co claim says the official hosted service is shutting down (deadline July 20); the official pricing page shows no such notice — [dev.co](https://dev.co/crm/open-source/platform); contradicted by the absence of any notice on [Huly pricing](https://huly.io/pricing)

**Taiga**
- Features: Kanban with swimlanes and WIP limits; Scrum backlog with epics, per-role estimation, a project "doom-line" and the "Taiga Seed" estimation tool; sprint and project burndowns; custom issue types, priorities and severities; promoting issues to user stories; a team-health dashboard; a wiki; custom fields and tags; real-time reports through CSV URL links; Zapier integrations; import and export — [taiga.io](https://taiga.io/)
- Open source (AGPL-3.0-or-later), self-hosted for free or hosted by Kaleidos — [Gappsy](https://gappsy.com/tools/taiga/)
- Pricing is unclear. Aggregators list a free Cloud Basic plan and a "Contact Sales" Premium plan. The official site lists no prices — [saasrat](https://saasrat.com/products/taiga); [taiga.io](https://taiga.io/)

**Zoho Sprints**
- Tiers: Free (3 users, 3 projects); Starter (12–100 users, yearly only); Elite; Premier; Enterprise (custom). The official page didn't render prices — [Zoho Sprints pricing](https://www.zoho.com/sprints/pricing.html)
- Aggregator prices: from $1/user/mo with a 12-user minimum (TheCTOClub, Capterra); Premier $5/user/mo; an Enterprise plan launched 2026-01-11 at $7.50/user/mo with 250 GB storage. Sources conflict — GetApp lists a $3 starting price — [Capterra UK](https://www.capterra.co.uk/software/169569/zoho-sprints); [apppricinglab](https://saas.apppricinglab.com/product/zoho-sprints/); [GetApp](https://www.getapp.com/scrum-software/a/zoho-sprints)
- Free includes mobile apps and reports/dashboards. Starter adds epics, timesheets, global timers, calendar and sheet views, swimlanes, meetings, an estimation planner, custom email notifications, Trello/Azure DevOps import, AI tools (Zia, OpenAI, Cohere and others) and SCM integration. Elite adds vendor/client portals, custom roles and work item types, and checklists. Premier adds release management, WIP settings, layout rules, custom fields and layouts, webhooks, custom functions, a leave tracker and sprint capacity planning. Enterprise adds OKRs, budget/expense tracking, test case management, custom modules, and risk/opportunity management. An MCP Server and Zia Insights appear in the comparison table — [Zoho Sprints pricing](https://www.zoho.com/sprints/pricing.html)
- 2026 additions reported: built-in meeting hosting, shareable intake forms, epic search. Reviewers call the pricing structure confusing — [TheCTOClub](https://thectoclub.com/fr/tools/avis-zoho-sprints/)

### Inferences
- Zoho Sprints shows how much a low-price Scrum tool can include. "Leave tracker plus sprint capacity planning" and "test case management" are distinctive and fit Orbit's existing workload and time features.
- Huly's flat per-workspace pricing (unlimited users) is a notable contrast to per-seat pricing everywhere else.

### Gaps
- I couldn't confirm Taiga's 2026 development status, a "Taiga Next" rewrite, or official cloud pricing.
- I couldn't confirm official Zoho Sprints prices or Zia's 2026 feature set.
- The Huly hosted-service shutdown claim is unverified.

## Table stakes vs unique ideas worth copying (mapped to Orbit)

### Takeaway
Across these 7 tools, Orbit's main gaps are: custom fields, configurable workflows/statuses, an API plus webhooks, a GitHub/VCS integration, import from Jira and others, docs/wiki, and some form of AI/MCP. Every vendor that ships AI in 2026 (Plane, Shortcut, GitHub, YouTrack, Zoho) also exposes an MCP server or agent assignment.

### Cited Findings
- Custom fields/properties: Plane (Pro+), Shortcut (Business advanced), GitHub issue fields (GA, all plans), Taiga, Zoho (Premier) — [Plane pricing](https://plane.so/pricing); [Shortcut pricing](https://www.shortcut.com/pricing); [GitHub changelog](https://github.blog/changelog/2026-07-02-issue-fields-are-now-generally-available); [taiga.io](https://taiga.io/); [Zoho pricing](https://www.zoho.com/sprints/pricing.html)
- Custom workflows/statuses: Plane (Business), Shortcut (Team: multiple workflows), Taiga (custom stages and "done" definitions), Zoho (layout rules, blueprints not confirmed) — same sources as above
- MCP server: Plane (official MIT), Shortcut (listed), GitHub, YouTrack 2026.2, Zoho (listed) — [Plane MCP docs](https://developers.plane.so/dev-tools/mcp-server.md); [Shortcut pricing](https://www.shortcut.com/pricing); [GitHub changelog](https://github.blog/changelog/2026-07-02-issue-fields-are-now-generally-available); [YouTrack What's New](https://www.jetbrains.com/youtrack/whatsnew/); [Zoho pricing](https://www.zoho.com/sprints/pricing.html)
- AI that writes or summarizes work: Plane AI credits and agents, Shortcut Korey, GitHub Copilot, YouTrack AI Assistant, Zoho Zia. Huly's is still TBD — sources as above plus [Huly pricing](https://huly.io/pricing)
- Webhooks: Plane (v2 plus workflow step), Shortcut (outgoing), Zoho (Premier), YouTrack (Webhook Triggers app) — [Plane changelog](https://plane.so/changelog/2026-05-31-epics-work-item-type-publish-mcp-apps); [Shortcut pricing](https://www.shortcut.com/pricing); [Zoho pricing](https://www.zoho.com/sprints/pricing.html); [YouTrack What's New](https://www.jetbrains.com/youtrack/whatsnew/)
- Importers: Plane (Jira, Linear, Asana, ClickUp, CSV, Confluence, Notion), YouTrack (ClickUp, Asana with continuous sync), Zoho (Trello, Azure DevOps), Taiga (import/export) — [Plane pricing](https://plane.so/pricing); [YouTrack What's New](https://www.jetbrains.com/youtrack/whatsnew/); [Zoho pricing](https://www.zoho.com/sprints/pricing.html); [taiga.io](https://taiga.io/)
- Docs/wiki: Plane Pages/Wiki, Shortcut Docs (free), YouTrack Knowledge Base, Huly Documents, Taiga wiki — [Plane pricing](https://plane.so/pricing); [Shortcut pricing](https://www.shortcut.com/pricing); [YouTrack What's New](https://www.jetbrains.com/youtrack/whatsnew/); [Elest.io](https://blog.elest.io/self-host-huly-one-open-source-app-to-replace-jira-linear-and-notion/); [taiga.io](https://taiga.io/)
- WIP limits: Shortcut (Team), Taiga, Zoho (Premier) — [Shortcut pricing](https://www.shortcut.com/pricing); [taiga.io](https://taiga.io/); [Zoho pricing](https://www.zoho.com/sprints/pricing.html)
- Intake/forms: Plane (forms and email), Zoho (shareable intake forms), YouTrack (helpdesk) — [Plane pricing](https://plane.so/pricing); [TheCTOClub](https://thectoclub.com/fr/tools/avis-zoho-sprints/); [YouTrack What's New](https://www.jetbrains.com/youtrack/whatsnew/)
- OKRs/objectives: Shortcut (Business), Zoho (Enterprise), Plane initiatives (Pro) — [Shortcut pricing](https://www.shortcut.com/pricing); [Zoho pricing](https://www.zoho.com/sprints/pricing.html); [Plane pricing](https://plane.so/pricing)
- Mobile apps: Zoho (Free tier). Huly is criticized for lacking mobile, and Shortcut reviewers want better mobile — [Zoho pricing](https://www.zoho.com/sprints/pricing.html); [Dupple](https://dupple.com/reviews/huly); [GetApp Shortcut](https://www.getapp.com/project-management-planning-software/a/shortcut/)

### Inferences
**Table stakes Orbit lacks**, roughly ordered by how many of the 7 tools have them:
1. Custom fields
2. Configurable workflows/statuses
3. AI assist plus MCP
4. Docs/wiki
5. Importers
6. Webhooks/API
7. GitHub/VCS integration
8. WIP limits

Also likely table stakes but not explicitly sourced here: email notifications, @mentions and watchers.

**Where Orbit is already at or above parity:** sprint burndown and velocity (GitHub lacks them), time tracking with timesheets (Plane puts it behind Pro), whiteboard with issue cards (YouTrack has whiteboards, the others weren't confirmed), ideas with voting and convert-to-issue, and a Tauri desktop app.

**Distinctive ideas worth copying:**
- Plane: enforced type hierarchy rules (Epic > Story > Task); a "Send webhook" step in automation rules; intake by email; time-log approvals.
- GitHub: `@current` / `@next` iteration filter tokens; bulk-moving a whole iteration group; a default field set of Priority, Effort, Start and Target date; field visibility controls on public views.
- GitHub and Shortcut: "assign issue to AI agent → draft PR".
- YouTrack: MCP auth through user sign-in instead of tokens; AI "selected text → several issues"; continuous import during migration; helpdesk customer groups with SLAs; whiteboard auto-layout by dependency.
- Taiga: per-role estimation plus a "doom-line" in the backlog; a team-health dashboard.
- Zoho: sprint capacity planning linked to a leave tracker; client/vendor portals; test case management.
- Huly: unlimited-user, per-workspace pricing.

**Pricing band:** paid per-seat plans cluster around $6–15/user/mo: Plane $6–15, Shortcut $8.50–12, YouTrack about $4.50–5.40, Zoho about $1–7.50. Free tiers are capped at 3–12 users.

**Recurring complaints:**
- Weak reporting (Shortcut)
- Unclear split between open-source and paid features (Plane)
- No native sprint metrics (GitHub)
- Missing mobile apps, AI and integrations (Huly)
- Confusing pricing (Zoho)

### Gaps
- I couldn't access direct Reddit or Hacker News threads for any product in this session; sentiment comes mostly from G2/Capterra summaries, forum posts and vendor pages.
- I didn't verify watchers, mentions or email notifications per product. They're widely assumed but not sourced here.
- I didn't verify roadmap/timeline views for each product, other than Shortcut Roadmap (free), the GitHub roadmap layout, and YouTrack Gantt.
