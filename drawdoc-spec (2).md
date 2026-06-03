# DrawDoc — Real-Time Collaborative Diagram & Document Editor with AI Agent

## Overview

DrawDoc is a full-stack, real-time collaborative editing platform where authenticated users can create workspaces, invite teammates, and edit documents that combine a rich-text editor and an infinite drawing canvas — all synchronized live. The platform includes a built-in AI agent layer powered by LangGraph that can generate diagrams, write and edit document content, answer questions about the workspace, and execute multi-step agentic workflows triggered from inside the editor.

---

## Technology Stack

### Frontend
- **Framework:** React 18, TypeScript, Vite
- **Rich-text editor:** BlockNote — slash commands, headings, code blocks, drag-and-drop blocks
- **Diagram canvas:** Excalidraw — infinite canvas, shapes, arrows, freehand, image embed
- **Collaboration:** Yjs (CRDT), `y-websocket` provider (pin to `y-websocket` stable, Yjs v13 — **do not use `@y/websocket` v4**, which targets the unstable Yjs v14 API), `y-indexeddb` for offline buffering
- **Auth UI:** Clerk or Auth.js — social (Google, GitHub) + email/password
- **State:** Zustand for local UI state; Yjs Y.Doc as source of truth for content
- **Styling:** Tailwind CSS + Radix UI primitives for accessible components
- **AI UI:** Vercel AI SDK `ai@5.x` — pin explicitly to v5 (v6 has major breaking changes across all hooks and provider adapters). Use the `useChat` hook for all streaming interactions. **Note:** `useCompletion` is effectively replaced by `useChat` in v5 — do not use it. v5 introduces a `UIMessage` / `ModelMessage` type split: `UIMessage` is used for rendering in the chat panel, `ModelMessage` is used when sending to the API. Be aware of this distinction when passing message history between the frontend and the agent endpoint.

### Backend
- **Package manager:** `uv` (used for all Python dependency management and virtual environments)
- **API server:** FastAPI (Python 3.12) — REST endpoints + WebSocket upgrade handler
  > LangGraph v1.x requires Python ≥ 3.10; Python 3.12 satisfies this.
- **WS server:** `pycrdt` + `pycrdt-websocket` — Yjs document sync server (separate process/service). Replaces the deprecated `y-py`/`ypy-websocket` libraries. **Import note:** use `from pycrdt.websocket import ...` (dotted path) — not `from pycrdt_websocket import ...` (underscore form), which was renamed in a recent release and will raise an `ImportError`.
- **Agent server:** LangGraph (Python) — stateful multi-step AI agent with tool use, deployed as a FastAPI sub-application
- **LLM:** Groq `llama-3.3-70b-versatile` via LangChain's `ChatGroq` wrapper (primary); Google `gemini-2.5-flash` via `ChatGoogleGenerativeAI` as fallback — both free tier, no credit card required. **Note:** `gemini-2.0-flash` was deprecated and shut down June 1, 2026; use `gemini-2.5-flash` instead.
- **LangChain packages:** `langchain-groq` for Groq LLM, `langchain-google-genai` for Gemini LLM + embeddings. Install via `uv add langchain-groq langchain-google-genai`.
- **Diagram AI:** Groq `llama-3.3-70b-versatile` with structured output (JSON schema enforced via Pydantic + retry) → Excalidraw element format
- **Database:** PostgreSQL 15 + pgvector extension
- **Cache / Queue:** Redis 7 — Yjs snapshots, presence pub-sub, `arq` async job queue for long-running agent tasks (`arq` is a Python-native async Redis job queue; use it instead of BullMQ, which is Node.js only)
- **ORM:** SQLAlchemy 2.0 (async) + Alembic migrations
- **Auth:** JWT access tokens (15 min) + httpOnly refresh cookie (7 days)
- **File storage:** Cloudflare R2 or any S3-compatible bucket

> **Note on Python tooling:** All Python services use `uv` exclusively for dependency management. Use `uv add`, `uv run`, and `uv sync` throughout. Do not use pip, poetry, or conda.

### Infrastructure
- **Containerization:** Docker (multi-stage builds)
- **Orchestration:** Docker Compose — 6 services: frontend, api, ws, agent, postgres, redis

---

## Architecture

### Service Topology

| Service    | Port | Responsibility |
|------------|------|----------------|
| `frontend` | 3000 | React SPA. BlockNote + Excalidraw editor. AI chat panel. Served by Nginx in production. |
| `api`      | 8000 | FastAPI REST server. Auth, workspace/document CRUD, export jobs, agent job dispatch. |
| `ws`       | 1234 | pycrdt WebSocket server. Yjs CRDT sync for document content. Snapshot persistence to Redis. |
| `agent`    | 8001 | LangGraph agent server. Handles all AI workflows. Exposes REST + SSE streaming endpoints. |
| `postgres` | 5432 | PostgreSQL 15 + pgvector. All relational data + vector embeddings for RAG. |
| `redis`    | 6379 | Yjs snapshots, presence pub-sub, `arq` async job queue for long-running agent tasks. |

### Request Flow

**Standard editing:** Browser → HTTPS → `api` (auth/metadata) and Browser → WSS → `ws` (Yjs content sync).

**AI requests:** Browser → HTTPS POST → `api` → enqueues job or proxies → `agent`. The agent streams responses back via Server-Sent Events (interactive chat) or writes results directly into the Yjs document (diagram generation, doc edits), which propagates to all connected clients through the Yjs WebSocket.

### AI Write-back Architecture

When the AI generates or edits content, it does not send it back to the browser for pasting. Instead, the agent server holds a server-side Yjs provider connected to the `ws` server. When a diagram generation job completes, the agent applies the result directly to `Y.Map("excalidraw")`. When a doc edit completes, it applies to `Y.XmlFragment("blocknote")`. All connected clients see the AI's output appear in real time, rendered with a distinct "AI" cursor — exactly like a human collaborator typing.

The browser communicates with two backend entry points simultaneously. REST and auth calls go to the FastAPI service, which in turn queries PostgreSQL and proxies AI requests to the LangGraph agent. Real-time document sync travels over a separate WebSocket connection directly to the Yjs WS server, which reads and writes Yjs snapshots to Redis. The agent service connects outward to the Groq and Gemini LLM APIs, inward to pgvector for RAG search, and back to the Yjs WS server to write AI-generated content directly into documents. The browser receives streaming AI responses via a Server-Sent Events connection to the agent.

