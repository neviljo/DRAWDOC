# DrawDoc — Build Plan

> **Spec reference:** [drawdoc-spec.md](./drawdoc-spec%20(2).md)

---

## Overview

DrawDoc is a real-time collaborative diagram & document editor with an AI agent (LangGraph).

**Dev setup:** Local laptop for lightweight work + GitHub Codespaces for Docker/infra tasks.

---

## Phase 1: Project Scaffold & Config (Local)

| Step | What | Where |
|------|------|-------|
| 1.1 | Init monorepo structure: `frontend/`, `api/`, `ws/`, `agent/`, `infra/` | Local |
| 1.2 | Setup frontend: Vite + React + TS + Tailwind + Radix | Local |
| 1.3 | Setup API: FastAPI + SQLAlchemy + Alembic + Pydantic | Local |
| 1.4 | Setup WS: `pycrdt-websocket` server skeleton | Local |
| 1.5 | Setup Agent: LangGraph + FastAPI sub-app skeleton | Local |
| 1.6 | `uv init` in `api/`, `ws/`, `agent/` — lock files committed | Local |
| 1.7 | Root `.env.example` with all env vars + inline comments | Local |
| 1.8 | Root `.gitignore` | Local |

---

## Phase 2: Landing Page & Auth UI (Local)

| Step | What |
|------|------|
| 2.1 | Hero section with animated split-pane demo (CSS) |
| 2.2 | Feature highlights grid (3-column cards) |
| 2.3 | How-it-works walkthrough + testimonials + open/free section |
| 2.4 | Footer |
| 2.5 | Sign-up page (`/signup`) — form + OAuth + inline validation |
| 2.6 | Sign-in page (`/login`) — form + OAuth + error handling |
| 2.7 | Forgot/reset password pages |
| 2.8 | Protected route wrapper + redirect logic |
| 2.9 | Zustand stores for auth UI state |

---

## Phase 3: Backend Auth & Data Layer (Codespaces — needs Docker)

