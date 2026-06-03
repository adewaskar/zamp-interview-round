# Scout — a research agent that knows when to delegate

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

### What I deliberately left out (and why)

The goal was depth on the core mechanic, not breadth. Within five days I cut:

| Left out | Why |
|---|---|
| Auth / multi-user / orgs | Adds plumbing, not insight. Single-user keeps the focus on the agent. |
| Billing, credits, rate limits | Production concerns orthogonal to the idea. |
| A job queue for sub-agents | Sub-agents run **inline** (in-process, in parallel via `Promise.all`). A queue (BullMQ/Redis) buys horizontal scale and durability I don't need for a demo, at a large complexity cost. |
| Human-in-the-loop pauses | Interesting, but a rabbit hole. Sub-agents run to completion. |
| Nested delegation (sub-agents spawning sub-agents) | Capped at one level on purpose — it bounds cost and keeps traces readable. The depth guard is real (`MAX_DELEGATION_DEPTH`), so lifting it later is a one-line change. |

These are scoping decisions, not unfinished work. Each cut is a place I chose
clarity over surface area.

---

## The hard sub-problem I went deep on

Two things took the most care and are where the "real" engineering is:

**1. A faithful message "parts" round-trip.** A conversation turn is stored as an
ordered list of parts — interleaved `text`, `tool-call`, and `tool-result` — not
a flat string. That's what lets the app re-render a turn (including tool calls
and nested sub-agent traces) exactly as it streamed, _and_ feed a correct history
back to the model on the next turn. The two representations differ on purpose:
storage uses `args`/`result` with the call and its result in one message; the
model wants `input`/`output` with results split into a separate `tool` message.
The conversion (`src/lib/ai/messages.ts`) is small but exacting, and it's the
most thoroughly tested code in the repo — including the subtlety that a
`delegate` result stores the **full** sub-agent transcript for the UI but only
replays a **compact** rollup to the model, so the orchestrator's context doesn't
balloon turn over turn.

**2. Live, nested sub-agent streaming over one SSE channel.** When the
orchestrator delegates, each sub-agent runs its own tool loop, and its internal
steps are surfaced to the browser in real time as `agent-*` events keyed by a
`delegationId`. The same engine powers both the orchestrator and the sub-agents;
they differ only in how their stream events are wired. A delegation re-renders
identically whether it's streaming live or loaded from the database.

---

## Architecture

```
Browser (antd, custom SSE client)
   │  POST /api/sessions/:id/messages   ← user turn
   │  ◀───────── text/event-stream of typed `ChatStreamEvent`s
   ▼
Next.js route handler (Node runtime)
   ▼
runMainAgent  ──▶  AI SDK streamText loop (engine.ts)
   │                 ├─ tool: web_search (Tavily)
   │                 ├─ tool: read_pdf  (unpdf)
   │                 └─ tool: delegate ─▶ runSubAgent ─▶ its own streamText loop
   │                                          (web_search / read_pdf)
   ▼
MongoDB (Mongoose) — sessions + messages stored as parts, checkpointed mid-stream
```

- **Model.** OpenAI `gpt-4.1`, resolved through an AI SDK **provider registry**
  (`openai:gpt-4.1`) so adding providers later is trivial.
- **Tools** are AI SDK tools (`inputSchema`/`outputSchema`/`execute`). Runtime
  data (session id, the SSE emitter, recursion depth) is threaded in via
  `experimental_context`.
- **Persistence.** The assistant message is checkpointed to Mongo after every
  tool event, so a refresh mid-research never loses progress.
- **Streaming.** A hand-rolled SSE protocol (one JSON `ChatStreamEvent` per
  `data:` frame). The event union is the contract shared by server and client —
  see `src/lib/types/sse.ts`.

### Tech stack

Next.js 15 (App Router) · TypeScript · Ant Design 5 · Vercel AI SDK 6 ·
OpenAI `gpt-4.1` · MongoDB + Mongoose · Tavily (web search) · unpdf (PDF text) ·
Vitest.

