# Scout — a research agent that knows when to delegate

**Live demo:** https://zamp-interview-round.vercel.app

Scout is a conversational research assistant. You chat with a **main agent** (the
orchestrator); when a question is big or has independent parts, it hands work to
**sub-agents** you define — specialists with their own instructions and tools —
and then synthesizes their findings into one answer. You watch the delegation
happen live: each sub-agent's searches, reads, and reasoning stream into the UI
as it works.

This was built for an open-ended prompt: _"build a conversational agent that
helps a user accomplish a real task."_ The notes below explain how I interpreted
that, what I built, and what I deliberately left out.

---

## The problem, and how I scoped it

A "conversational agent" is almost too open to be useful. A single chatbot with a
web-search tool is a weekend project and proves little. So I picked the part that
is genuinely hard and genuinely useful:

> **Multi-agent research with delegation** — a coordinator that decides _when_ to
> split a task, dispatches specialists to work in parallel, and reconciles their
> results, while the user sees the whole process rather than a black box.

That framing does real work:

- **Who it's for.** Someone doing open-ended research — market sizing, company
  due diligence, "what's the latest on X." The kind of task where the answer
  comes from several sub-investigations, not one lookup.
- **What it actually solves.** Long research tasks are tedious to drive by hand.
  Delegation lets the user define reusable specialists once ("Company Profiler",
  "Market Analyst") and then pose a high-level question; the orchestrator routes
  the work. Streaming the sub-agent traces keeps it trustworthy — you can see
  _what_ was searched and _which sources_ were used, not just a final blob.

### What's in

- **Delegation** — the orchestrator reads your roster of enabled sub-agents and
  decides whether to dispatch parts of a question to them (in parallel). Type
  `@slug` in the composer to force a specific sub-agent.
- **Accounts + per-user data** — email/password sign-up and login (JWT in an
  httpOnly cookie). Your chats and sub-agents are scoped to you.
- **A real UI** — Ant Design v5 with all styling driven by **design tokens**
  (via styled-components), a sub-agent manager, live delegation panels, and a
  light/dark toggle.
- **Tests + CI** — a Playwright end-to-end suite that gates the production deploy.

### What I deliberately left out (and why)

The goal was depth on the core mechanic, not breadth. Within five days I cut:

| Left out | Why |
|---|---|
| Orgs / teams / roles | Auth is single-user accounts; sharing and org plumbing add surface area without testing the core idea. |
| Billing, credits, rate limits | Production concerns orthogonal to the idea. |
| A job queue for sub-agents | Sub-agents run **inline** (in-process, in parallel via `Promise.all`). A queue (BullMQ/Redis) buys horizontal scale and durability I don't need for a demo, at a large complexity cost. |
| Human-in-the-loop pauses | Interesting, but a rabbit hole. Sub-agents run to completion. |
| Nested delegation (sub-agents spawning sub-agents) | Capped at one level on purpose — it bounds cost and keeps traces readable. The depth guard is real (`MAX_DELEGATION_DEPTH`), so lifting it later is a one-line change. |

These are scoping decisions, not unfinished work. Each cut is a place I chose
clarity over surface area.

---

## The hard sub-problems I went deep on

**1. A faithful message "parts" round-trip.** A conversation turn is stored as an
ordered list of parts — interleaved `text`, `tool-call`, and `tool-result` — not
a flat string. That's what lets the app re-render a turn (including tool calls
and nested sub-agent traces) exactly as it streamed, _and_ feed a correct history
back to the model on the next turn. The two representations differ on purpose:
storage uses `args`/`result` with the call and its result in one message; the
model wants `input`/`output` with results split into a separate `tool` message.
The conversion (`src/lib/ai/messages.ts`) is small but exacting — including the
subtlety that a `delegate` result stores the **full** sub-agent transcript for
the UI but only replays a **compact** rollup to the model, so the orchestrator's
context doesn't balloon turn over turn.

**2. Live, nested sub-agent streaming over one SSE channel.** When the
orchestrator delegates, each sub-agent runs its own tool loop, and its internal
steps are surfaced to the browser in real time as `agent-*` events keyed by a
`delegationId`. The same engine powers both the orchestrator and the sub-agents;
they differ only in how their stream events are wired. A delegation re-renders
identically whether it's streaming live or loaded from the database.