---

## Data Models

### Core Entities

| Entity | Fields |
|--------|--------|
| `User` | id, email (unique), display_name, avatar_url, created_at, provider |
| `Workspace` | id, name, slug (unique), owner_id → User, created_at |
| `WorkspaceMember` | workspace_id, user_id, role (owner/editor/viewer), joined_at |
| `Document` | id, workspace_id, title, created_by → User, view_mode, is_public, updated_at |
| `DocSnapshot` | doc_id, yjs_state (bytea), version, saved_at |
| `Invite` | id, workspace_id, invitee_email, token, role, expires_at, accepted_at |

### AI-Specific Entities

| Entity | Fields |
|--------|--------|
| `AgentThread` | id, doc_id → Document, workspace_id, created_by → User, thread_id (LangGraph), message_count, last_summarized_at, created_at |
| `AgentMessage` | id, thread_id → AgentThread, role (user / assistant / tool / **summary**), content, tool_name, tool_input (jsonb), tool_output (jsonb), token_count, is_compressed, created_at |
| `AgentJob` | id, thread_id, type, status (queued/running/done/failed), input (jsonb), output (jsonb), error, created_at, completed_at |
| `DocEmbedding` | id, doc_id → Document, chunk_index, chunk_text, embedding (vector(768)), model, created_at |

> **Embedding dimension note:** `gemini-embedding-001` outputs 3072 dimensions by default, but supports Matryoshka truncation. Pass `output_dimensionality=768` when calling the API to keep the schema at `vector(768)` and avoid a costly re-embedding migration. This is a Google-recommended configuration.

**`AgentMessage` role values:**
- `user` — message typed by the human
- `assistant` — streamed response from the LLM
- `tool` — tool call + result pair
- `summary` — auto-generated compression of older messages; always injected at the top of the context window ahead of the live message window. At most one active summary per thread at any time (older summaries are superseded and marked `is_compressed = true`).

---

## 1. Landing Page

The landing page is the product's first impression. It must feel premium, modern, and interactive — something that immediately communicates what DrawDoc does through demonstration rather than description.

### 1.1 Hero Section

- **Headline:** Short and punchy. E.g. _"Diagrams and docs. Together. Live."_
- **Subheadline:** One sentence on the core value prop.
- **Animated split-pane demo:** A looping animation showing text on the left and a diagram appearing on the right, as if an AI is drawing it in real time. Use CSS keyframe animations or a short embedded GIF.
- **CTA buttons:** "Start for free" (primary) and "See it live" (scrolls to live demo section).
- **No login required** for the hero — it should feel immediately inviting.

### 1.2 Live Public Demo (No Login Required)

This is a key differentiator. Embed a **fully functional, anonymous read/write sandbox** on the landing page so visitors can try DrawDoc without creating an account.

**Implementation:**
- Provision a special `demo` workspace and a single shared demo document with a fixed ID.
- Anonymous users are assigned a random guest identity (random name + color) on load.
- The embedded demo shows the split-pane editor (BlockNote + Excalidraw) in a constrained viewport (~900×600 px), styled as a "live preview" card with a subtle browser-chrome mockup around it.
- **AI panel is disabled** for demo/anonymous users. The demo showcases the real-time collaborative editor and canvas — a sign-up CTA replaces the AI input: _"Sign up free to unlock AI diagram generation."_ Clicking it opens the sign-up page. This keeps the demo safe from rate-limit exhaustion without degrading the core collaboration experience.
- Demo document is pre-seeded with interesting content: a short paragraph and a pre-generated architecture diagram.
- A "Reset demo" button restores the document to its seeded state (calls a debounced server endpoint).
- Show a live collaborator count badge: _"X people editing right now"_.

### 1.3 Feature Highlights

Three-column card grid with animated icons (CSS, not image-based):

1. **AI Diagram Generation** — Describe a diagram in plain English. Watch it appear on the canvas.
2. **Real-Time Collaboration** — See teammates' cursors and edits live. Zero lag.
3. **Docs + Diagrams, Together** — Rich text and infinite canvas in one document, always in sync.

### 1.4 How It Works

A three-step illustrated walkthrough:
1. Type a prompt in the AI panel
2. The AI plans and generates your diagram
3. It appears on the canvas — edit it like any other drawing

Each step has a short animated illustration (SVG or CSS-animated).

### 1.5 Testimonials

Six testimonials in a two-row grid. Each card includes: avatar (illustrated, not photo), full name, job title, company, and a specific quote about a concrete use case (e.g. system design reviews, onboarding docs, sprint planning).

Seed realistic content — don't use placeholder names.

### 1.6 Open & Free

A simple single-column card listing everything that is free, with no asterisks:

- Unlimited workspaces
- Unlimited documents
- Unlimited members per workspace
- Full AI features — diagram generation, doc editing, Q&A
- All export formats — PNG, PDF, Markdown
- Real-time collaboration
- **Always free. No credit card required.**

CTA button: "Start for free" linking to sign-up.

### 1.7 Footer

- Logo + tagline
- Links: Features, Pricing, Docs, GitHub, Status
- Social icons (Twitter/X, GitHub)
- Copyright line

---

## 2. Authentication

### 2.1 Sign-Up Page (`/signup`)

**Design:** Full-page layout, dark background, centered card. Left side (desktop): animated brand visual or a looping demo clip. Right side: the form.

**Fields:**
- Display name
- Email address
- Password (with strength indicator — 4-level bar)
- "I agree to the Terms of Service and Privacy Policy" checkbox

**OAuth buttons** (above the form, separated by an "or" divider):
- Continue with Google
- Continue with GitHub

**Validation (inline, not on submit):**
- Email: format check on blur
- Password: minimum 8 characters, must contain a number; strength indicator updates on keypress
- Name: 2–50 characters

**Post sign-up:** Redirect to workspace dashboard. Show a one-time welcome modal: _"Welcome to DrawDoc — here's what you can do."_ with 3 quick-start tips and a "Create your first document" CTA.