| Step | What |
|------|------|
| 3.1 | `docker-compose.yml` with postgres + redis only |
| 3.2 | Dockerfile for `api` (Python 3.12-slim) |
| 3.3 | SQLAlchemy models: User, Workspace, WorkspaceMember, Document, DocSnapshot, Invite |
| 3.4 | Alembic migrations for core entities |
| 3.5 | Auth endpoints: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` |
| 3.6 | JWT access + refresh token logic (15 min / 7 day) |
| 3.7 | OAuth flow: Google + GitHub |
| 3.8 | Workspace CRUD endpoints |
| 3.9 | Document CRUD endpoints |
| 3.10 | Invite + member management endpoints |

---

## Phase 4: Real-Time Collaboration (Codespaces — needs Docker)

| Step | What |
|------|------|
| 4.1 | Dockerfile for `ws` (Python 3.12-slim, `pycrdt-websocket`) |
| 4.2 | Add `ws` service to docker-compose |
| 4.3 | Y.Doc ↔ Redis snapshot persistence (every 30s + on disconnect) |
| 4.4 | Awareness protocol — cursor positions, selections, colors |
| 4.5 | Frontend: BlockNote + CollaborationExtension bound to Y.Doc |
| 4.6 | Frontend: Excalidraw + Y.Map("excalidraw") sync adapter |
| 4.7 | Avatar stack + presence indicators in top bar |
| 4.8 | Connection status badge (green/yellow/red) |
| 4.9 | Follow mode — click avatar to follow viewport |
| 4.10 | View modes: split / text-only / diagram-only |
| 4.11 | Guest/anonymous public share links |

---

## Phase 5: AI Agent (Codespaces — needs Docker)

| Step | What |
|------|------|
| 5.1 | Dockerfile for `agent` (Python 3.12-slim) |
| 5.2 | Add `agent` service to docker-compose |
| 5.3 | SQLAlchemy models: AgentThread, AgentMessage, AgentJob, DocEmbedding |
| 5.4 | Alembic migrations for AI entities + pgvector extension |
| 5.5 | LangGraph StateGraph: `route_intent` → 4 branches |
| 5.6 | All agent nodes: plan_diagram, generate_elements, write_to_canvas, read_document, plan_edit, apply_edit, retrieve_context, generate_answer, chat_response |
| 5.7 | Agent tools: get_document_content, list_workspace_documents, create_document, update_diagram, update_document_text, search_workspace, generate_mermaid, export_diagram, web_search |
| 5.8 | Token-budget context window loader (8K tokens) |
| 5.9 | Rolling summarization (every 20 messages via `arq`) |
| 5.10 | Redis context cache (5 min TTL, write invalidation) |
| 5.11 | pgvector RAG chunking + embedding pipeline |
| 5.12 | Groq `llama-3.3-70b-versatile` primary + Gemini `gemini-2.5-flash` fallback |
| 5.13 | Incremental JSON parsing with `jsonriver` for diagram streaming |
| 5.14 | SSE streaming endpoint: `POST /agent/chat` |
| 5.15 | Rate-limit transparency (amber warnings, failover) |
| 5.16 | Mermaid → Excalidraw conversion pipeline |

---

## Phase 6: Frontend Editor & AI Panel (Local)

| Step | What |
|------|------|
| 6.1 | Split-pane editor layout with draggable divider |
| 6.2 | BlockNote text pane with slash commands + floating toolbar |
| 6.3 | Excalidraw canvas with full toolbar |
| 6.4 | AI panel (collapsible right side) with `useChat` SSE hook |
| 6.5 | Chat history: infinite scroll, timestamp dividers, session continuity |
| 6.6 | Progressive diagram rendering (diagram_progress SSE events) |
| 6.7 | Tool call cards with expandable JSON |
| 6.8 | Prompt library templates |
| 6.9 | Typing indicator + stop button + clear history |
| 6.10 | AI cursor (purple, labeled) |
| 6.11 | Keyboard shortcuts (`Cmd+K`, `Cmd+Shift+D`, `Escape`, etc.) |
| 6.12 | Dark/light mode toggle (persisted) |
| 6.13 | Mobile responsive: AI panel as bottom sheet |

---

## Phase 7: Dashboard & Workspace Views (Local)

| Step | What |
|------|------|
| 7.1 | Dashboard: workspace list, recent documents, quick-create |
| 7.2 | Workspace view: sidebar, document list with search/sort |
| 7.3 | Settings panel: rename, manage members, invite link |
| 7.4 | Member presence: avatar stack with online status |

---

## Phase 8: Landing Page Demo Sandbox (Codespaces — needs Docker)

| Step | What |
|------|------|
| 8.1 | Live public demo workspace with fixed document ID |
| 8.2 | Anonymous guest identity (random name + color) |
| 8.3 | Constrained embedded editor (~900×600) with browser-chrome mockup |
| 8.4 | Demo document pre-seeded with content + architecture diagram |
| 8.5 | "Reset demo" button → server endpoint |
| 8.6 | Live collaborator count badge |
| 8.7 | AI disabled for anonymous users → sign-up CTA |

---

## Phase 9: Docker Compose Full Stack (Codespaces)

| Step | What |
|------|------|
| 9.1 | Full `docker-compose.yml` — all 6 services with healthchecks |
| 9.2 | Multi-stage Dockerfiles for `api`, `ws`, `agent`, `frontend` |
| 9.3 | `.dockerignore` per service |
| 9.4 | Seed script: demo users, workspaces, documents, AgentMessage history |
| 9.5 | `Makefile` with targets: `up`, `down`, `seed`, `logs`, `migrate` |
| 9.6 | Named volumes for postgres + redis |

---

## Phase 10: Deployment & Polish (Codespaces)

| Step | What |
|------|------|
| 10.1 | Docker Hub images for `api`, `ws`, `agent` |
| 10.2 | Deploy frontend (Vercel/Netlify) |
| 10.3 | Deploy API (Render/Railway/Fly.io) |
| 10.4 | Deploy WS server (Fly.io) |
| 10.5 | Deploy Agent (Render/Railway) |
| 10.6 | Upstash Redis + Cloudflare R2 config |
| 10.7 | CORS config for all deployed origins |
| 10.8 | Architecture diagram in README |
| 10.9 | Screenshots: editor with AI diagram, chat panel, remote cursors |
| 10.10 | Live URLs verification |

---

## Local vs Codespaces Split

| Work | Where | Why |
|------|-------|-----|
| Frontend code (React, TS, CSS) | **Local laptop** | Lightweight, Vite HMR runs fine |
| Landing page, dashboard, editor UI | **Local laptop** | No Docker needed |
| Backend Python code (logic only) | **Local laptop** | Can lint/typecheck without services |
| Docker Compose / Dockerfiles | **Codespaces** | Needs Docker daemon |
| Postgres + Redis services | **Codespaces** | Heavy services |
| API with real DB queries | **Codespaces** | Needs postgres running |
| WS server (pycrdt) | **Codespaces** | Needs Redis running |
| Agent server (LangGraph) | **Codespaces** | Needs postgres + Redis + LLM keys |
| Full integration testing | **Codespaces** | All services required |
| Seed scripts + data setup | **Codespaces** | Needs DB |
| Deployment | **Codespaces** | Needs Docker builds |
| Docker image push | **Codespaces** | Needs Docker |

---

## Environment Variables (`.env.example`)

```
# Frontend
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:1234
VITE_AGENT_URL=http://localhost:8001