**3. One design-token theme, everywhere.** The UI has zero hardcoded colors.
antd's resolved design tokens are bridged into styled-components' theme
(`src/lib/styled/TokenThemeBridge.tsx`), so every styled component reads
`theme.colorPrimary`, `theme.colorBorderSecondary`, etc. Flipping the root antd
algorithm (light ⇄ dark) restyles the entire surface with no per-component work —
that's the whole light/dark toggle. The left rail stays dark in both modes via a
nested `ConfigProvider`, proving the same components resolve light or dark purely
from tokens. zod schemas (`src/lib/schemas`) are the single source of truth for
form validation, API validation, and TypeScript types.

---

## Architecture

```
Browser (antd + styled-components, custom SSE client)
   │  POST /api/auth/*                   ← sign up / log in (sets httpOnly JWT cookie)
   │  POST /api/sessions/:id/messages    ← user turn (cookie authenticates)
   │  ◀───────── text/event-stream of typed `ChatStreamEvent`s
   ▼
Next.js route handler (Node runtime) — resolves the user from the cookie, scopes all data
   ▼
runMainAgent  ──▶  AI SDK streamText loop (engine.ts)
   │                 ├─ tool: web_search (Tavily)
   │                 ├─ tool: read_pdf  (unpdf)
   │                 └─ tool: delegate ─▶ runSubAgent ─▶ its own streamText loop
   │                                          (web_search / read_pdf)
   ▼
MongoDB (Mongoose) — users, sessions + messages (stored as parts), sub-agents — all per-user
```

- **Auth.** Email/password (bcrypt hashes), a `jose`-signed JWT stored in an
  httpOnly, SameSite cookie. Every data route resolves the user from the cookie
  and scopes its queries; unauthenticated calls get `401`. Sub-agent slugs are
  unique per user.
- **Model.** OpenAI `gpt-4.1`, resolved through an AI SDK **provider registry**
  (`openai:gpt-4.1`) so adding providers later is trivial.
- **Tools** are AI SDK tools (`inputSchema`/`outputSchema`/`execute`). Runtime
  data (session id, owner id, the SSE emitter, recursion depth) is threaded in
  via `experimental_context`.
- **Persistence.** The assistant message is checkpointed to Mongo after every
  tool event, so a refresh mid-research never loses progress.
- **Streaming.** A hand-rolled SSE protocol (one JSON `ChatStreamEvent` per
  `data:` frame). The event union is the contract shared by server and client —
  see `src/lib/types/sse.ts`.

### Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Ant Design 5 (design tokens) ·
styled-components 6 · Vercel AI SDK 6 · OpenAI `gpt-4.1` · MongoDB + Mongoose ·
Tavily (web search) · unpdf (PDF text) · `jose` + `bcryptjs` (auth) · zod ·
Playwright (E2E).

### Project structure

```
src/
  app/
    api/
      auth/{signup,login,logout,me}/route.ts   # JWT auth (httpOnly cookie)
      sessions/route.ts · [id]/route.ts         # chats (per-user)
      sessions/[id]/messages/route.ts           # chat — SSE stream
      agents/route.ts · [id]/route.ts           # sub-agents (per-user)
    layout.tsx · page.tsx · page.styles.ts      # root + auth-gated workspace
  components/                                   # one folder per component:
    AuthModal/ Sidebar/ ChatWindow/ Composer/   #   Component.tsx
    MessageList/ MessageBubble/ Markdown/        #   + Component.styles.ts
    AgentManager/ AgentForm/ Providers/ parts/   #   + index.ts
  lib/
    auth/        # jwt (jose), password (bcrypt), session (cookie), service
    ai/          # engine, main-agent, sub-agent, messages (heavily exercised), prompts, registry
    tools/       # web-search (Tavily), read-pdf (unpdf), delegate
    db/          # mongoose connection, models (user/agent/chat-session), services
    schemas/     # zod: agent, auth — source of truth for forms + API + types
    styled/      # styled-components SSR registry + antd-token bridge + GlobalStyle
    theme.ts · theme-mode.tsx                    # design tokens + light/dark state
    types/       # the shared contract: parts, sse, api, delegation
  e2e/           # Playwright specs + an auto-signup fixture
scripts/
  dev.mjs        # `pnpm dev` orchestrator (auto-starts a local MongoDB)
  seed.ts        # demo user + example sub-agents
```