### 2.2 Sign-In Page (`/login`)

**Design:** Same layout as sign-up. Consistent visual language.

**Fields:**
- Email address
- Password (with show/hide toggle)
- "Remember me" checkbox

**OAuth buttons:** Same as sign-up.

**Error handling:**
- Wrong password: _"Incorrect password. Forgot it?"_ — "Forgot it?" links to password reset.
- Email not found: _"No account found with this email. Want to sign up?"_
- Too many attempts: show a 60-second cooldown timer.

**Forgot password flow:**
- `/forgot-password` — enter email, receive reset link
- `/reset-password?token=...` — enter new password (with confirmation + strength indicator)
- Success: redirect to login with a success toast

### 2.3 OAuth Callback

After OAuth, if it's the user's first login: show a brief "Complete your profile" step to confirm their display name before landing on the dashboard.

If the OAuth email matches an existing email/password account, merge them silently and log in to the existing account.

### 2.4 Protected Routes

All routes under `/dashboard`, `/workspace/*`, and `/doc/*` require authentication. Unauthenticated users are redirected to `/login?next=<original_path>`. After login, they are redirected back.

---

## 3. Dashboard

- Workspace list with member count, document count, last activity timestamp.
- Quick-create buttons: "New workspace", "New document".
- Recent documents section: last 5 opened, with document title, workspace name, and time ago.

---

## 4. Workspace View

- Sidebar: document list with search and sort.
- Settings panel: rename workspace, manage members, generate invite link.
- Member presence: avatar stack showing online members.

---

## 5. Document Editor

### Text Pane (BlockNote)
Slash commands, floating toolbar, remote cursors, drag-and-drop blocks, image upload.

### Diagram Pane (Excalidraw)
Full toolbar, remote pointers, fit-to-screen, PNG export, theme sync with app.

### View Modes
Split (default), text-only, diagram-only. Persisted per document.

### AI Panel
A collapsible right-side panel triggered by the AI button in the top bar or `Cmd/Ctrl+K`.

- **Persistent chat history:** When the panel opens, it calls `GET /agent/threads/{doc_id}` to get or create the thread, then loads the message history via `GET /agent/threads/{thread_id}/messages`. Previous messages (from this session or prior sessions) are rendered above the input box immediately — the conversation persists across page reloads, tab closes, and days.
- **Infinite scroll:** A "Load earlier messages" button at the top of the chat fetches older pages using `?before=message_id`. Loading skeleton shown while fetching.
- **Session continuity indicator:** A subtle timestamp divider between message groups (e.g. _"Yesterday"_, _"3 days ago"_) so users know when a previous session's messages begin.
- **Progressive diagram rendering:** When a diagram is being generated, elements appear on the canvas one by one as the LLM produces them. The AI panel shows a live progress indicator: _"Drawing… 6 of ~18 elements"_. Once all elements are placed, a final layout snap occurs and the progress indicator resolves to a tool call card.
- Inline tool call cards: each completed assistant action shows a summary (e.g. _"Generated diagram — 18 elements added to canvas"_) with a miniature canvas preview.
- **Prompt library:** Pre-built templates the user can click to fill the input:
  - "Draw a system architecture for this document"
  - "Summarize this document"
  - "Add a sequence diagram for the login flow"
  - "Turn this bullet list into a flowchart"
- **AI cursor:** When the AI is writing to the canvas or text pane, a distinct purple cursor labeled _"AI Assistant"_ appears for all connected users.
- **Stop button:** Cancels the SSE stream and halts the LangGraph execution.
- **Clear history button:** A trash icon in the panel header calls `DELETE /agent/threads/{thread_id}` with a confirmation prompt. Resets the conversation to a blank state.
- **Typing indicator:** Three animated dots while the agent is running.
- Streaming text renders incrementally — characters appear as received from Groq with no buffering.
- Diagram elements render progressively on the canvas as they are generated — the canvas comes alive during generation rather than showing a sudden jump.
- Tool call cards are expandable: click to see raw tool input/output JSON.

### Collaboration UI
- **Avatar stack** in the top bar: colored ring per user, overflow badge for 5+ users, tooltip on hover showing full name + role, click to follow that user's viewport. AI Assistant appears as a purple sparkle avatar only while writing.
- **Connection status badge:** green dot = connected, yellow = reconnecting, red = offline (edits buffered locally).
- **Share button:** copies a public read-only link to clipboard with a toast confirmation.
- **Follow mode:** clicking a collaborator's avatar enters follow mode — both panes scroll/pan to keep that user's cursor centered. Press `Escape` or click elsewhere to exit follow mode.
- Keyboard shortcuts: `Cmd/Ctrl+\` toggle sidebar, `Cmd/Ctrl+Shift+D` cycle view mode, `Cmd/Ctrl+K` toggle AI panel, `Cmd/Ctrl+S` force snapshot save, `Escape` cancel running AI job or exit follow mode.

---

## 6. API Specification

### Authentication — `/auth`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account. Body: email, password, display_name. Returns JWT + refresh cookie. |
| POST | `/auth/login` | Email/password login. Returns access token + httpOnly refresh cookie. |
| POST | `/auth/refresh` | Exchange refresh cookie for new access token. Rotates refresh token. |
| GET | `/auth/me` | Return current user profile. |
| POST | `/auth/logout` | Invalidate refresh token, clear cookie. |
| GET | `/auth/oauth/{provider}` | Initiate OAuth flow. Callback at `/auth/oauth/{provider}/callback`. |

### Workspaces — `/workspaces`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/workspaces` | Create workspace. Creator auto-assigned owner. |
| GET | `/workspaces` | List all workspaces the user belongs to. |
| GET | `/workspaces/{slug}` | Get workspace detail, member list, document list. |
| PUT | `/workspaces/{slug}` | Update name or slug. Owner only. |
| DELETE | `/workspaces/{slug}` | Delete workspace and all documents. Owner only. |
| POST | `/workspaces/{slug}/invite` | Send invite. Body: email, role. |
| POST | `/workspaces/accept-invite` | Redeem invite token. |
| DELETE | `/workspaces/{slug}/members/{user_id}` | Remove member or leave. |
| PATCH | `/workspaces/{slug}/members/{user_id}` | Change member role. Owner only. |

