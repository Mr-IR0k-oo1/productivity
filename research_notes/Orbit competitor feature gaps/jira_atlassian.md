# Jira / Atlassian (Jira, Jira Product Discovery, Rovo, MCP/API/Automation) vs Orbit — Feature Inventory and Gaps (as of 2026-10-31)

Research note: atlassian.com/software/jira/pricing returned only a title when fetched, and Capterra, G2 and resolution.de returned HTTP 403, so some pricing and review details come from third-party aggregators and search snippets. Each item below is marked accordingly. No Reddit or Hacker News thread was fetched directly.

## 1. Core planning features in Jira (backlog, sprints, boards, timeline/plans, releases, workflows, fields, linking, JQL, dashboards, reports)

### Takeaway
This session did not verify Jira's core agile feature set from primary docs (the one support page I tried returned 404). Atlassian's own AI page does confirm newer planning features, such as a Work Readiness Checker agent and AI work breakdown. The baseline feature list below comes from well-established prior knowledge and is flagged as unverified.

### Cited Findings
- Jira now calls issues "work items" in its UI and docs. Atlassian's AI page says "Work create", "Work breakdown" and "Summarizes any work item's purpose, status, key contributors, next steps, blockers" — [Atlassian Jira AI](https://www.atlassian.com/software/jira/ai)
- Work Readiness Checker Agent: "Checks that work is clear and complete before planning" — [Atlassian Jira AI](https://www.atlassian.com/software/jira/ai)
- Reviewers say large instances get slow, with boards and search "taking noticeably longer as issue counts climb". This is a secondhand summary of HN and blog opinion — [eesel Linear vs Jira](https://www.eesel.ai/blog/linear-vs-jira); [ONES HN summary](https://ones.com/blog/linear-vs-jira-hacker-news-6-surprising-opinions-from-devs/)
- Third-party summaries say Linear "feels tight" where a process needs "custom issue hierarchies and field-level permissions". That implies these are Jira strengths — [ONES HN summary](https://ones.com/blog/linear-vs-jira-hacker-news-6-surprising-opinions-from-devs/)

### Inferences
- UNVERIFIED (prior knowledge, needs a citation before publishing). Jira Cloud offers the following, and Orbit lacks the starred items:
  - Scrum and Kanban boards with configurable columns mapped to statuses.
  - Custom workflows with statuses, transitions, conditions, validators and post-functions*.
  - Custom fields of many types*.
  - Typed issue links (blocks/is blocked by, relates to, duplicates, clones)*.
  - Components*, fix versions/releases with release notes*, labels, watchers*, @mentions*.
  - JQL with saved filters*, filter subscriptions by email*, dashboards with gadgets*.
  - Timeline (epic-level roadmap in every project)* and Plans (formerly Advanced Roadmaps: cross-project planning, capacity, dependencies, scenarios; Premium/Enterprise)*.
  - Reports: burndown, burnup, sprint report, velocity, cumulative flow diagram*, control chart*, epic report*, version/release report*.
  - Native mobile apps for iOS and Android*.
  - Importers (CSV, Trello, Asana and others)*.
- Orbit already matches Jira on backlog, sprint start/complete, story points, the epic/story/task/bug hierarchy, issue keys, subtasks, comments, dependencies, burndown, velocity, list/calendar/gantt views and Cmd-K search.

### Gaps
- No primary-source page fetched for Jira's agile reports list, Plans feature gating, or the custom workflow/field docs. The report writer should treat the inference list above as needing verification.
- Did not confirm whether Timeline/Plans moved between tiers in 2025–2026.

## 2. Jira Product Discovery (JPD) — idea management

### Takeaway
JPD is a separate paid product, billed per "creator", with free contributors. It offers insight capture, custom-formula prioritisation (such as RICE), list, matrix, board and timeline views, voting, and delivery tracking linked to Jira issues. Orbit's Ideas module (votes, comments, dependencies, mind map, convert-to-issue) covers part of this but has no insights, formulas, matrix view or stakeholder roadmaps.

### Cited Findings
- **Idea capture:** store opportunities, problems and feature requests. Add customer insights directly, from third-party apps, or via a Chrome extension — [JPD features](https://www.atlassian.com/software/jira/product-discovery/features)
- **Prioritisation:** dozens of built-in fields (such as impact and effort) or custom fields, with custom formulas for RICE or your own framework — [JPD features](https://www.atlassian.com/software/jira/product-discovery/features)
- **Views:** list and matrix views for comparing ideas, board and timeline views for roadmaps, and custom views for different stakeholders. Roadmaps can be shared with leadership or high-priority customers — [JPD features](https://www.atlassian.com/software/jira/product-discovery/features)
- **Stakeholder input:** react, comment and vote on ideas — [JPD features](https://www.atlassian.com/software/jira/product-discovery/features)
- **Delivery tracking:** link ideas to any Jira issue type and track delivery-ticket progress from JPD — [JPD features](https://www.atlassian.com/software/jira/product-discovery/features)
- **Other links:** Jira Service Management requests can be added as insights or ideas, and roadmaps can be embedded in Confluence — [JPD pricing](https://www.atlassian.com/software/jira/product-discovery/pricing)
- **Pricing:**

  | Plan | Price | Creators | Notes |
  |---|---|---|---|
  | Free | $0 | Up to 3 | 2GB storage, community support |
  | Standard | $10.50 per creator/month | — | |
  | Premium | $26.25 per creator/month | — | "all team roadmaps into one clear view", more automations and controls |
  | Enterprise | Custom | — | |

  Annual billing saves up to 17%. Contributors are free but need an Atlassian account, and Jira/JSM users are contributors by default — [JPD pricing](https://www.atlassian.com/software/jira/product-discovery/pricing)

### Inferences
- Orbit gaps against JPD: insights (customer evidence attached to ideas), weighted scoring formulas, a matrix (impact vs effort) view, idea-level custom fields, stakeholder-specific shareable roadmap views, and a delivery-progress rollup from linked issues back to the idea.
- Orbit advantages: mind map and idea dependencies, which JPD's features page does not mention. Orbit's ideas are also built in, not a separately billed product.
- Orbit has public read-only links for flowcharts. Extending that to idea roadmaps would compete with JPD's stakeholder sharing.

### Gaps
- No per-plan JPD feature comparison was extractable. The "Compare features" table came back empty, so Premium-only features are unconfirmed.
- JPD-specific AI features are not documented on the features page.

## 3. AI features (Rovo / Atlassian Intelligence) and the Rovo MCP server

### Takeaway
Rovo (Search, Chat, Agents, Studio) is included in all paid Jira cloud plans. It is metered through pooled "Rovo credits": 25, 70 or 150 per user per month on Standard, Premium and Enterprise, and none on Free. Overage billing at $0.01 per credit starts on December 3, 2026. The Rovo MCP Server went GA on February 4, 2026, letting Claude, ChatGPT, Cursor, VS Code and other clients read and write Jira and Confluence. Orbit has no AI or MCP at all, so this is the largest single gap.

### Cited Findings
- **Jira AI features listed by Atlassian:**
  - delegating tasks to Rovo and third-party agents, which use the Teamwork Graph for context
  - Work Readiness Checker Agent
  - Rovo Dev, which turns work items into code
  - Work create from Confluence, Slack, email, IDE and images
  - one-click work breakdown
  - "Instant context" summaries of a work item's status, blockers and next steps
  - Rovo Chat and Search browser extension
  - Definitions (jargon explanations)
  - Rovo Project Management skills (create or update work items and draft status updates from chat)

  — [Atlassian Jira AI](https://www.atlassian.com/software/jira/ai)
- **Plan availability:**
  - Rovo is on Standard, Premium and Enterprise Cloud.
  - Premium and Enterprise got it in April 2025, and Standard "later in 2025". (The page text appears not to have been refreshed since.)
  - AI is on by default for Premium and Enterprise.
  - The full set of search, chat, agents and Studio "requires a Cloud Premium or Enterprise plan".

  — [Atlassian Jira AI](https://www.atlassian.com/software/jira/ai). Note a possible conflict: the credits doc says Standard gets 25 credits per user, which suggests Standard now has chat and agents — [Rovo credits doc](https://support.atlassian.com/organization-administration/docs/usage-limits-in-atlassian-intelligence/)
- **Rovo credits:**
  - Pooled per org, reset monthly, no rollover.
  - Per user per month: Jira 25 (Standard), 70 (Premium), 150 (Enterprise). Teamwork Collection gets 250, 700 or 1,500.
  - Free tier AI (Rovo Search, Definitions, Summaries) costs no credits.
  - Basic tier (Quick Answers, basic agents) costs 10 credits per billable event, and each chat message is one billable event.
  - Premium tier (Think Deeper, Jira Coding Agent, advanced agents) costs a variable number of credits.
  - Overage list price is $0.01 per credit, billing takes effect December 3, 2026, and it is on by default with admin caps available.

  — [Rovo credits doc](https://support.atlassian.com/organization-administration/docs/usage-limits-in-atlassian-intelligence/)
- **Natural-language-to-JQL and AI work breakdown** are widely described by third parties. One July 2026 guide says deeper features such as AI work breakdown sit behind Premium and Enterprise — [eesel Jira AI](https://www.eesel.ai/blog/jira-ai); [eesel What is Jira AI](https://www.eesel.ai/blog/what-is-jira-ai). This is a secondary source and conflicts with Atlassian's page, which does not gate work breakdown by plan.
- **Rovo MCP Server:**
  - GA on February 4, 2026.
  - Clients include AWS, ChatGPT, Claude, Cursor, Devin, Docker, Figma, GitHub, Google, Lovable, Mistral, Postman, VS Code and WRITER.
  - Capabilities: semantic search and fetch across Jira and Confluence, create and update Confluence pages, create Jira epics and issues and link them to context, and MCP "apps" with custom UI.
  - Admins can allowlist clients, and MCP usage logs are kept for audit.
  - "Headless auth" is still planned.

  — [Atlassian blog: Rovo MCP GA](https://www.atlassian.com/blog/announcements/atlassian-rovo-mcp-ga)
- **MCP auth and access:** per the search summary, JSM and Bitbucket MCP tools need API-token auth and Compass tools need OAuth 2.1 — [Atlassian Rovo MCP docs](https://developer.atlassian.com/cloud/rovo-mcp/). (Secondhand; the docs page was not fetched.)
- **MCP cost:** installing the Rovo MCP and write operations are free of credits, while enriched Teamwork Graph calls cost 1–10 credits each — [Rovo credits doc](https://support.atlassian.com/organization-administration/docs/usage-limits-in-atlassian-intelligence/)
- **Rovo in automation:** the components "Use Rovo", "Use agent" and "Use Jira Coding agent" are billed in Rovo credits — [Automation usage doc](https://support.atlassian.com/cloud-automation/docs/how-is-my-usage-calculated/)

### Inferences
- An Orbit MCP server would be the cheapest way to reach parity on "AI clients can read and write my tracker", since Atlassian charges nothing for MCP write calls. A free, credit-less Orbit MCP plus BYO-model AI would contrast with Atlassian's new metered overage, which starts December 3, 2026.
- High-value AI features to copy first: issue summary ("instant context"), epic-to-stories breakdown, natural language search, and readiness checks before sprint planning.

### Gaps
- Atlassian's own docs page for natural-language JQL was not fetched.
- Exact credit cost of a work-breakdown call is not published ("variable").

## 4. Automation, REST API, webhooks, Forge/Connect, marketplace

### Takeaway
Jira automation is now metered in "steps" pooled at the org level: 150 per month on Free, and 400, 750 or 1,000 per user per month on Standard, Premium and Enterprise. Overage costs $0.50 per 1,000 steps from December 3, 2026. The app platform is consolidating on Forge. Connect stopped accepting new Marketplace apps in September 2025, stopped accepting updates on March 31, 2026, and reaches end of support in about December 2026. Orbit has none of automations, API, webhooks or an app platform.

### Cited Findings
- **Step allowances per month:** Free 150 per subscription, Standard 400 per user, Premium 750 per user, Enterprise 1,000 per user — [Automation usage doc](https://support.atlassian.com/cloud-automation/docs/how-is-my-usage-calculated/)
- **How steps are counted:**
  - Each trigger, condition, action and branch that runs counts as one step, and a false condition still counts.
  - Log, create-variable and lookup steps are free.
  - Throttled or aborted runs are not charged.
  - If extra usage is off and you hit 100%, flows stop until the reset.

  — [Automation usage doc](https://support.atlassian.com/cloud-automation/docs/how-is-my-usage-calculated/)
- Third-party AI actions in automation, such as "Use Cursor", count as steps — [Automation usage doc](https://support.atlassian.com/cloud-automation/docs/how-is-my-usage-calculated/)
- **Connect end of support:**
  - New Marketplace apps must be Forge-only from September 2025.
  - Connect app updates are blocked after March 31, 2026.
  - Connect reaches end of support at the end of 2026 / December 2026, after which it is "use at your own risk".

  — [Atlassian dev blog: Connect EoS timeline](https://www.atlassian.com/blog/developer/announcing-connect-end-of-support-timeline-and-next-steps); [Connect EoS private apps](https://developer.atlassian.com/platform/adopting-forge-from-connect/connect-end-of-support-private-apps/); [Atlassian blog: custom apps](https://www.atlassian.com/blog/development/connect-end-of-support-what-it-means-for-custom-apps-and-how-to-migrate-to-forge)
- Atlassian has opened the Teamwork Graph to external tools and coding agents through a CLI and the Rovo MCP Server in 2026 — [eesel What is Jira AI](https://www.eesel.ai/blog/what-is-jira-ai); [Rovo credits doc](https://support.atlassian.com/organization-administration/docs/usage-limits-in-atlassian-intelligence/), which mentions the Teamwork Graph CLI

### Inferences
- UNVERIFIED (prior knowledge): Jira Cloud also offers:
  - REST API v3 and the Agile REST API, using API tokens or OAuth 2.0 (3LO)
  - admin-registered and app-registered webhooks with JQL filters
  - thousands of Marketplace apps
  - native GitHub, GitLab and Bitbucket development panels
  - Slack and Microsoft Teams apps
- Orbit gap priority: public REST API with API keys, webhooks, a simple rule engine (trigger, condition, action), then GitHub and Slack integrations.
- Jira's metered automation steps and the Connect-to-Forge migration churn are pain points Orbit could position against: unmetered automations and a simple, stable API.

### Gaps
- REST API and webhook docs were not fetched this session.
- Marketplace app count was not verified.

## 5. Common user complaints (G2, Capterra, Reddit, HN)

### Takeaway
The recurring themes are a steep learning curve and complexity, slowness on large boards or heavily customised instances, and the need for a dedicated admin for permissions and automation. Pricing and AI or usage metering are also an issue. This session could only reach review content through search summaries; G2 and Capterra returned 403 and no Reddit thread was fetched.

### Cited Findings
- **Speed and complexity (2026 Capterra reviewers):**
  - The interface slows with many tickets on one board.
  - Performance drops with large ticket volumes or heavy customisation.
  - The learning curve is steep.
  - Permissions and automation setup usually need a dedicated admin.
  - Several reviewers still call Jira "the industry standard".

  — [Capterra Jira reviews](https://www.capterra.com/p/19319/JIRA/reviews/) (seen via search summary; the page fetch was blocked)
- Atlassian's status page logged a degraded-performance incident on September 11, 2026, affecting Work Items and Boards for about an hour — [Pulsetic Jira status incident](https://pulsetic.com/status/jira-software/incidents/105954/)
- **HN sentiment (secondhand):** the crowd leans toward Linear for speed and design, while larger teams say Jira's depth is hard to beat. One summary says Jira Cloud "still feels slower in daily use" — [ONES HN summary](https://ones.com/blog/linear-vs-jira-hacker-news-6-surprising-opinions-from-devs/) (vendor-biased: ONES sells a competitor); [eesel Linear vs Jira](https://www.eesel.ai/blog/linear-vs-jira)
- **"Why people hate Jira" themes:** complexity, over-customisation and admin burden — [Deviniti blog](https://deviniti.com/blog/enterprise-software/why-hate-jira/) (vendor blog, not fetched)
- **Older complaints:** complexity, slowness, unclear UI and poor vendor support — [Indie Hackers (Jan 2020; OLD)](https://www.indiehackers.com/product/gooose/a-look-at-jira-user-complaints--LyYV2CI7Nzxy_AfoqMk)
- **Recurring price rises:** about 7% in October 2026, reported by trackers as the sixth consecutive October increase — [UsagePricing](https://www.usagepricing.com/blueprint/activity/atlassian-2026-10-15-cloud-seat-price-increase); [PricingSaaS](https://pricingsaas.com/news/article/atlassian-raises-jira-cloud-prices-7-standard-climbs-to-8-48-per-user)

### Inferences
- Gaps Orbit can exploit:
  - speed on large boards
  - a fixed, opinionated workflow (Orbit already has four statuses), framed as "no admin required"
  - transparent, flat pricing with no metered AI or automation
  - a desktop app
  - built-in ideas and whiteboards without buying JPD or Confluence separately
- Risk: as Orbit adds custom fields and workflows to close gaps, it can drift into Jira's complexity complaints. Sensible defaults with opt-in configuration seem the right path.

### Gaps
- No G2 star rating, review count or Capterra sub-scores were obtained (403).
- No primary Reddit (r/jira, r/projectmanagement, r/agile) or HN thread was fetched. Quantified complaint frequencies are unavailable.

## 6. Pricing tiers and feature gating

### Takeaway
Jira Cloud has four tiers: Free (up to 10 users, 2GB), Standard, Premium (unlimited storage, 99.9% SLA, 24/7 support) and Enterprise. List prices rose about 7% in October 2026. Trackers report Standard at about $8.48 and Premium at about $15.56 per user per month, though the figures conflict. AI and automation are now usage-metered by tier, with overage from December 3, 2026.

### Cited Findings
- **Free:** up to 10 users, 2GB storage, community support. **Premium:** "Everything from Standard plus unlimited storage, 99.9% uptime SLA", 24/7 Premium support. Support is local business hours on Standard and 24/7 Enterprise support on Enterprise — [Atlassian Jira pricing (search snippet)](https://www.atlassian.com/software/jira/pricing); [Explore Jira Cloud plans](https://support.atlassian.com/jira-cloud-administration/docs/explore-jira-cloud-plans/). A G2 listing claims a 99.95% SLA for Premium, which conflicts — [G2 pricing](https://g2.com/products/jira/pricing)
- **October 2026 increase** (effective about October 13–15, 2026):
  - About 7% under 5,000 seats and 10% above, per one tracker.
  - Standard went from $7.91 to $8.48 and Premium from $14.54 to $15.56 per user per month.
  - Another source gives 100-user-tier figures: Standard from $9.05 to $9.70, Premium from $18.30 to $19.60.
  - These are conflicting third-party figures.

  — [PricingSaaS](https://pricingsaas.com/news/article/atlassian-raises-jira-cloud-prices-7-standard-climbs-to-8-48-per-user); [UsagePricing](https://www.usagepricing.com/blueprint/activity/atlassian-2026-10-15-cloud-seat-price-increase); [resolution.de](https://www.resolution.de/post/jira-pricing-plans/) (not fetched)
- **Rovo credits:** Free 0, Standard 25, Premium 70, Enterprise 150 per user per month. Overage is $0.01 per credit from December 3, 2026 — [Rovo credits doc](https://support.atlassian.com/organization-administration/docs/usage-limits-in-atlassian-intelligence/)
- **Automation steps:** Free 150 per subscription; Standard 400, Premium 750 and Enterprise 1,000 per user. Overage is $0.50 per 1,000 steps from December 3, 2026 — [Automation usage doc](https://support.atlassian.com/cloud-automation/docs/how-is-my-usage-calculated/)
- **Full Rovo suite** (search, chat, agents, Studio) is stated as Premium and Enterprise on Atlassian's AI page — [Atlassian Jira AI](https://www.atlassian.com/software/jira/ai)
- **JPD is billed separately:** Free for 3 creators, $10.50 Standard, $26.25 Premium per creator per month — [JPD pricing](https://www.atlassian.com/software/jira/product-discovery/pricing)
- **Rovo Dev standalone:** a tracker reports a sunset dated October 15, 2026, and that Rovo Dev Code Reviewer moves to Rovo credits on December 3, 2026 — [UsagePricing Rovo Dev sunset](https://www.usagepricing.com/blueprint/activity/atlassian-2026-10-15-rovo-dev-standalone-sunset) (third-party, unverified)

### Inferences
- A realistic "Jira-equivalent" stack for an agile team means paying for Jira Standard or Premium, plus JPD for ideas, plus Confluence for docs or whiteboards, plus metered AI. Orbit bundles ideas, whiteboards, time tracking and reports, which makes a strong total-cost comparison.
- UNVERIFIED (prior knowledge): Premium gating includes Plans (Advanced Roadmaps), sandbox, release tracks, admin insights and project archiving; Enterprise adds Atlassian Guard, data residency options and multiple sites. Confirm against the pricing comparison table.

### Gaps
- Atlassian's pricing page did not render, so official current per-user prices and the full feature-gating matrix were not confirmed.
- Whether Plans, sandbox and release tracks remain Premium-only in late 2026 was not verified.

## Summary gap map: what Jira has that Orbit lacks (✔ cited this session, ○ prior knowledge or unverified)

| Area | In Jira/Atlassian | Orbit |
|---|---|---|
| AI summaries, work breakdown, AI work creation, agents | ✔ Rovo (credits; paid plans) | None |
| Remote MCP server for Claude, ChatGPT, Cursor | ✔ Rovo MCP, GA February 4, 2026 | None |
| Automation rules | ✔ metered steps by tier | None |
| Idea insights, scoring formulas, matrix view, stakeholder roadmaps | ✔ JPD (separate product) | Partial (votes, comments, mind map) |
| Delivery-progress rollup from ideas | ✔ JPD | Convert-to-issue only |
| App platform and marketplace | ✔ Forge (Connect ending December 2026) | None |
| REST API, webhooks, GitHub/Slack integrations | ○ | None |
| Custom fields and workflows, typed links, components, versions/releases, watchers, mentions, saved JQL filters, dashboards and gadgets, CFD and control chart, Plans/Timeline, mobile apps, importers, email notifications | ○ | None |
| Uptime SLA, 24/7 support tiers | ✔ Premium 99.9% | Unknown |