---

## Running it locally

The dev command is self-contained: **`pnpm dev` auto-starts a local MongoDB** in
`./.mongo` if one isn't already running (no brew/launchd needed), then starts the
app. You only need a `mongod` binary on your PATH (`brew install
mongodb-community`) — or point `MONGODB_URI` at any MongoDB / Atlas cluster.

> The agent needs an OpenAI key to think and a Tavily key to search. Without the
> Tavily key the app still runs — `web_search` returns a "not configured" notice
> and the model falls back to its own knowledge.

### Prerequisites

- Node 20+ and `pnpm`
- `mongod` on your PATH (or a remote `MONGODB_URI`)

### Steps

```bash
# 1. install
pnpm install

# 2. configure — copy the example and fill in the values
cp .env.example .env
#   OPENAI_API_KEY  — OpenAI (model: gpt-4.1)
#   TAVILY_API_KEY  — web search
#   MONGODB_URI     — defaults to a local instance
#   JWT_SECRET      — any long random string (signs the session token)

# 3. seed a demo account + three example sub-agents
pnpm seed
#   → demo login:  demo@scout.app  /  demodemo

# 4. run (auto-starts MongoDB, then Next dev on http://localhost:3000)
pnpm dev
```

### Try it

1. **Log in** with `demo@scout.app` / `demodemo` (or sign up for a fresh account).
2. Open **Manage agents** to see the seeded sub-agents (or create your own — name,
   description, instructions, and the tools it may use).
3. Start a new chat and ask something that invites delegation, e.g.
   _"Compare Stripe and Adyen — business model, scale, and recent moves."_
4. Watch the orchestrator delegate to your sub-agents and stream their work, then
   synthesize a final answer. (Type `@market-analyst …` to force a specific one.)

### Tests & checks

```bash
pnpm test:e2e    # Playwright end-to-end (auto-starts the dev server)
pnpm typecheck   # tsc --noEmit
pnpm lint        # next lint
```

The E2E suite covers the flows most worth protecting: the app shell + token-driven
theming, the light/dark toggle (persisted across reloads), sub-agent CRUD with
zod-driven validation, starting a chat, and the full auth flow (sign up → log out
→ log in). Each spec signs up a fresh, isolated user via an auto-signup fixture,
so runs are deterministic.

---

## Deploying

The app deploys to **Vercel**, with **MongoDB Atlas** for the database (the
local-Mongo default in `.env` is dev-only). **CI gates the deploy**: on every push
to `main`, GitHub Actions runs the Playwright suite (against a MongoDB service
container) and only deploys to production if it passes (`.github/workflows/deploy.yml`).

1. Create a free MongoDB Atlas cluster; copy its connection string.
2. Import the repo into Vercel.
3. Set env vars in Vercel: `OPENAI_API_KEY`, `TAVILY_API_KEY`, `MONGODB_URI` (the
   Atlas string), and `JWT_SECRET` (a long random string). **All four are required**
   — without `JWT_SECRET`, auth fails at runtime.
4. Deploy. Run the seed once against Atlas (`MONGODB_URI=<atlas> pnpm seed`) if you
   want the demo account and example sub-agents.

One thing to know: a deep research turn (orchestrator + several sub-agents) can run
for tens of seconds. The chat route sets `maxDuration = 60` (the Vercel Hobby/free
function ceiling); on Vercel Pro or a host without a hard timeout you can raise it
to 300. On the free tier, keep demo queries modest (one or two sub-agents). Because
sub-agents run in-process, the whole turn completes within a single invocation.

---

## Notes on what I'd do next

- Persist and surface a **citation index** (dedupe sources across sub-agents,
  number them, render a references list).
- An **eval harness**: a small set of research prompts with rubric-scored
  expectations, run against the agent to catch regressions in answer quality.
- Move sub-agent execution to a **queue** if scale ever demanded it — the depth
  guard and per-delegation ids are already in place for that.