### Documents — `/workspaces/{slug}/docs`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/workspaces/{slug}/docs` | Create blank document. |
| GET | `/workspaces/{slug}/docs` | List documents. Supports `?q=` and `?sort=updated_at`. |
| GET | `/workspaces/{slug}/docs/{doc_id}` | Get metadata + last Yjs snapshot. |
| PATCH | `/workspaces/{slug}/docs/{doc_id}` | Update title or view_mode. |
| DELETE | `/workspaces/{slug}/docs/{doc_id}` | Delete document, snapshots, and assets. |
| POST | `/workspaces/{slug}/docs/{doc_id}/export` | Async export. Body: format (png/pdf/md). Returns signed URL. |
| WS | `/ws/{doc_id}?token={jwt}` | WebSocket for Yjs sync and awareness. |

### AI Agent — `/agent`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/agent/chat` | Primary AI endpoint. Body: doc_id, message, thread_id. Returns SSE stream with text deltas, tool_start, tool_end, and done events. |
| GET | `/agent/threads/{doc_id}` | Get or create AgentThread. Returns thread metadata. Creates the thread if it does not exist yet. |
| GET | `/agent/threads/{thread_id}/messages` | Paginated message history, newest-first. `?before=message_id` for infinite scroll (load earlier). Returns up to 30 messages per page. Includes `summary` role messages so the client can render a "conversation was summarized" indicator. |
| POST | `/agent/jobs` | Enqueue background agent job. Returns job_id. |
| GET | `/agent/jobs/{job_id}` | Poll job status. |
| DELETE | `/agent/threads/{thread_id}` | Clear full conversation history for a document thread. Deletes all AgentMessages and resets LangGraph checkpoint state. Requires confirmation from caller. |
| POST | `/agent/threads/{thread_id}/summarize` | Manually trigger history summarization for a thread. Normally runs automatically; this endpoint is for admin/debug use. |
| POST | `/agent/embed/{doc_id}` | Trigger re-embedding of document content into pgvector. |

### Users & Assets

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/me` | Return authenticated user profile. |
| PATCH | `/users/me` | Update display_name or avatar_url. |
| POST | `/assets/presign` | Request pre-signed S3 upload URL. |

---

## 7. AI Agent Architecture

### Framework: LangGraph (v1.x)

Use LangGraph v1.x as the agent orchestration framework. It models the agent as a stateful graph where each node is a Python function and edges are conditional transitions. The agent graph persists full state in PostgreSQL using LangGraph's `PostgresSaver` checkpointer from the `langgraph-checkpoint-postgres` package (install via `uv add langgraph-checkpoint-postgres`). This uses **psycopg (Psycopg 3)** directly — it is entirely separate from the app's SQLAlchemy ORM layer; do not confuse them. Call `await checkpointer.setup()` once on startup to create the required tables. Each `AgentThread` maps 1:1 to a LangGraph `thread_id`.

> **LangGraph v1 notes:** `langgraph.prebuilt.create_react_agent` is deprecated since v1.0 — use `from langchain.agents import create_react_agent` instead. LangGraph v1.0+ requires Python 3.10 or higher (3.9 reached EOL October 2025). The custom `StateGraph`-based graph described in this spec (not `create_react_agent`) is unaffected by the prebuilt deprecation.

### Memory Architecture

Agent memory is managed across three complementary layers:

**Layer 1 — Conversation history (short-term, per-document)**

Every message exchanged in a document's AI panel is persisted to the `AgentMessage` table in PostgreSQL. This is the full record: user messages, assistant responses, tool calls, and tool results.

When a user sends a new message, the agent loads the context window using a **token-budget loader** rather than a fixed message count:

The palette contains 12 perceptually distinct colors that work on both dark and light backgrounds: violet, blue, emerald, amber, red, pink, cyan, lime, purple, orange, sky, and green. A user's color is derived by computing a simple numeric hash of their user ID and taking the result modulo 12 to select a palette index. This is deterministic — the same user ID always produces the same color on every device and session. Violet is reserved for the AI Assistant and must never be assigned to a human user; if the hash for a given user ID resolves to violet, the implementation shifts to the next index.

The token budget means the context window stays predictable regardless of message length. Tool outputs with large JSON blobs won't silently blow the context.

**Layer 2 — Rolling summarization (automatic compression)**

Every time a thread reaches 20 non-compressed messages, a background job runs automatically (enqueued via the `arq` job queue backed by Redis — `arq` is the Python-native async Redis queue used throughout this project) that:

1. Takes the oldest 10 messages in the thread
2. Calls Groq `llama-3.1-8b-instant` with a summarization prompt asking for a compact third-person summary of what was discussed, what diagrams were generated, and what edits were made. This model is free on Groq and fast enough that summarization adds < 1 s of latency to the background job
3. Stores the result as a new `AgentMessage` with `role = "summary"` and `is_compressed = false`
4. Marks the 10 source messages as `is_compressed = true` so they are excluded from future context loads but remain in the database for audit/history display

This keeps the live context window lean while ensuring no information is permanently lost. The UI renders a summary message with a distinct visual style (collapsed card: _"Earlier conversation summarized — click to expand"_).

The summarization prompt:

The summarization prompt instructs the LLM to act as a neutral third-party summarizer for a document editing session. It is given the document title and workspace name as context, then asked to produce a 3–5 sentence summary covering: what the user was trying to accomplish, which diagrams were generated and of what type, what document edits were made, and any decisions or context the AI should remember in future turns. The prompt requires concrete, specific output and prohibits filler phrases.

**Layer 3 — Workspace semantic memory (RAG via pgvector)**

The `DocEmbedding` table stores chunked text embeddings for every document in the workspace. When the agent handles a `question` intent, the `retrieve_context` node embeds the user's question and retrieves the top-5 most semantically similar chunks across all documents the user has access to. This allows the agent to answer questions about content in documents it has never read in the current conversation.

Embeddings are generated using Google's `gemini-embedding-001` model (free via Google AI Studio). **Note:** `text-embedding-004` was deprecated January 14, 2026 — `gemini-embedding-001` is the direct replacement. Request 768 output dimensions explicitly via `output_dimensionality=768` to keep the pgvector schema at `vector(768)` unchanged. In LangChain this is `GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", task_type="retrieval_document")` — pass the `output_dimensionality` parameter at call time.

