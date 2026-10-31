# ClickUp, Asana and monday dev compared with Orbit (features, AI, automation, integrations, complaints, pricing) as of Oct 2026

Research date: 2026-10-31. Sources are mostly the vendors' own product and pricing pages as they read on that date. Several pages show only "© 2026" with no effective date for prices or features. Third-party claims are marked as such.

## ClickUp: sprints, views, docs, whiteboards, goals, forms, dashboards, time tracking, custom fields, automations, Brain AI, agents, notetaker, MCP, integrations and API

### Takeaway
ClickUp covers almost every surface Orbit lacks: docs and wikis, forms, goals, custom fields, automations with webhooks, Git integrations, AI agents and a notetaker, and MCP. Many of these are metered or tier-gated, though. Sprint Points and Dashboards are trial-only until Business ($17/user/mo, annual). Its AI was rebranded "Brain²" in 2026 and runs on a credit model.

### Cited Findings
- **Sprints:** included on every tier, Free included. **Sprint Points** are trial-only on Free and Core and full from Business up — [ClickUp pricing](https://clickup.com/pricing)
- **Sprint mechanics:** sprint dates, points, priorities, and automatic roll-over of unfinished tasks into the next sprint. Points roll up from subtasks and can be grouped by assignee. Burndown and burnup charts compare progress against a target line. Velocity is shown on dashboards over 1, 2, 3, 6 or 12 month periods — [ClickUp Sprints feature page](https://www.clickup.com/features/sprints); [ClickUp agile page](https://clickup.com/lp/agile-development)
- **Git integrations:** GitHub, GitLab and Bitbucket, linking commits, branches and PRs to tasks — [ClickUp agile page](https://clickup.com/lp/agile-development). I could not get the help-center setup docs (HTTP 403).
- Vendor claim: Jira leaves subtask story points out of sprint burndowns and ClickUp does not. Unverified competitive marketing — [ClickUp blog](https://clickup.com/blog/burndown-chart-generators/)
- **Custom fields:** trial on Free, included from Core — [ClickUp pricing](https://clickup.com/pricing)
- **Automations:**
  - Actions per workspace per month: 100 (Free), 1,000 (Core), 10,000 (Business), 1M (Enterprise and Max).
  - Active rules: 5 on Free, unlimited on paid plans.
  - "Advanced automations" (webhooks, email, SMS) start at Business.
  - Source: [ClickUp pricing](https://clickup.com/pricing)
- **Dashboards:** trial on Free and Core, full from Business — [ClickUp pricing](https://clickup.com/pricing)
- **Time tracking:** included from Core. Timesheets start at Business. "Advanced time tracking" starts at Enterprise — [ClickUp pricing](https://clickup.com/pricing)
- **Goals:** trial on Free, included from Core — [ClickUp pricing](https://clickup.com/pricing)
- **Whiteboards:** 3 on Free, 10 on Core, unlimited from Business — [ClickUp pricing](https://clickup.com/pricing)
- **Docs:** unlimited on every tier. Private docs on Business. Protected docs and wikis on Enterprise and Max — [ClickUp pricing](https://clickup.com/pricing)
- **Forms:** 1 on Free, unlimited from Core. Conditional logic and branding on Enterprise and Max — [ClickUp pricing](https://clickup.com/pricing)
- **API rate limit:** 100 requests/min on Free through Business, 10,000/min on Enterprise and Max — [ClickUp pricing](https://clickup.com/pricing)
- **MCP:**
  - Daily MCP call caps: 100 (Free), 300 (Core), 1,000 (Business), 25,000 (Enterprise), uncapped (Max) — [ClickUp pricing](https://clickup.com/pricing)
  - A third-party blog says the MCP servers are in public beta on all plans. Not confirmed by ClickUp — [Pillitteri blog](https://pasqualepillitteri.it/en/news/6216/clickup-brain2-ai-coworker-mcp)
- **Brain² AI capabilities:**
  - Chat grounded in tasks, docs, chat, calendar, email and connected apps.
  - Persistent memory, with import from ChatGPT or Claude.
  - "Ambient Intelligence" suggestions and Deep Search across workspace, connected apps and the web.
  - One-click model switching between Claude, GPT and Gemini.
  - Role-based Super Agents (e.g. Strategist, Developer).
  - Reusable "Skills" workflows, AI Fields and AI Automations.
  - Generates slides, dashboards, prototypes and code.
  - Connected apps include Google Drive, GitHub, Salesforce and "Any MCP".
  - Source: [ClickUp Brain page](https://clickup.com/brain)
- **AI Notetaker** ("Presence"): joins calls and files notes into the workspace — [ClickUp Brain page](https://clickup.com/brain). It uses AI credits on Free through Business and is unlimited (fair use) on Enterprise and Max — [ClickUp pricing](https://clickup.com/pricing)
- **Brain MAX:** native apps for macOS, Windows, iOS and Android, with "Mention Anywhere" (@Brain) and talk-to-text — [ClickUp Brain page](https://clickup.com/brain)
- **Rebrand:** a third-party blog says the AI relaunched as "Brain²" on June 17, 2026. ClickUp's own page uses the Brain² name but gives no date — [Pillitteri blog](https://pasqualepillitteri.it/en/news/6216/clickup-brain2-ai-coworker-mcp); [ClickUp Brain page](https://clickup.com/brain)
- **AI security claims:** no training on customer data, zero retention by model providers. SOC 2, ISO 27001, GDPR, HIPAA. Admins cannot read users' Brain conversations — [ClickUp Brain page](https://clickup.com/brain)
- **Guests:** Free guests get full create and edit rights. Core and up get limited guests plus view-only guests. Enterprise adds advanced permissions — [ClickUp pricing](https://clickup.com/pricing)

### Inferences
- **Sprint basics:** Orbit's start/complete sprint, roll-over, points, burndown and velocity match ClickUp's sprint core.
- **Paywall opening:** ClickUp puts points and dashboards behind Business. Orbit could position itself as "full scrum reporting on every plan".
- **Biggest structural gaps against ClickUp:**
  - Custom fields and statuses
  - Automations and webhooks
  - Git integrations
  - Docs and wiki
  - Forms
  - Goals
  - Public API and MCP
  - AI
- **Whiteboards:** Orbit's flowcharts and whiteboard are roughly at parity. Orbit's public read-only links and version history may be differentiators, but I did not verify ClickUp's whiteboard versioning or public-link behaviour.

### Gaps
- I could not reach ClickUp help-center docs (403), so I could not confirm:
  - Exact sprint widgets (e.g. cumulative flow)
  - Typed relationships and dependency types
  - Watchers and followers behaviour
  - Import tools (ClickUp is widely known to import from Jira, Asana, monday, Trello and CSV, but I did not verify this in this session)
- I did not verify ClickUp's API version or webhooks docs beyond the pricing-page rate limits.

## Asana: projects, portfolios, goals, workload, rules, forms, Asana AI / AI Studio / AI Teammates, integrations, API/MCP, plus the new engineering product "Command"

### Takeaway
Asana is weaker than ClickUp and monday dev on native scrum. Its features page only says you can "assign work to sprints". It is strong on portfolios, goals, workload, forms, rules and approvals and proofing. AI is included on paid plans but billed per request. In September 2026 Asana launched a separate engineering product, "Command by Asana", that connects release planning, GitHub and coding agents. That is a direct strategic move into Orbit's space.

### Cited Findings
- **Pricing (per user/mo):**
  - Personal: free, up to 2 users
  - Starter: $10.99 annual / $13.49 monthly
  - Advanced: $24.99 annual / $30.49 monthly
  - Enterprise and Enterprise+: custom pricing
  - Source: [Asana pricing](https://asana.com/pricing)
- **What each tier unlocks:**
  - Timeline, custom fields and no automation cap: Starter and up.
  - Portfolios, goal linking, and approvals and proofing: Advanced and up.
  - Workload: within a portfolio on Advanced; across the organization plus capacity planning on Enterprise.
  - Forms: basic on Starter; branching logic and customization on Advanced.
  - Source: [Asana pricing](https://asana.com/pricing)
- **Guests:** unlimited free guests on Starter and up. Enterprise adds guest-invite controls and view-only licenses — [Asana pricing](https://asana.com/pricing)
- **Integrations:**
  - 100+ free integrations even on Personal. Salesforce, Tableau and Power BI on Advanced. SIEM via a compliance add-on on Enterprise — [Asana pricing](https://asana.com/pricing)
  - Listed integrations: Google, Microsoft, Salesforce, Slack, Zoom, Jira, Tableau, Power BI — [Asana features](https://asana.com/features)
- **API:**
  - Developer docs are open to all plans. Service accounts on Enterprise. Audit log API is a compliance add-on.
  - "Script Actions" (Node.js inside rules) exist, but the tier is unclear.
  - Source: [Asana pricing](https://asana.com/pricing)
- **Feature set:**
  - Views: list, calendar, timeline, Gantt and board.
  - 17 custom field types on paid plans.
  - Rules, forms, bundles (processes applied across projects), templates and CSV import.
  - Capacity planning, workload, time tracking, timesheets and budgets.
  - Goals, portfolios and reporting dashboards.
  - Mobile and desktop apps.
  - Engineering: work can be assigned to sprints, and Jira integration connects engineering work.
  - Source: [Asana features](https://asana.com/features)
- **AI Teammates:** prebuilt agents for marketing, ops, IT and several industries.
- **Asana Dash:** an "AI chief of staff" that routes work to AI Teammates and surfaces next steps from meetings, Slack and email.
- **AI Studio:** a no-code AI workflow builder for intake, classification, routing and alerts.
- **AI Connectors / MCP:** connect ChatGPT, Claude, Gemini and Copilot to Asana's Work Graph.
- **Models and data:** Asana picks the model per task, from partners including OpenAI and Anthropic. AI runs on each user's permissions, and partners delete data after each query.
- Source for the five points above: [Asana AI page](https://asana.com/product/ai)
- **AI pricing:**
  - AI Studio Basic, AI Teammates and Dash are included on all paid plans. Teammates and Dash are billed at a flat rate per executed request — [Asana AI page](https://asana.com/product/ai)
  - Prepaid packs cost $0.50 per request. Pay-as-you-go costs $0.60 per request. AI Studio Plus and Pro are paid tiers.
  - AI Studio credit allowances are listed as 50K / 75K / 200K / 200K per billing account per month. The mapping to tiers was unclear in the extracted table.
  - Source: [Asana pricing](https://asana.com/pricing)
- **MCP server:**
  - V2 is live at `https://mcp.asana.com/v2/mcp` — [Asana developer docs](https://developers.asana.com/docs/using-asanas-mcp-server)
  - The old V1 beta server is deprecated, with a shutdown date shown as "05/11/2026". The date format is ambiguous, but it has probably already passed — [Asana developer docs](https://developers.asana.com/docs/using-asanas-mcp-server)
  - Third-party claim: V2 launched February 2026 over streamable HTTP and is OAuth-only — [developersdigest](https://www.developersdigest.tech/mcp-servers/asana); [growthmethod](https://growthmethod.com/asana-mcp-server/)
- **Command by Asana** (announced Sept 24, 2026, "available now" through account managers, no public pricing):
  - Real-time release planning (scope, dependencies, pacing, risks).
  - Links work to the codebase and GitHub.
  - Turns decisions and meetings into execution-ready specs and tickets for coding agents. Positioned as an orchestration layer for agents (partner example: Grok Build).
  - Live delivery and risk views for engineering leaders.
  - Source: [Asana announcement](https://asana.com/inside-asana/command-by-asana); [Asana forum](https://forum.asana.com/t/command-by-asana-is-here-ship-faster-with-humans-and-agents-in-sync/1156506)
- **StackAI:** Asana's navigation lists "StackAI by Asana", and the product page banner reads "Asana acquires StackAI". I did not find the acquisition details — [Asana Command page](https://asana.com/product/command)

### Inferences
- **Asana's dev offering is split in two.** Core Asana gives light sprint support. Command is a separate, sales-led product for engineering orchestration.
- **Where Orbit wins today:** Orbit's native backlog, issue keys, burndown and velocity beat core Asana for scrum teams.
- **Where Orbit trails:** approvals, forms, goals and portfolios, rules, integrations, MCP and AI.
- **Strategic signal:** Command shows incumbents are pursuing "AI coding agents plus tickets plus GitHub". This raises the priority of an API and MCP server for Orbit.

### Gaps
- No detail found on Asana's native sprint features (points, burndown). The features page does not list them.
- Did not verify Asana's typed dependencies or followers behaviour, though collaborators and followers are a well-known Asana feature.
- Did not confirm the Asana GitHub integration in core Asana. Only Command mentions GitHub.

## monday dev: sprints, roadmaps, bugs, Git integrations, monday AI and agents, automations, dashboards, API/MCP

### Takeaway
monday dev is the most directly comparable to Orbit. It offers sprints, backlog, burndown and velocity, retros, AI daily standups, roadmaps, bugs, releases and docs, plus a broad dev-tool integration list. Its pricing gates sprint management at Standard ($12/seat), cross-team roadmaps at Pro, and imposes a 3-seat minimum and seat buckets. AI comes as Sidekick tiers plus a monthly credit pool, and MCP is free on all plans.

### Cited Findings
- **Pricing and seats:**
  - Per seat per month, annual billing: Basic $9, Standard $12, Pro $20, Enterprise custom.
  - Minimum 3 seats. 40+ users need a quote.
  - Source: [monday dev pricing](https://monday.com/dev/pricing)
- **What each tier unlocks:**
  - Basic: only an AI sprint summary for sprints. Three features are tagged "New" here: capacity planning, daily stand-up, AI sprint summary.
  - Standard: sprint management with story points, a single roadmap, and GitHub two-way sync.
  - Pro: cross-team roadmaps, and customer feedback and request management.
  - Source: [monday dev pricing](https://monday.com/dev/pricing)
- **Automation and integration actions per month:** 250 + 250 (Standard), 25K + 25K (Pro), 250K combined (Enterprise) — [monday dev pricing](https://monday.com/dev/pricing)
- **Dashboards:** 1 board (Basic), up to 5 (Standard), up to 20 (Pro), up to 50 boards (Enterprise) — [monday dev pricing](https://monday.com/dev/pricing)
- **Guests:** unlimited free read-only viewers on Basic, guest access from Standard — [monday dev pricing](https://monday.com/dev/pricing)
- **Feature list:**
  - Planning: feature requests, roadmaps, prioritization, hierarchies, capacity planning, customer feedback.
  - Delivery: Scrum and Kanban, sprint management, sprint automations, retrospectives, AI Daily Standups, backlog refinement.
  - Bugs: bug reporting flow, bug tracking, incident monitoring.
  - Releases: release management, shareable release plans, roadmap tracker.
  - Reporting: burndown, velocity, Agile insights, dashboards.
  - Docs and product wikis.
  - Source: [monday dev product page](https://monday.com/dev)
- **Integrations:** GitHub, GitLab, CircleCI, Bitbucket, Jira, Slack, Figma, Azure DevOps, Cursor, VS Code, Windsurf, Gemini CLI — [monday dev product page](https://monday.com/dev)
  - Note: the pricing page names only GitHub sync for Standard. Tiering for the other Git tools is unclear — [monday dev pricing](https://monday.com/dev/pricing)
- **Dev AI:** AI sprint summaries, automatic bug categorization, PRD summarization, automatic task assignment, and AI agents that complete workflow tasks — [monday dev product page](https://monday.com/dev). Engineering agents can prioritize bugs, generate release notes, write code and open PRs — [monday blog, Aug 25 2026](https://monday.com/blog/ai-agents/everything-monday-ai-can-do/)
- **monday AI (platform-wide):**
  - Sidekick assistant at account, board and item level, with voice mode and Gmail, Slack, Outlook and Google Calendar.
  - Ready-made and custom agents (3-step builder).
  - Vibe, a prompt-to-app builder.
  - AI blocks: column-level categorize, summarize, extract, translate, sentiment, write.
  - AI notetaker.
  - Models from Azure OpenAI primarily, with AWS Bedrock in progress. No bring-your-own key.
  - Source: [monday blog](https://monday.com/blog/ai-agents/everything-monday-ai-can-do/)
- **Sidekick tiers:**

| Tier | Included with | Messages/day | Images or videos/day |
|---|---|---|---|
| Lite | Standard and Pro | 5 | none |
| Plus | Enterprise; buyable on Standard and Pro | 100 | 2 |
| Super | Buyable on Standard, Pro and Enterprise | 500 | 10 |

  - Super Sidekick was described as forthcoming ("will provide") in the Aug 2026 article.
  - Source: [monday blog](https://monday.com/blog/ai-agents/everything-monday-ai-can-do/)
- **AI credits:**
  - 500 free credits per account per month.
  - Credits are consumed by AI blocks, Vibe AI calls (8 credits each), Vibe triggers (2 each) and Plus or Super messages.
  - Sidekick Lite, MCP use and board suggestions are free.
  - The "AI Cost Center" tracks usage and sets limits.
  - Source: [monday blog](https://monday.com/blog/ai-agents/everything-monday-ai-can-do/)
- **MCP:**
  - The hosted Platform MCP is at `https://mcp.monday.com/mcp`. It is open source and maintained by monday's AI team. A separate Apps MCP exists — [monday developer docs](https://developer.monday.com/api-reference/docs/monday-mcp-overview)
  - MCP is included on all plans, subject to API limits, with per-user OAuth — [monday blog](https://monday.com/blog/ai-agents/everything-monday-ai-can-do/)
  - A sprint summary endpoint is linked from the MCP section — [monday blog](https://monday.com/blog/ai-agents/everything-monday-ai-can-do/)
- **Third-party claims (unverified):** Sidekick left beta in January 2026, and credit pricing applied from July 20, 2026 — [Till Freitag blog](https://till-freitag.com/en/blog/monday-ai-features-en)

### Inferences
- **Close match on the scrum core.** monday dev's sprint, burndown and velocity, Kanban and docs set is closest to Orbit's.
- **What monday dev has that Orbit lacks:** retrospectives, AI standups, releases and release plans, roadmaps, bug intake flows, capacity planning, and the integrations list.
- **The seat structure is an opening.** Sprint management is gated at Standard, with a 3-seat minimum and seat buckets. Orbit could compete with simple per-user or free-tier scrum.

### Gaps
- No direct confirmation of story points or epics on the monday dev product page. The pricing page mentions story points under Standard.
- Jira migration or import tooling was not confirmed (the page only says "integrates with Jira").
- API (GraphQL) rate limits by tier were not checked.

## Templates, onboarding, import tools, and collaboration features (mentions, watchers/followers, guests, approvals, proofing)

### Takeaway
I found only partial evidence in this session. All three have guest access. Asana gates approvals and proofing at Advanced and supports CSV import and templates and bundles. The deeper details (import from other tools, onboarding flows, mention and watcher behaviour) were not verified from primary sources.

### Cited Findings
- **Asana:** templates, bundles and CSV import (each file becomes a project) — [Asana features](https://asana.com/features). Approvals and proofing on Advanced and up, unlimited free guests from Starter — [Asana pricing](https://asana.com/pricing)
- **ClickUp guests:** Free guests get full create and edit rights; paid tiers get limited guests plus view-only guests — [ClickUp pricing](https://clickup.com/pricing)
- **monday dev guests:** unlimited free viewers on Basic, project-specific guest access from Standard. Shareable release plans — [monday dev pricing](https://monday.com/dev/pricing); [monday dev](https://monday.com/dev)
- **ClickUp notifications and mentions:** a G2 reviewer says important @mentions get lost in notification noise. Some reviewers say notification settings got simpler after ClickUp 4.0 — [G2 ClickUp](https://g2.com/products/clickup)

### Inferences
- **Mentions and guests are table stakes.** All three have mentions and guest or viewer access (mentions confirmed for ClickUp via reviews). Orbit lacks mentions, watchers, guests (beyond the viewer role), email notifications and import, so it trails all three on collaboration basics.
- **Import as a gap:** Orbit has no import from other tools. ClickUp and Asana are commonly assumed to offer importers, but that was not verified here.

### Gaps
- Primary-source confirmation of import tools (Jira, Trello, CSV) for ClickUp and monday dev.
- Watchers and followers semantics for all three.
- Onboarding and template galleries, including counts and dev-specific templates.

## Most common user complaints (complexity, performance, pricing, notification overload)

### Takeaway
- **ClickUp:** slowness, bugs, notification noise and complexity.
- **Asana:** per-seat price escalation, tier gating, and the learning curve.
- **monday:** the 3-seat minimum and seat buckets, plus gating and rigidity.

Reddit evidence is mostly secondhand. I found no 2026 Reddit threads directly.

### Cited Findings
- **ClickUp:**
  - G2 rates it about 4.6 to 4.7 across more than 11,000 reviews.
  - Top dislikes are slow loading (one reviewer reports up to 5-second page loads), bugs (especially on mobile), syncing problems, noisy and hard-to-tune notifications, and a steep setup and learning curve — [G2 ClickUp](https://g2.com/products/clickup); [Capterra ClickUp](https://www.capterra.com/p/158833/ClickUp/reviews/?rating=4)
  - Trustpilot reviewers report slow, email-only support — [Trustpilot](https://www.trustpilot.com/review/clickup.com?page=9)
  - Secondhand: Reddit criticizes ClickUp's pricing tactics, forced upgrades and complexity — [Productive.io comparison](https://productive.io/blog/asana-vs-clickup-vs-monday-vs-productive/); [Meegle](https://www.meegle.com/en_us/blogs/clickup-vs-monday)
- **Asana:**
  - Pricing is among the most frequently cited complaints, with costs rising sharply as teams scale. Advanced features sit behind higher tiers — [SeaTable summary](https://seatable.com/asana-reviews/); [Capterra Asana](https://capterra.com/p/184581/Asana-PM/reviews/)
  - G2 negative tags: "Learning Curve" (605 mentions) and "Not Intuitive" (384). The mobile app is seen as limited — [checkthat.ai aggregation of G2](https://checkthat.ai/brands/asana/reviews) (aggregator, secondhand)
  - A 1-star review alleges over-billing and lock-in — [AWS Marketplace reviews](https://aws.amazon.com/marketplace/reviews/reviews-list/prodview-ddsipp3fepld6?rating=1)
  - Capterra rates it 4.5 across about 13,500 reviews — [Capterra Asana](https://capterra.com/p/184581/Asana-PM/reviews/)
- **monday:**
  - The 3-seat minimum and seat buckets (3, 5, 10, 15, 20...) mean a solo Basic user pays about $36/mo — [ClickUp's monday review (competitor source)](https://clickup.com/learn/topic/task-management/tools/monday/)
  - Gantt, time tracking and advanced reporting are locked to higher tiers — [Software Advice](https://www.softwareadvice.com/scm/dapulse-profile/)
  - Learning curve — [SmartSuite](https://www.smartsuite.com/blog/monday-review)
  - Billing and refund complaints on BBB — [Finder](https://finder.com/small-business/monday-com-review)
  - Trustpilot score is 2.5/5, against G2 at about 4.7 (about 17k reviews) — [Trustpilot](https://www.trustpilot.com/review/monday.com?page=6); [insidea](https://insidea.com/software/monday)
  - Secondhand: r/mondaydotcom users say seat minimums and bucket billing catch them off guard — [Prospeo](https://prospeo.io/s/mondaycom-pricing-reviews-pros-and-cons)
  - Complaints of rigidity and a "board-heavy" feel — [airframe.ai](https://www.airframe.ai/product/monday-com/compare)

### Inferences
- **Opportunities for Orbit:**
  - Performance: a local-first desktop app (Tauri) is fast.
  - Simplicity: an opinionated scrum workflow.
  - Transparent pricing with no seat minimum.
  - Calm notifications.
- **The trade-off:** Orbit's lack of custom fields and workflows is the flip side of ClickUp's complexity complaints. Any added configurability should keep sensible defaults.

### Gaps
- Direct Reddit threads from 2025-2026 were not retrieved. All Reddit claims are secondhand.
- Notification-overload complaints for Asana and monday were not specifically found.

## Pricing tiers, feature gating, and how AI is priced

### Takeaway
All three use per-seat tiers, with dev-relevant features gated mid-tier:
- **ClickUp:** points and dashboards at Business.
- **Asana:** portfolios, approvals and workload at Advanced.
- **monday:** sprints at Standard and cross-team roadmaps at Pro.

AI has moved to usage-based models everywhere: ClickUp Super Credits, Asana per-request billing, and monday credits plus Sidekick tiers. MCP is free or included at all three, with call caps at ClickUp.

### Cited Findings
- **ClickUp:**
  - Plans (per user/mo, annual): Free; Core $9 (list $12); Business $17 (list $25); Enterprise custom; Max $100 (list $120).
  - AI credits: 500 per workspace on Free (trial), then 1,000 / 1,500 / 3,000 / 10,000 per user per month across Core, Business, Enterprise and Max.
  - Add-on Super Credits cost $10 per 10K.
  - Max includes unlimited autopilot agents and AI fields.
  - Pricing note: AI prices "may be adjusted" if provider costs rise.
  - Source: [ClickUp pricing](https://clickup.com/pricing)
  - The Brain page separately lists "Brain² AI from $9/user/mo" (unlimited chat, premium models, 1,500 Super Credits) and "Everything AI" at $28/user/mo (Notetaker, AI Fields, Automations, Super Agents). Super Credits fund agents, AI automations and fields, while chat is free of credits — [ClickUp Brain page](https://clickup.com/brain)
  - **Conflict:** the pricing page shows per-tier credit amounts, while the Brain page frames AI as separate $9 and $28 offerings. The relationship between them is unclear.
- **Asana:**
  - Plans: Personal free; Starter $10.99/$13.49; Advanced $24.99/$30.49; Enterprise custom.
  - AI is included on paid plans with request allowances. Overage costs $0.50 (prepaid) or $0.60 (pay-as-you-go) per request. A "pay-as-you-go at $5.99/user/mo" figure also appears. AI Studio Plus and Pro are paid add-ons.
  - Source: [Asana pricing](https://asana.com/pricing); [Asana AI](https://asana.com/product/ai)
- **monday dev:**
  - Plans (per seat/mo, annual): $9 / $12 / $20 / custom, with a 3-seat minimum.
  - Sidekick Lite is included on Standard and Pro, Plus on Enterprise. Plus and Super can be bought on other tiers.
  - Every account gets 500 free AI credits per month. MCP is free.
  - Source: [monday dev pricing](https://monday.com/dev/pricing); [monday blog](https://monday.com/blog/ai-agents/everything-monday-ai-can-do/)

### Inferences
- **Pricing benchmark:** a credible Orbit paid tier for scrum teams sits around $9-12/user/mo.
- **Where Orbit can undercut:** include sprint points and reports on lower tiers, and drop seat minimums.
- **AI pricing norm:** usage-based AI on top of seats. Unlimited chat with metered agents (ClickUp's approach) is becoming the pattern.
- **MCP is expected:** an MCP server and public API are now baseline expectations. All three offer MCP and none charges separately (ClickUp only caps calls per day).

### Gaps
- Monthly (non-annual) prices for ClickUp and monday dev were not shown in the fetched page text.
- Exact Asana AI request allowances per tier were unclear in the extracted table.