# API
DATABASE_URL=postgresql+asyncpg://drawdoc:drawdoc@localhost:5432/drawdoc
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
GROQ_API_KEY=
GOOGLE_API_KEY=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=drawdoc-assets
CORS_ORIGINS=http://localhost:3000

# WS Server
WS_REDIS_URL=redis://localhost:6379

# Agent
AGENT_DATABASE_URL=postgresql+psycopg://drawdoc:drawdoc@localhost:5432/drawdoc
AGENT_REDIS_URL=redis://localhost:6379
AGENT_GROQ_API_KEY=
AGENT_GOOGLE_API_KEY=
AGENT_CORS_ORIGINS=http://localhost:3000
```

---

## Quick Start (Full Stack)

```bash
docker compose up -d                  # Start all services
docker compose run api uv run python seed.py   # Seed demo data
```

## Quick Start (Local Frontend + Codespaces Backend)

1. Push code to GitHub → open Codespaces
2. `docker compose up -d` in Codespaces
3. Update `.env` with Codespaces forwarded URLs
4. `npm run dev` on local laptop pointed at Codespaces URLs

---

## Architecture

```
Browser
  ├── HTTPS ──► API (FastAPI :8000) ──► PostgreSQL
  │                               └──► Redis
  ├── WSS  ──► WS (pycrdt :1234) ──► Redis
  └── SSE  ──► Agent (LangGraph :8001) ──► PostgreSQL
                                      └──► Redis
                                      └──► Groq / Gemini LLM
```

Six services: `frontend` (React SPA, Nginx), `api` (FastAPI REST), `ws` (pycrdt Yjs sync), `agent` (LangGraph), `postgres` (15 + pgvector), `redis` (7).

## Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | Vercel or Netlify | Set `VITE_API_URL`, `VITE_WS_URL`, `VITE_AGENT_URL` |
| API | Render / Railway / Fly.io | Requires PostgreSQL + Redis URLs, JWT secret, CORS |
| WS | Fly.io (recommended) | Requires Redis URL |
| Agent | Render / Railway | Requires `GROQ_API_KEY`, `GOOGLE_API_KEY`, DB + Redis URLs |
| PostgreSQL | Neon / Supabase / Render | Must have pgvector extension |
| Redis | Upstash free tier | 256 MB free tier sufficient |
| File storage | Cloudflare R2 free tier | 10 GB free |

### Environment Variables

See [`.env.example`](./.env.example) for all required variables with inline comments.

### Required API Keys (Free Tier)

| Service | Key | Get at |
|---------|-----|--------|
| Groq | `GROQ_API_KEY` | console.groq.com |
| Google AI | `GOOGLE_API_KEY` | aistudio.google.com |

### Demo Account

After running `make seed`:
- `alice@drawdoc.demo` / `demo1234`
- `bob@drawdoc.demo` / `demo1234`
- `demo@drawdoc.demo` / `demo1234`

The public sandbox at `/` works without login.

## Deliverables

- **GitHub repo** — Monorepo, full source code
- **Docker images** — `drawdoc-api`, `drawdoc-ws`, `drawdoc-agent`
- **Live URLs** — Frontend, API (`/docs`), WS (`wss://`), Agent (`POST /agent/chat`)