**Memory flow summary:**

When a user sends a message, the system first attempts to load the context window from Redis. On a cache hit, the assembled window is returned immediately. On a cache miss, the token-budget loader queries PostgreSQL, assembles the window, and writes it to Redis before returning. The `AgentState` is then initialized with the assembled messages plus the current document context. LangGraph executes the graph, checkpointing the state to PostgreSQL after every node. Each node writes its output into the state: `route_intent` sets the intent and entities, `plan_diagram` sets the diagram plan, `generate_elements` populates diagram elements and streams them to the canvas, `retrieve_context` populates the RAG chunks, and the final node in each branch sets the response. Once complete, the response is saved to `AgentMessage`, the Redis context cache for that thread is invalidated, and if the thread has reached 20 non-compressed messages a summarization job is enqueued.

**Layer 4 — LangGraph execution state (per-turn working memory)**

Each turn of the graph operates on a typed `AgentState` object. This is the agent's scratchpad for a single message → response cycle. It is initialized at the start of every graph run, populated by each node as execution progresses, and persisted to PostgreSQL via LangGraph's `AsyncPostgresSaver` (from `langgraph-checkpoint-postgres`) after every node completes. If the server crashes mid-run, LangGraph resumes from the last checkpoint using the saved state.

Each client broadcasts an awareness object with three sections. The `user` section carries the user's ID, display name, assigned presence color, and avatar URL. The `excalidraw` section carries the current pointer coordinates on the canvas and a list of currently selected element IDs. The `blocknote` section carries the ID of the block the user's caret is in and whether the state is a caret position or a text selection. This object is broadcast to all other connected clients on every state change and is never persisted anywhere — it exists only in memory on the WS server and in each connected browser.

**Lifetime of `AgentState`:**

When a request arrives, an `AgentState` is created with `messages` loaded from the context window loader, `doc_id` and related fields from the request body, and all other fields set to `None`. As each node in the graph executes, it reads from the state, does its work, and writes its output back. LangGraph automatically checkpoints the full state to PostgreSQL after each node, so a mid-run server crash can be resumed exactly where it stopped. Once the graph reaches its end node and the response is saved to `AgentMessage`, the state object is discarded from memory entirely.

The state is **never stored in Redis** — it lives only in memory during execution and in PostgreSQL as a checkpoint. This keeps the architecture simple and the state durable.

**Layer 5 — Redis message cache (hot path optimization)**

By default, `load_context_window()` queries PostgreSQL on every single request. For a small user base this is fine. As concurrent users grow, these repeated reads on the same thread become a bottleneck.

The fix is a Redis cache for the assembled context window per thread:

The context window loader implements a read-through cache using Redis. Each thread's assembled context window is cached under a key namespaced by thread ID with a time-to-live of 5 minutes. On every call the loader checks Redis first and returns the cached value immediately if present. On a cache miss it runs the full PostgreSQL token-budget query, assembles the window, and writes it to Redis before returning. A companion cache invalidation function deletes the cached entry for a given thread. This function is called in exactly two places: after every agent response is saved to `AgentMessage`, and after every summarization job completes. The 5-minute TTL acts as a safety net for threads that go idle without an explicit invalidation.

`invalidate_context_cache(thread_id)` is called in two places:
1. After every agent response is saved to `AgentMessage` — so the next turn always loads fresh history
2. After a summarization job completes — so the new summary is immediately reflected

This pattern is **read-through cache with write invalidation**. The cache holds the assembled window for up to 5 minutes of idle time. Active conversations (user typing rapidly) will mostly hit PostgreSQL since each response invalidates the cache — but this is exactly right because active conversations need fresh data. The cache benefits **reopened sessions** most: a user who opens a document, reads the existing AI chat, then starts typing will get the context window from Redis on the first request rather than a cold PostgreSQL query.

**Complete memory layer summary:**

| Layer | What it stores | Backend | Lifetime |
|---|---|---|---|
| `AgentState` | Current turn working memory — intent, plan, elements, chunks | LangGraph checkpoint → PostgreSQL | One graph execution |
| `AgentMessage` table | Full conversation log — every message ever | PostgreSQL | Forever (until thread deleted) |
| Token-budget loader | Assembled context window — summary + recent messages | In-memory during assembly | Discarded after caching |
| Redis context cache | Assembled context window, ready to serve | Redis (TTL 5 min) | Evicted on write or idle timeout |
| Rolling summary | Compressed old messages | PostgreSQL (`role="summary"`) | Until superseded by newer summary |
| pgvector RAG | Workspace document embeddings | PostgreSQL (pgvector) | Until document deleted |

**Resource cost at free-tier scale:**

| Resource | Usage | Free tier headroom |
|---|---|---|
| PostgreSQL rows | ~100 bytes/message avg | Negligible vs 1 GB limit |
| LangGraph checkpoints | ~1–2 KB per node checkpoint | Negligible |
| Redis context cache | ~8 KB per active thread (8,000 tokens of JSON) | Negligible vs Upstash 256 MB free |
| Summarization LLM calls | 1 Groq `llama-3.1-8b-instant` call per 20 messages | **$0** — Groq free tier |
| Token cost per request | 8,000 tokens history max | **$0** — Groq free tier (14,400 req/day) |
| Embeddings | 1 `gemini-embedding-001` call per doc save | **$0** — Google AI Studio free tier |
| Redis job queue | 1 job per 20 messages | Negligible — uses `arq` (Python-native async Redis queue) |

The entire AI stack costs **$0** at demo/small production scale. Groq free tier covers 14,400 requests/day for generation; Google AI Studio free tier covers embeddings. Upgrade paths exist for both if traffic grows.

### Agent Graph

Every message enters the graph at the `route_intent` node. Based on the classified intent, the graph takes one of four branches. A `diagram_request` flows through `plan_diagram` → `generate_elements` → `write_to_canvas`. A `doc_edit` flows through `read_document` → `plan_edit` → `apply_edit`. A `question` flows through `retrieve_context` → `generate_answer`. A `general` message flows directly to `chat_response`. All four branches terminate at the graph's end node.