### Project structure

```
src/
  app/
    api/
      sessions/route.ts                 # list / create
      sessions/[id]/route.ts            # get / delete
      sessions/[id]/messages/route.ts   # chat — SSE stream
      agents/route.ts                   # list / create sub-agents
      agents/[id]/route.ts              # update / delete sub-agents
    page.tsx                            # the workspace (client)
  components/                           # antd UI: sidebar, chat, parts, agent manager
  lib/
    ai/
      engine.ts        # the shared streamText turn loop
      main-agent.ts    # orchestrator: history → stream → persist
      sub-agent.ts     # one delegated specialist run
      messages.ts      # parts ⇆ model-message mapping  (heavily tested)
      prompts.ts       # orchestrator prompt + injected sub-agent roster
      registry.ts      # AI SDK provider registry
    tools/             # web-search (Tavily), read-pdf (unpdf), delegate
    db/                # Mongoose connection, models, services
    types/             # the shared contract: parts, sse, api, delegation
scripts/seed.ts        # example sub-agents
```

---

## Running it locally

> Heads up: the app needs a reachable MongoDB and an OpenAI key. Web search also
> needs a Tavily search key (without it, the agent still runs — `web_search`
> just returns a "not configured" notice and the model falls back to its own
> knowledge).

### Prerequisites

- Node 20+ and `pnpm`
- MongoDB running locally — on macOS: `brew install mongodb-community`

### Steps

```bash
# 1. install
pnpm install

# 2. configure
cp .env.example .env
#   then set OPENAI_API_KEY and TAVILY_API_KEY in .env
#   (MONGODB_URI defaults to a local instance)

# 3. start MongoDB (either works)
brew services start mongodb-community
#   or, foreground: mongod --config /opt/homebrew/etc/mongod.conf

# 4. (optional) seed a few example sub-agents
pnpm seed

# 5. run
pnpm dev
#   → http://localhost:3000
```

### Try it

1. Click **Manage agents** and create a sub-agent (or run `pnpm seed` for three
   ready-made ones), e.g. a "Company Profiler" with the `web_search` tool.
2. Start a new chat and ask something that invites delegation, e.g.
   _"Compare Stripe and Adyen — business model, scale, and recent moves."_
3. Watch the orchestrator delegate to your sub-agents and stream their work, then
   synthesize a final answer.

### Tests & checks

```bash
pnpm test        # vitest — parts round-trip, delegation logic, tool fallbacks
pnpm typecheck   # tsc --noEmit
```

The tests target the logic most likely to break silently: the parts ⇆
model-message conversion (every shape, plus the delegate compaction) and the
delegate tool's validation/parallelism/depth-guard behavior.

---

## Deploying

The app is a standard Next.js app and deploys to **Vercel**, with **MongoDB
Atlas** for the database (the local-Mongo default in `.env` is dev-only):

1. Create a free MongoDB Atlas cluster; copy its connection string.
2. Import the repo into Vercel.
3. Set env vars in Vercel: `OPENAI_API_KEY`, `TAVILY_API_KEY`, `MONGODB_URI` (the
   Atlas string).
4. Deploy. Run the seed once against Atlas (`MONGODB_URI=<atlas> pnpm seed`) if
   you want the example sub-agents.

One thing to know: a deep research turn (orchestrator + several sub-agents) can
run for tens of seconds. The chat route sets `maxDuration = 300`, but serverless
platforms clamp this to their plan limit — on a constrained plan, keep tasks
modest or host somewhere without a hard function timeout. Because sub-agents run
in-process, the whole turn completes within a single function invocation.

---

## Notes on what I'd do next

- Persist and surface a **citation index** (dedupe sources across sub-agents,
  number them, render a references list).
- An **eval harness**: a small set of research prompts with rubric-scored
  expectations, run against the agent to catch regressions in answer quality.
- Move sub-agent execution to a **queue** if scale ever demanded it — the depth
  guard and per-delegation ids are already in place for that.
