# AI, Agent and Developer-Platform Features in Issue Trackers (2026) and Market Gaps for Orbit

Research date: 2026-10-31. Method: web search plus fetches of primary docs where possible (Linear MCP docs, Atlassian Rovo MCP supported-tools page, Notion MCP docs). Many search hits were third-party blogs or aggregators, and those are flagged. Each claim has an inline source.

## Q1. Official MCP servers in issue trackers: tools, auth, remote vs local, security practices

### Takeaway
By late 2026 every major tracker checked (Linear, Atlassian Jira/Confluence, GitHub, Asana, ClickUp, monday, Notion, Plane) ships an official, vendor-hosted remote MCP server. The common pattern is Streamable HTTP, OAuth 2.1 for interactive use, and an optional bearer API token for headless or machine use. The vendors with the strongest security posture split tools into permission groups or scopes, offer a read-only endpoint, turn destructive tools off by default, and give admins controls to allow or revoke clients. For Orbit, a hosted MCP server with OAuth plus scoped API keys, a read-only mode, and opt-in delete/admin tools is now the baseline, not a differentiator.

### Cited Findings
**Linear**
- Read-write endpoint at `https://mcp.linear.app/mcp`, read-only endpoint at `https://mcp.linear.app/mcp/readonly`, and SSE `https://mcp.linear.app/sse` as a deprecated fallback. Streamable HTTP is the primary transport. `mcp-remote` bridges clients that lack native remote support. — [Linear MCP docs](https://linear.app/docs/mcp)
- Auth is OAuth 2.1 with dynamic client registration. As an alternative, a client can pass an OAuth access token or a Linear API key as `Authorization: Bearer`, which supports app-user identities and restricted read-only keys. Enterprise customers on Okta can enable managed authentication through Okta access policies, which requires SAML. — [Linear MCP docs](https://linear.app/docs/mcp)
- Three read-only options: the `/mcp/readonly` endpoint, requesting only the `read` OAuth scope, or an API key created with only Read permission. — [Linear MCP docs](https://linear.app/docs/mcp)
- Tools cover finding, creating and updating issues, projects and comments. A secondary source says there are 22 tools and that create and update issue were merged into one "save" tool in February 2026, and that SSE was removed in February 2026. These details are not confirmed on the primary page. — [Coworker AI blog](https://coworker.ai/blog/linear-mcp)
- LiteLLM's guidance: a shared API key is a single identity rather than per-user, so keep it for read-only or unattended use. — [LiteLLM docs](https://docs.litellm.ai/docs/mcp_servers/linear)

**Atlassian (Rovo MCP server, Jira and Confluence)**
- Jira tools are split into permission groups, each with its own scope:
  - `read_jira`: issues, projects, transitions, comments, worklogs, changelogs, boards, sprints, filters, dashboards, attachments.
  - `write_jira`: create and edit issues, transitions, comments, worklogs, links, versions, sprints, boards, watch, attachments.
  - `search_jira`: JQL via `searchJiraIssuesUsingJql`.
  - `delete_jira`: permanent deletes. Disabled by default.
  - `manage_jira`: projects, workflows, screens. Disabled by default.
  — [Atlassian supported tools](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/supported-tools/)
- Admins grant or revoke access per permission group. Execution tools (`executeRead` / `executeWrite` / `executeDestructive`) add agent-level confirmation. The disclaimer recommends least privilege, reviewing high-impact changes, and monitoring audit logs. — [Atlassian supported tools](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/supported-tools/)
- Some Confluence tools spend usage credits, for example infographic generation at 15 to 30 Rovo credits per request. — [Atlassian supported tools](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/supported-tools/)
- OAuth 2.1 is the default. Admins can toggle API-token access, which is off by default per one secondary source. Atlassian recommends API tokens only for non-interactive, machine-to-machine use. Allowed domains and IP allowlists also apply to MCP tool calls. — [Atlassian: control Rovo MCP settings](https://support.atlassian.com/security-and-access-policies/docs/control-atlassian-rovo-mcp-server-settings/); [Atlassian dev: auth](https://developer.atlassian.com/cloud/rovo-mcp/guides/authentication-and-authorization/); [Torq KB](https://kb.torq.io/en/articles/15163007-atlassian-rovo-mcp-server); [atlassian-mcp-server GitHub](https://github.com/atlassian/atlassian-mcp-server)
- Jira Service Management tools work only with API tokens. — [Atlassian supported tools](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/supported-tools/)

**GitHub**
- Hosted remote server at `api.githubcopilot.com/mcp/`, plus a local Docker server for GHES or air-gapped setups. OAuth is the default in supported hosts, and a PAT is optional as a bearer token. — [developertoolkit.ai guide](https://developertoolkit.ai/en/ecosystem/mcp/github-mcp/); [github-mcp-server PR #1495](https://github.com/github/github-mcp-server/pull/1495/files)
- Configuration options:
  - **Toolsets:** default toolsets are context, issues, pull_requests, repos and users. Selected with `--toolsets`, the `X-MCP-Toolsets` header, or `/x/{toolset}` URLs.
  - **Read-only mode:** `--read-only`, the `X-MCP-Readonly` header, or a `/readonly` URL. It overrides everything else.
  - **Lockdown mode:** limits public-repo content to authors with push access. One source warns it is a best-effort content filter, not an authorization boundary.
  — [developertoolkit.ai](https://developertoolkit.ai/en/ecosystem/mcp/github-mcp/); [NeuralTrust, Oct 2026](https://neuraltrust.ai/blog/how-to-secure-github-mcp)

**Asana**
- Official remote server, V2 at `mcp.asana.com/v2/mcp` (Streamable HTTP, OAuth), launched February 2026 and replacing the beta endpoint. Tool count is about 42 to 44 per third-party sources. Community servers using PATs add comments/stories that V2 reportedly lacks (third-party claim). — [Asana dev docs](https://developers.asana.com/docs/mcp-server.md); [mcpservers.org](https://mcpservers.org/remote-mcp-servers/asana)

**ClickUp**
- Hosted at `https://mcp.clickup.com/mcp`. OAuth only, with no API keys or PATs. Available on all plans. Covers tasks, Docs, time tracking, chat and hierarchy, but not Goals, Dashboards or Automations. — [ClickUp help](https://help.clickup.com/hc/en-us/articles/33335772678423); [ClickUp blog](https://clickup.com/blog/how-to-use-clickup-mcp-server/)

**monday.com**
- Hosted at `https://mcp.monday.com/mcp` (Streamable HTTP). OAuth 2.0, or a bearer personal API token. More than 60 tools. An optional `Api-Version` header (for example `2026-07`) pins the API version. An open-source local npm server is also available. A third-party doc (C1) contradicts the docs and says hosted access is OAuth-only. — [monday dev docs](https://developer.monday.com/api-reference/docs/integrate-with-monday-mcp); [mondaycom/mcp GitHub](https://github.com/mondaycom/mcp); [C1 docs](https://www.c1.ai/docs/product/admin/mcp-server/monday.md)

**Notion**
- Notion hosts the remote server itself and uses OAuth. The client gets only the content the user can access. Workspace owners manage connected clients in Settings → Notion MCP. Restricting which clients members may connect requires Enterprise. Org owners can list and revoke connections via the Admin API. — [Notion MCP docs](https://developers.notion.com/docs/mcp)

**Plane** (closest open-source competitor)
- Cloud server at `mcp.plane.so`. Self-hosted users run a local stdio server with an API key, workspace slug and `PLANE_BASE_URL`, or deploy their own. — [Plane dev docs](https://developers.plane.so/dev-tools/mcp-server)

**MCP spec security guidance**
- Token passthrough is an anti-pattern: servers "MUST NOT accept any tokens that were not explicitly issued for the MCP server." — [MCP security best practices](https://modelcontextprotocol.io/specification/latest/basic/security_best_practices)
- To prevent confused-deputy attacks, proxy servers MUST implement per-client consent. The consent UI must name the client, show the requested scopes and the redirect_uri, and include CSRF and anti-framing protection. — [MCP security best practices (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices)

### Inferences
- Common design across vendors:
  - remote Streamable HTTP endpoint
  - OAuth 2.1 with DCR for interactive clients such as Claude, Cursor and ChatGPT
  - bearer API key for scripts and CI
  - a read-only variant (Linear and GitHub use a separate URL)
  - permission-group scopes, with destructive and admin tools off by default (Atlassian)
  - admin revocation of connected clients (Notion, Atlassian)
- For Orbit, the minimum credible MCP surface is:
  - search issues (by issue key or a filter DSL)
  - get, create and update issue
  - add comment
  - list and transition statuses
  - sprint operations (list, add or remove issue, start/complete gated)
  - list projects, epics and users
  - log time
  - create idea or convert idea to issue
- Orbit's existing four-role RBAC maps naturally onto MCP scopes, for example viewer = read-only scope.
- Gap no one handles well: per-tool audit logs that the customer can see. Atlassian tells customers to "monitor audit logs" but documents little. Orbit could differentiate with an "agent activity log" showing per-token and per-client actions with undo.

### Gaps
- Exact current tool lists for Linear, Asana and Notion were not fetched. Counts above come from third parties.
- No primary-source details found on audit-log contents for any vendor's MCP actions.

## Q2. Common AI copilot and agent features, and which get positive vs negative feedback

### Takeaway
The 2026 feature set has converged on:
- triage intelligence (duplicate detection, suggested labels and assignees)
- an in-product agent or chat
- summarisation
- natural-language search
- "assign the issue to a coding agent", which is the fastest-growing, developer-facing capability

The features users value are ones that cut admin work (dedupe, triage) and agent delegation that reports progress back into the issue. Criticism is aimed at reliability, metered or seat-based AI pricing, and data-use policies.

### Cited Findings
- Linear Triage Intelligence compares new triage issues against existing data, suggests duplicate or related links on strong semantic similarity, and accepts guidance text at sub-team, team or workspace level. — [Linear docs: Triage Intelligence](https://linear.app/docs/triage-intelligence)
- Linear changelog items:
  - December 2025: duplicate requests from Intercom, Zendesk and Gong are auto-merged into existing issues.
  - June 2026: fixes to concurrent duplicate merges during bulk dedupe.
  — [Linear changelog 2025-12-11](https://linear.app/changelog/2025-12-11-linear-agent-for-intercom-zendesk-gong); [releases.sh Linear](https://releases.sh/linear/linear.md)
- Linear Agent is described as public beta, with Agent and Skills on all plans and Automations and Code Intelligence on Business/Enterprise. A third-party guide contradicts this and says Agent requires Business or higher. — [releases.sh Linear](https://releases.sh/linear/linear/highlights); [BuildBetter guide](https://blog.buildbetter.ai/linear-ai-agents-2026-guide-5-alternatives-for-engineering-teams/)
- GitHub Copilot coding agent for Jira, public preview (March 2026):
  - Assigning a Jira issue makes Copilot read the issue and comments, open a draft PR, and post updates and clarifying questions back into Jira.
  - Requires Jira Cloud with Rovo and the Marketplace app.
  — [GitHub changelog 2026-03-05](https://github.blog/changelog/2026-03-05-github-copilot-coding-agent-for-jira-is-now-in-public-preview/)
- Copilot cloud agent for Linear, GA on 2026-07-23 (public preview from 2025-10-28):
  - Runs in GitHub Actions, opens a draft PR, and streams progress to the Linear timeline.
  - Supports a model picker, custom repo agents, base and working branch settings, and steering through comments.
  - Available on Pro, Pro+, Business and Enterprise.
  — [GitHub changelog 2026-07-23](https://github.blog/changelog/2026-07-23-copilot-cloud-agent-for-linear-is-now-generally-available?from=bd_signal); [GitHub changelog 2025-10-28](https://github.blog/changelog/2025-10-28-github-copilot-for-linear-available-in-public-preview)
- Linear also integrates agents from Cursor, Codex and Devin. Claude Code reaches Linear through Cyrus, an open-source runner on Linear's Agent SDK that opens branches and PRs and posts updates (article undated). — [Hookdeck](https://hookdeck.com/webhooks/platforms/how-to-run-claude-code-as-a-linear-agent-with-cyrus-and-hookdeck-cli)
- Criticism of Rovo, all secondary-source reports:
  - HN users report unreliable results, such as missed Confluence pages and an edit that erased a page.
  - Using customer data for AI training drew criticism, with full opt-out reportedly Enterprise-only.
  — [beri.net Rovo summary](https://www.beri.net/tools/atlassian-rovo)
- Developer trust context (Stack Overflow 2025):
  - 46% distrust AI accuracy, up from 31%.
  - 31% use AI agents and 38% don't plan to.
  - 69% of agent users report productivity gains.
  — [Stack Overflow press release](https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/)
- State of Agile, 18th edition (October 2025, about 350 respondents, skewed to large enterprises):
  - 84% of organisations use AI tools, 41% in a coordinated way.
  - More than a quarter of AI users are experimenting with agentic AI.
  - 76% say ROI pressure is reshaping investment.
  — [ITPro](https://itpro.com/software/development/ai-is-transforming-agile-development-practices-as-teams-battle-mounting-delivery-cycle-pressure-and-roi-concerns); [BusinessWire](https://www.businesswire.com/news/home/20251028047166/en)

### Inferences
- Highest-value AI features for Orbit, mapped to existing features:
  1. Issue drafting from free text or pasted bug reports into the epic/story/task/bug types with story points.
  2. Duplicate and related detection on create. This needs typed links, which Orbit lacks.
  3. Sprint planning assist from velocity and workload data Orbit already has: capacity-aware suggestions and carry-over risk.
  4. Auto-generated sprint and standup summaries from the activity feed and burndown.
  5. Natural-language to filter translation, which also needs saved filters.
  6. "Assign to agent" through MCP plus webhooks, so external coding agents can pick up ORB-42 and post back.
- Trust data suggests making AI output reviewable (draft, then human confirm) instead of auto-applying. This matches Atlassian's `executeDestructive` confirmation pattern.

### Gaps
- No primary-source user sentiment found for Linear's AI features, ClickUp Brain, or Asana AI Studio beyond pricing complaints.
- No data found on which specific AI features drive retention or upgrades.

## Q3. Bring-your-own-key AI: providers, key storage, cost controls, privacy, examples

### Takeaway
BYOK is rare among mainstream SaaS trackers, which sell AI as per-seat add-ons or metered credits. The clearest tracker example is Plane, which uses BYOK for self-hosted Plane AI. BYOK patterns are mature in AI gateways and developer tools: encrypted-at-rest keys that are never returned, per-project scope, and spend caps. This is an open slot for Orbit, particularly given Orbit's desktop/local-first architecture.

### Cited Findings
- Plane AI for commercial self-hosted instances was announced for March 3, 2026:
  - Bring-your-own-key for OpenAI or Anthropic, with AWS Bedrock and local Ollama also listed.
  - Plane says it stores no keys, prompts or responses, and calls go straight from customer infrastructure to the provider.
  - Usage and spend analytics across workspaces.
  — [Plane blog](https://plane.so/blog/plane-ai-is-coming-to-self-hosted-deployments); [Plane self-hosted](https://plane.so/self-hosted)
- Incumbent pricing models, which BYOK would contrast with:
  - **Atlassian Rovo:** per-user monthly credit allowances (secondary source: 25 Standard / 70 Premium / 150 Enterprise on Jira), pooled across the org, about 10 credits per basic interaction. Overage at $0.01/credit billed from 2026-12-03, reportedly enabled by default. Rovo Dev standalone is being folded into credit metering.
  - **Reviewer criticism of Rovo:** "credit pricing is hard to budget."
  - **ClickUp Brain:** about $9/user/month annual (sources conflict; older figures say $7), charged per paid seat rather than per AI user. Reddit reports of bundle-price "bait and switch."
  — [Breeze](https://www.breeze.pm/articles/atlassian-pricing-changes-2026); [Empyra](https://www.empyra.com/blog/rovo-credits-per-user); [UsagePricing](https://www.usagepricing.com/blueprint/activity/atlassian-2026-10-15-rovo-dev-standalone-sunset); [eesel Rovo pricing](https://www.eesel.ai/blog/atlassian-intelligence-and-rovo-pricing-explained); [eesel ClickUp Brain](https://eesel.ai/blog/clickup-brain); [Spendbase](https://www.spendbase.co/?p=20748)
- BYOK implementation patterns from other products:
  - **Anchor Browser:** keys are per project, opt-in per request, encrypted at rest, and never returned by the API. Only a reference is stored.
  - **Qodex:** project-scoped keys, with traffic billed to the customer's provider account.
  - **Kilo:** an invalid key fails the request rather than silently falling back to the platform key.
  - **Requesty:** at most one key per provider.
  — [Anchor Browser](https://docs.anchorbrowser.io/advanced/bring-your-own-key); [Qodex](https://qodex.ai/docs/integrations-byok); [Kilo](https://kilo.ai/docs/basic-usage/byok); [Requesty](https://docs.requesty.ai/features/bring-your-own-keys)
- Cost controls (OpenRouter): per-key credit limits, and workspace budgets with daily, weekly, monthly or lifetime intervals that auto-block when exhausted. BYOK spend is excluded from budgets by default unless `include_byok_in_budgets` is set. Recommended pattern: one workspace per team, a pooled budget, and a per-agent key cap. — [OpenRouter team spend](https://openrouter.ai/blog/insights/governing-team-ai-spend); [OpenRouter capping agent keys](https://openrouter.ai/docs/guides/best-practices/capping-shared-agent-keys)

### Inferences
- Recommended Orbit BYOK design, synthesised from the patterns above:
  - workspace-level key, settable by owner or admin, with an optional per-user key
  - providers: Anthropic, OpenAI, an OpenAI-compatible base URL (covers OpenRouter, Azure, Ollama and local models), and optionally Bedrock
  - keys encrypted at rest (envelope encryption with a server KMS key, or the OS keychain in the Tauri desktop app), write-only in UI and API with only the last 4 characters shown
  - no silent fallback to a platform key
  - monthly token or spend cap per workspace and per user, with a usage dashboard
  - zero retention of prompts on Orbit's side, plus a clear data-flow statement
- Positioning: "no AI seat tax, no credits, you pay your provider" is a direct answer to the Rovo and ClickUp pricing complaints.

### Gaps
- No verified BYOK in mainstream SaaS trackers (Linear, Jira, Asana, ClickUp, monday, Notion). The search found none, but absence is not proof.
- No primary documentation found for how Plane encrypts and stores self-hosted keys.
- No data found on how much customers want BYOK in project-management tools specifically.

## Q4. API design norms: PATs vs workspace keys, scopes, rate limits, webhooks, OAuth apps

### Takeaway
The norm is a GraphQL or REST API with two credential types: personal API keys (user identity, simple, lower limits) and OAuth apps (including app/actor identities for bots and agents, higher limits). Fine-grained read/write scopes, per-credential hourly rate limits, and HMAC-SHA256-signed webhooks with delivery IDs and timestamps are standard.

### Cited Findings
- Linear rate limits:
  - API key: 2,500 requests/hour per user.
  - OAuth app: 5,000/hour per user or app user.
  - Unauthenticated: 600/hour per IP.
  - Some endpoints have lower limits. Workspace-level OAuth apps using actor authorization get limits that scale with paid seats.
  - A third-party guide gives older, lower numbers (1,500/500), which conflict with the official page.
  — [Linear rate limiting](https://linear.app/developers/rate-limiting.md); [rollout.com (conflicting)](https://rollout.com/integration-guides/linear/api-essentials)
- Linear webhooks:
  - Signed with HMAC-SHA256 over the raw body using a signing secret, as bare hex in the `Linear-Signature` header.
  - Also sent: `Linear-Event` (entity type) and `Linear-Delivery` (UUID).
  - The payload's `webhookTimestamp` supports replay protection.
  - Endpoints that keep failing may be auto-disabled (secondary source).
  — [Hookdeck Linear webhooks guide](https://hookdeck.com/webhooks/platforms/guide-to-linear-webhooks-features-and-best-practices)
- Linear API keys can be restricted to Read permission. OAuth supports a `read` scope and app-user identities. — [Linear MCP docs](https://linear.app/docs/mcp)
- GitHub fine-grained PATs: least-privilege per-repo permissions, for example read-only Contents, Issues, Pull requests and Actions. Org policies can restrict PATs. — [developertoolkit.ai](https://developertoolkit.ai/en/ecosystem/mcp/github-mcp/)
- monday supports API version pinning through a header (`Api-Version: 2026-07`). — [monday dev docs](https://developer.monday.com/api-reference/docs/integrate-with-monday-mcp)
- Atlassian: OAuth for interactive use, API tokens for machine-to-machine, and admin toggles for token auth. — [Atlassian dev: auth](https://developer.atlassian.com/cloud/rovo-mcp/guides/authentication-and-authorization/)

### Inferences
- Recommended Orbit API spec:
  - REST plus OpenAPI (easier for MCP tool generation than GraphQL)
  - personal API keys (`orb_pat_…`, shown once, stored hashed, with expiry and last-used timestamp) and workspace service keys with a bot identity
  - scopes such as `issues:read/write`, `sprints:write`, `comments:write`, `time:write`, `admin`, intersected with the user's role
  - per-key hourly rate limits returned in headers
  - webhooks with an HMAC-SHA256 signature, delivery ID, timestamp, retries with backoff, and a delivery log
  - date-based API version header
  - OAuth apps can follow later; MCP OAuth with DCR is needed for Claude/ChatGPT connectors
- Note on the desktop (Tauri) and local-first deployment: a local stdio MCP server using a PAT (as Plane does for self-hosted) is a cheap first step before a hosted OAuth endpoint.

### Gaps
- Not checked: Asana, ClickUp and Jira REST rate-limit numbers and webhook signing details.

## Q5. Recurring user frustrations and unmet needs, and switching drivers

### Takeaway
The most consistent complaints:
- **Jira:** slowness, bloat and plugin dependence, click-heavy UI, admin overhead.
- **Linear:** gaps in reporting, automation and complex epic management, plus fear it will become Jira.
- **AI add-ons generally:** unpredictable or seat-taxed pricing.

Switching costs are the main moat. Quantified switching-driver data is thin. Most sources here are vendor blogs and should be read as indicative.

### Cited Findings
- Reddit threads repeatedly call Jira "painfully slow" and say you need "a dozen plugins to do basic tasks" (vendor blog summary). — [ONES blog](https://ones.com/blog/wp-json/wp/v2/posts/1059022)
- Complaints include complex UI, too many clicks, unnecessary fields, slow navigation, and degraded performance on large projects. — [DEV Community](https://dev.to/kruti12/no-more-jira-fatigue-lightweight-project-management-alternatives-for-dev-teams-572n)
- Reported lag at scale of 10 to 20 minutes a day per user (aggregated complaint data, unverified). — [BigIdeasDB Jira complaints](https://www.bigideasdb.com/complaints/jira-complaints)
- A switcher review says Jira is "bloated and slow" while Linear is "sleek and fast." — [PeerSpot Linear reviews](https://www.peerspot.com/products/linear-reviews)
- Linear's own weaknesses per G2: lacking automation and complex epic management, poor reporting that needs external tools, and fear it "could become Jira one day." — [G2 Linear review](https://g2.com/products/linear/reviews/linear-review-9950469)
- ClickUp analysed 170 G2/Capterra/TrustRadius reviews framing Linear as "Jira before the mess" (competitor-authored). — [ClickUp blog](https://clickup.com/blog/linear-vs-jira/)
- Switching cost, not quality, is argued to be Jira's moat. Jira Server ended in February 2024, and the Data Center minimum is 500 users, which pushes small teams to Cloud. — [Cotera](https://cotera.co/articles/jira-software-alternatives.md)
- Jira's reach: used by 46% of Stack Overflow 2025 respondents for collaboration (GitHub 81%). — [Stack Overflow 2025 coverage](https://shiftmag.dev/stack-overflow-survey-2025-ai-5653/)
- State of Agile 18th: 78% struggle with repeated leadership and structural changes, and only half feel they can deliver reliably with accountability. — [ITPro](https://itpro.com/software/development/ai-is-transforming-agile-development-practices-as-teams-battle-mounting-delivery-cycle-pressure-and-roi-concerns)
- AI pricing frustration: Rovo credits are "hard to budget." ClickUp Brain is charged per seat rather than per AI user. — [eesel](https://www.eesel.ai/blog/atlassian-intelligence-and-rovo-pricing-explained); [Spendbase](https://www.spendbase.co/?p=20748)
- Atlassian Cloud pricing changes in fall 2026 are an ongoing source of churn consideration (secondary). — [Breeze](https://www.breeze.pm/articles/atlassian-pricing-changes-2026); [WorkManagementHub](https://workmanagementhub.com/atlassian-cloud-pricing-changes-fall-2026/)

### Inferences
- Gap map for Orbit.
- **Orbit already addresses:**
  - speed and simplicity (Linear-style)
  - built-in time tracking, which Linear lacks natively
  - ideas with voting
  - whiteboards and flowcharts linked to issues
  - workload reports
  - desktop app
- **Orbit gaps that block switching from Jira or Linear:**
  - import from Jira/Linear/CSV. This is critical given that switching cost is the moat.
  - GitHub/GitLab integration: PR linking and auto-transition
  - Slack notifications
  - webhooks and API
  - custom fields and statuses
  - mentions and email notifications
  - saved filters
  - typed links, needed for dedupe AI
- **Positioning wedge:**
  - "Linear-fast, with time tracking and ideas built in, open API and MCP from day one, BYOK AI with no seat tax"
  - AI aimed at status-update busywork: auto sprint reports and standup digests from existing activity and burndown data
  - estimation help from velocity history, addressing poor estimation
- **Avoid:** AI that auto-writes without review (trust data), and opaque credit pricing.

### Gaps
- No direct 2026 Reddit, HN or r/ExperiencedDevs threads were fetched. Sentiment here comes largely from vendor blogs and review aggregators, and one Reddit item cited in a search summary dates from 2024.
- No quantitative survey found on which features drive switching between trackers.
- No primary data on status-update busywork time; only an unverified complaint-aggregator figure.
- The State of Agile 18th edition is from October 2025, slightly older than the target window, with an enterprise-skewed sample of about 350.