Each node streams partial output back to the client via SSE before the next node begins. The user sees progress indicators: _"Planning diagram…"_ → _"Generating elements…"_ → _"Writing to canvas…"_

### Agent Nodes

**`route_intent`**
Uses Groq `llama-3.1-8b-instant` (small, fast, free) to classify the user message into `diagram_request`, `doc_edit`, `question`, or `general`. Extracts relevant entities (e.g. diagram type, subject). This is the cheapest node in the graph — routing requires minimal reasoning.

**`plan_diagram`**
Calls Groq `llama-3.3-70b-versatile` to produce a structured plan: nodes, edges, layout direction (LR/TB), color scheme, diagram type. Output is validated against a Pydantic model. Retries up to 3 times on validation failure, appending the validation error to the prompt on each retry. If Groq rate-limits (429), automatically retries via the Gemini `gemini-2.5-flash` fallback — the same fallback used by `generate_elements`. Because `plan_diagram` and `generate_elements` run sequentially in the same 60-second window they share the per-minute token budget; always apply the fallback at both nodes, not just one.

**`generate_elements`**
Calls Groq `llama-3.3-70b-versatile` with the plan and streams the Excalidraw element list as JSON. Uses **incremental JSON parsing** (`jsonriver` library — a Python port of a Google TypeScript library specifically designed to parse JSON incrementally from a token-by-token LLM stream, yielding increasingly complete values as tokens arrive; use this instead of `ijson`, which is designed for streaming large JSON files and not suitable for LLM token output) to parse complete element objects out of the token stream as they arrive. Each parsed element is written to the Yjs canvas immediately via a small `write_to_canvas` transaction — so elements appear on the canvas progressively as the LLM generates them, rather than all at once at the end. Invalid elements are filtered or repaired before writing. If Groq rate-limits (429), automatically retries via the Gemini `gemini-2.5-flash` fallback.

The SSE stream to the client emits a `diagram_progress` event after each batch of elements is written: `{ type: "diagram_progress", elements_written: N, total_estimated: M }`. The AI panel renders this as a live progress indicator: _"Drawing… 6 of ~18 elements"_.

**Rate-limit transparency.** When either `plan_diagram` or `generate_elements` hits a Groq 429 and switches to Gemini, the agent emits a `rate_limit_warning` SSE event before retrying: `{ type: "rate_limit_warning", message: "Groq is busy — switching to fallback model. If this keeps happening, wait a minute before generating another diagram." }`. The AI panel renders this as an inline amber notice below the progress indicator. If both Groq and Gemini return 429, the agent emits `{ type: "rate_limit_error", message: "Both AI providers are rate-limited right now. Please wait a minute and try again." }` and fails the job cleanly instead of silently erroring.

**`write_to_canvas`**
Called incrementally by `generate_elements` as each element is parsed from the stream. The agent service maintains a persistent pycrdt connection to the Yjs WS server. Each batch of parsed elements is applied to `Y.Map("excalidraw")` inside a `Y.Transaction` — connected browser clients see elements appear on the canvas in real time as the LLM generates them. After all elements are written, a final layout pass (`elkjs`) repositions nodes for clean alignment, then a last transaction writes the final coordinates. Returns a summary (element count, bounding box).

**`read_document`**
Reads the current document content from the Yjs snapshot in Redis. Converts Yjs XML to plain text and extracts structure (headings, paragraphs, code blocks).

**`plan_edit`**
Calls Groq `llama-3.3-70b-versatile` to produce a structured edit plan: list of operations (`insert_after`, `replace`, `delete`, `append`) each with target block reference and new content. Validated against a Pydantic model.

**`apply_edit`**
Applies the edit plan to the Yjs document via pycrdt. Each operation (`insert_after`, `replace`, `delete`, `append`) is applied as its own Yjs transaction immediately as it is processed — users see edits appear block by block in real time rather than all at once. The AI cursor moves through the document visibly as each block is written.

**`retrieve_context`**
Embeds the user's question using Google's `gemini-embedding-001` (with `output_dimensionality=768`). Queries pgvector for top-5 most similar chunks across all accessible workspace documents using cosine similarity. Returns chunks with source document title and chunk position.

**`generate_answer`**
Calls Groq `llama-3.3-70b-versatile` with retrieved context chunks. Produces a streaming answer with inline citations linking to source documents.

**`chat_response`**
Standard conversational response. Receives the assembled context window from `load_context_window()` (active summary + recent messages within token budget) plus the current document content. Streams response tokens directly via SSE — characters appear in the AI panel as they are received from Groq, with no buffering. Groq's inference speed makes this feel near-instant.

### Tools Available to the Agent

| Tool | Description |
|------|-------------|
| `get_document_content` | Read current text and diagram content of any accessible document |
| `list_workspace_documents` | List all workspace documents with titles and last-updated timestamps |
| `create_document` | Create a new document in the workspace |
| `update_diagram` | Replace or merge Excalidraw elements on the canvas |
| `update_document_text` | Insert, replace, or append blocks in BlockNote |
| `search_workspace` | Semantic search over workspace documents via pgvector RAG |
| `generate_mermaid` | Generate Mermaid string then convert to Excalidraw elements via deterministic layout. **Pin `@excalidraw/mermaid-to-excalidraw` to `>=2.2.2`** — versions below this are vulnerable to a Mermaid XSS injection (CVE-2025-54881). |
| `export_diagram` | Export canvas as PNG and return a signed URL |
| `web_search` | Search the web for up-to-date technical information (optional) |

### Diagram Generation Quality

The following techniques are required:

1. **Structured output with schema enforcement.** Always pass the full Excalidraw element JSON schema in the system prompt. Use Groq's structured output mode (pass a JSON schema to the `response_format` parameter) rather than asking for JSON in plain text. Fall back to strict Pydantic validation + retry if the model ignores the schema.

2. **Few-shot examples.** Include 3–5 hardcoded (prompt → Excalidraw JSON) example pairs in the system prompt. Cover flowchart, sequence, ER, and architecture diagram types.

3. **Two-stage generation.** Never ask the LLM to produce Excalidraw JSON directly from a user prompt. First generate a human-readable plan (nodes, edges, layout), validate it, then generate JSON from the plan.

4. **Mermaid as intermediate representation.** For flowchart, sequence, ER, and class diagrams, have the LLM generate a Mermaid string first. Parse the Mermaid AST and deterministically convert to Excalidraw elements with a layout algorithm (`elkjs`). Produces correct node spacing that LLM-generated coordinates alone cannot achieve.

5. **Auto-layout post-processing.** After the LLM generates elements, run them through `elkjs`. The LLM only needs to describe the graph topology, not pixel coordinates.

6. **Iterative refinement tool.** `refine_diagram` takes the current canvas elements plus a user instruction and produces a diff of changed elements only — avoids regenerating the entire diagram for small changes.

7. **Semantic color assignment.** Maintain a hardcoded type-to-color mapping and apply it as a post-processing step:
   - Databases → blue (`#E6F1FB` stroke)
   - Services → purple (`#EEEDFE` stroke)
   - Clients → teal (`#E1F5EE` stroke)
   - Queues → amber (`#FAEEDA` stroke)
   - External systems → gray

8. **Diagram type detection.** Classify into: flowchart, sequence, ER, class, architecture, mind-map, timeline, or freeform. Each type has its own system prompt, few-shot examples, Mermaid conversion path, and layout algorithm.

---

## 8. Real-Time Collaboration

### 8.1 CRDT Layer

- Yjs is the CRDT layer. Each document maps to one `Y.Doc` on the WS server.
- BlockNote binds to `doc.getXmlFragment("blocknote")` via `CollaborationExtension`.
- Excalidraw binds to `doc.getMap("excalidraw")` via a thin sync adapter.
- WS server persists Yjs snapshots to Redis every 30 seconds and on every disconnect.
- Offline edits buffered via y-indexeddb, merged on reconnect.
- Target round-trip sync latency: < 80 ms for same-region users.

### 8.2 Presence & Awareness

Yjs has a built-in **awareness protocol** that runs alongside the CRDT sync on the same WebSocket connection. It is a separate lightweight channel for ephemeral, non-persistent state — cursor positions, selections, user identity, and color. When a user disconnects, their awareness entry is automatically removed and their cursor disappears from all other clients immediately.

**Awareness state shape** — each connected client broadcasts this object:

`AgentState` is a typed dictionary that serves as the agent's scratchpad for one message-to-response cycle. It carries the following fields:

- **messages** — the assembled context window for this turn, using LangGraph's `add_messages` reducer
- **doc_id, doc_title, workspace_id, user_id** — document and user context injected at graph initialization
- **intent** — the classified intent set by `route_intent`, one of `diagram_request`, `doc_edit`, `question`, or `general`
- **entities** — extracted entities from the user message such as diagram type and subject, set by `route_intent`
- **diagram_plan** — the structured diagram plan produced by `plan_diagram`, consumed by `generate_elements`
- **diagram_elements** — the list of Excalidraw element objects produced by `generate_elements`, consumed by `write_to_canvas`
- **elements_written** — a running counter incremented as elements are streamed to the canvas, used for SSE progress events
- **document_content** — the plain-text document content read by `read_document`, passed to `plan_edit`
- **edit_plan** — the list of edit operations produced by `plan_edit`, consumed by `apply_edit`
- **retrieved_chunks** — the RAG results fetched by `retrieve_context`, passed to `generate_answer`
- **response** — the final text response populated by the last node in whichever branch ran, saved to `AgentMessage` on completion
- **tool_summary** — a short human-readable description of what the AI did, used to populate the tool call card in the UI

**Color assignment** — each user is assigned a stable color derived deterministically from their `user_id` so the same person always gets the same color across sessions and devices. Use a hardcoded palette of 12 perceptually distinct colors that all work on both dark and light backgrounds:

The context window loader queries the `AgentMessage` table for all non-compressed messages belonging to the thread, ordered newest-first. It accumulates messages one by one, counting tokens using a model-agnostic tokenizer (with an 8,000-token budget), and stops when the budget is reached. The resulting window is reversed back to chronological order. If an active summary message exists for the thread, it is always prepended regardless of token count, giving the LLM compressed context of older history before the recent live messages.

This means user "Aryan" is always violet, user "Priya" is always blue — consistent across all documents and sessions, never randomly reassigned on reconnect.

**What each pane renders:**

_Excalidraw canvas:_
- A colored pointer (small arrow or dot) at each remote user's mouse position, labeled with their first name, moving in real time as they move their mouse
- Highlighted selected elements — when a remote user selects elements, those elements show a colored bounding box outline in their color
- The pointer disappears after 3 seconds of no mouse movement (user is idle or focused elsewhere)

_BlockNote text pane:_
- A colored blinking caret at each remote user's cursor position inside the text
- A colored highlight over any text they have selected
- A small floating name tag above the caret showing the user's first name
- The caret fades out after 5 seconds of no typing activity

**Avatar stack in the top bar:**
- Shows a row of circular avatar images (or initials fallback) for every user currently connected to the document
- Each avatar has a colored ring in the user's presence color
- Hovering an avatar shows a tooltip: full name + "editing" or "viewing"
- Clicking an avatar pans/scrolls both panes to that user's current position (follow mode)
- If more than 5 users are connected, shows the first 4 avatars + a "+N more" overflow badge
- The AI Assistant appears in the avatar stack as a purple avatar with a sparkle icon, only while actively writing

**Guest/anonymous users** (public share links):
- Assigned a random name from a fun wordlist (e.g. "Teal Sparrow", "Amber Fox") and a random color from the palette on join
- Their awareness works identically to authenticated users
- Name is stored in sessionStorage so it persists across page refreshes within the same tab

**AI Assistant awareness:**
- The agent service holds a persistent server-side pycrdt provider connected to the WS server
- When the AI is actively writing to the canvas or text pane, it sets its awareness state with `name: "AI Assistant"` and `color: "#7C3AED"` (reserved violet — never assigned to human users)
- The AI pointer moves across the canvas as it writes elements, and the BlockNote caret advances through the document as it applies edits
- When the AI job completes or is cancelled, its awareness state is cleared immediately

---

## 9. Business Logic

- Workspace slugs: globally unique, URL-safe, 3–40 characters.
- User emails: unique. OAuth and email accounts with the same email are merged.
- Only owners can delete workspaces, promote to owner, or transfer ownership.
- Editors can create, rename, and delete documents. Viewers get read-only Yjs connections.
- All features — including AI — are available to every user at no cost. There are no tiers, no locked features, and no upgrade prompts.
- Public share links grant anonymous read-only access.
- Invite tokens expire after 48 hours and are single-use.
- All AI requests are logged to `AgentMessage` for audit and debugging.
- Summarization jobs are enqueued automatically when a thread reaches 20 non-compressed messages. The oldest 10 messages are compressed into one `summary` role message and marked `is_compressed = true`. Compressed messages remain in the database for audit and history display but are excluded from the active context window.
- The agent context window is loaded by token budget (8,000 tokens), not a fixed message count. This prevents large tool outputs from silently overflowing the LLM context.
- Agent jobs exceeding 60 seconds are automatically cancelled and marked failed with a timeout error.
- Yjs snapshots older than 30 days are pruned by a nightly job.
- `DocEmbeddings` re-generated automatically on document save (debounced 10 s). Embeddings for deleted documents are purged immediately.
- All API errors: `{ "error": "...", "code": "...", "details": {} }`. Standard HTTP codes.
- All request data validated via Pydantic. 422 with field-level detail on schema failure.

---

## 10. UI / UX Requirements

- **Dark mode by default.** Light mode toggle persisted to localStorage. BlockNote, Excalidraw, and AI panel all respect the active theme.
- **Responsive:** desktop (1280px+) and mobile (375px+). On mobile, AI panel opens as a bottom sheet.
- Draggable split-pane divider, min width 200px, position persisted per document.
- Optimistic UI on title edits: debounce PATCH 600ms, rollback with toast on failure.
- Toast notifications: save status, invite sent, member added/removed, export ready, plan limit reached, AI job completed/failed.
- Loading skeletons for document list and editor load.
- Empty states with CTAs.
- AI panel: typing indicator (three animated dots) while agent is running.
- Streaming text renders incrementally.
- Tool call cards: expandable to show raw input/output JSON.
- Summary messages in chat history are rendered as a distinct collapsed card: _"Earlier conversation summarized"_ with a chevron to expand the full summary text. Compressed original messages are hidden by default but accessible via the expand.
- Timestamp dividers between chat messages: _"Today"_, _"Yesterday"_, _"3 days ago"_ etc. so users can orient themselves in long histories.
- Keyboard shortcuts:
  - `Cmd/Ctrl+\` — toggle sidebar
  - `Cmd/Ctrl+Shift+D` — cycle view mode
  - `Cmd/Ctrl+K` — toggle AI panel
  - `Cmd/Ctrl+S` — force snapshot save
  - `Escape` — cancel running AI job

---

## 11. Docker

### Required Files

- Multi-stage `Dockerfile` for `api` (`python:3.12-slim`)
- Multi-stage `Dockerfile` for `ws` (`python:3.12-slim`)
- Multi-stage `Dockerfile` for `agent` (`python:3.12-slim`)
- `Dockerfile` for `frontend` (`node:20-alpine` + `nginx:alpine`)
- `.dockerignore` for each service
- `.env.example` with all variable names, no values, and inline comments
- `docker-compose.yml` for all six services

### Docker Compose Services

| Service | Port | Notes |
|---------|------|-------|
| `frontend` | 3000 | Nginx static or Vite dev. Depends on `api`. |
| `api` | 8000 | FastAPI. Runs Alembic + pgvector migrations on startup. Depends on postgres healthcheck. |
| `ws` | 1234 | pycrdt WS server. Depends on redis healthcheck. |
| `agent` | 8001 | LangGraph agent server. Depends on postgres and redis healthchecks. |
| `postgres` | 5432 | `postgres:15-alpine` with pgvector. Named volume. |
| `redis` | 6379 | `redis:7-alpine`. Named volume. |

### Additional Requirements

- Slim/alpine images. Final image sizes should not exceed 400 MB.
- No hardcoded credentials. All secrets via environment variables.
- Named volumes for postgres and redis persistence.
- Service dependency healthchecks (`condition: service_healthy`) for `api`, `ws`, and `agent`.
- Seed script (`make seed` or `docker compose run api uv run python seed.py`): 3 demo users, 2 workspaces, 5 documents with content, pre-seeded `AgentMessage` history demonstrating AI output including at least one thread that has been through a summarization cycle (contains a `summary` role message + compressed originals) to verify the memory system end-to-end.

---

## 12. Deployment

| Service | Platform |
|---------|----------|
| FastAPI API | Render, Railway, or Fly.io |
| pycrdt WS server | Fly.io (recommended), Render, or Railway |
| LangGraph agent | Render or Railway. Requires `GROQ_API_KEY` and `GOOGLE_API_KEY`. Both are free — obtain from console.groq.com and aistudio.google.com. |
| Frontend | Vercel or Netlify. Requires `VITE_API_URL`, `VITE_WS_URL`, `VITE_AGENT_URL`. |
| Redis | Upstash Redis free tier |
| File storage | Cloudflare R2 free tier (10 GB) |
| Vector DB | pgvector runs inside the same PostgreSQL instance |

**Deployment checklist:**
- All environment variables configured in platform dashboards.
- CORS configured on all backend services for the deployed frontend origin.
- Provide a demo account with at least one pre-populated document showing an AI-generated diagram.
- All deployed URLs publicly accessible and functioning without errors.

---

## 13. Deliverables

**GitHub repository** — Monorepo preferred. README must include:
- Local setup: `docker compose up`
- Architecture diagram showing all 6 services and their communication paths
- Environment variable documentation
- Screenshots: editor with live AI-generated diagram, AI chat panel with tool call cards, remote cursors from two simultaneous sessions

**Docker Hub images:**
- `yourname/drawdoc-api:latest`
- `yourname/drawdoc-ws:latest`
- `yourname/drawdoc-agent:latest`

All must boot correctly from `.env.example`.

**Live URLs:**
- Frontend (full editor with AI features)
- Backend API (`/docs` accessible for verification)
- WebSocket server (`wss://` URL)
- Agent server (`POST /agent/chat` reachable and streaming)
