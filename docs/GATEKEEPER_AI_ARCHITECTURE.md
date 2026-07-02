# Gatekeeper AI Architecture Book v1

## 1. Product Vision

Gatekeeper AI is a project-aware AI workspace for knowledge-intensive property and operational work.

Its purpose is to help users:

- centralize documents, chats, tasks, and durable memories inside project workspaces
- retrieve the right project knowledge at the right time
- convert raw activity into structured memory and next actions
- maintain operational clarity through a dashboard and project intelligence layer
- create outbound content through a focused Content Studio workflow

The system is moving toward a model where each project becomes a living operational object with:

- source knowledge
- ongoing conversations
- durable decisions
- active tasks
- derived summaries
- health and priority signals

## 2. Core Architecture

Gatekeeper AI is a Next.js App Router application with a Supabase-backed data model and OpenAI-powered reasoning surfaces.

Current architectural pattern:

- UI pages live under `src/app`
- server routes live under `src/app/api`
- reusable server/client logic lives under `src/lib`
- Supabase is the system of record for projects, documents, conversations, messages, memories, and tasks
- OpenAI is used only in explicit intelligence/content-generation paths, not for core storage

The architecture is intentionally conservative:

- reuse existing tables before adding schema
- keep project scope explicit via `projectId`
- prefer server-side aggregation and retrieval helpers
- keep intelligence layers composable and narrow

## 3. Main Layers

### Knowledge Layer

The Knowledge Layer is the document-backed source-of-truth retrieval system.

Main responsibilities:

- store uploaded knowledge vault documents
- assign documents to projects via `documents.project_id`
- extract text and embed chunks
- retrieve semantically relevant chunks globally or per project

Key implementation surfaces:

- `src/lib/storeDocument.ts`
- `src/lib/ingestDocument.ts`
- `src/lib/retrieveKnowledgeContext.ts`
- `src/app/api/vault/*`

### Memory Layer

The Memory Layer converts transient work into reusable structured context.

Memory forms currently include:

- raw persisted messages in `messages`
- suggested project memories
- project memories in `project_memories`
- decisions in `project_memories` with `memory_type = decision`
- rolling session summaries in `project_memories` with `memory_type = session_summary`

Key implementation surfaces:

- `src/app/api/project-memories/route.ts`
- `src/app/api/suggest-memory/route.ts`
- `src/app/api/project-session-summary/route.ts`
- `src/lib/retrieveProjectMemories.ts`
- `src/lib/buildProjectSessionSummaryContext.ts`

### Intelligence Layer

The Intelligence Layer interprets existing data into usable project-aware outputs.

Current intelligence capabilities:

- project-scoped chat continuity
- project session summarization
- project health/confidence/priority/risk/momentum scoring
- dashboard-level attention and priority aggregation

Key implementation surfaces:

- `src/lib/buildProjectChatContext.ts`
- `src/lib/projectIntelligence.ts`
- `src/app/api/dashboard/route.ts`

### Productivity Layer

The Productivity Layer is where users do operational work.

Current features:

- scoped and global chat
- project tasks
- project brief generation
- project workspaces
- document assignment and removal

Key implementation surfaces:

- `src/app/chat/page.tsx`
- `src/app/projects/page.tsx`
- `src/app/projects/[id]/page.tsx`
- `src/app/api/project-tasks/route.ts`
- `src/app/api/project-brief/route.ts`

### Dashboard / Mission Control

The Dashboard is evolving into the AI Command Center layer.

Its role is to summarize:

- what changed recently
- what needs attention today
- which projects need action
- what the system learned today

Current implementation uses one server-side aggregation route:

- `src/app/api/dashboard/route.ts`

and one UI consumer:

- `src/app/page.tsx`

## 3A. AI Model And Provider Configuration

Gatekeeper AI now centralizes AI model configuration and provider abstraction so rendering engines can be swapped without changing Production Studio UI or workflow.

Current model configuration lives in:

- `src/lib/ai/modelConfig.ts`

Current model map:

- Chat: `gpt-5.5`
- Image: `gpt-image-2`
- Video Draft: `sora-2`
- Video Production: `sora-2-pro`

Provider abstraction lives in:

- `src/lib/ai/providers.ts`

Current provider registry:

- Image Provider: GPT Image 2
- Video Provider (Recommended): Google Flow (manual external render)
- Video Provider (Draft): Sora 2
- Video Provider (Production): Sora 2 Pro

Design principle:

- Gatekeeper AI is the Creative Director and orchestration layer.
- Rendering is performed manually on approved external platforms after prompt handoff.
- Upgrading models should require changing one configuration surface, not production workflow code.

## 4. Current Data Flow

High-level flow:

1. User creates or opens a project.
2. Documents may be uploaded and assigned to that project.
3. Project chat persists raw `messages` under a `conversation` row.
4. Chat retrieval uses project scope to pull:
   - project summary
   - recent conversation context
   - relevant project memories
   - project-filtered knowledge vault chunks
5. Post-save memory routes may persist:
   - suggested project memory
   - rolling session summary
   - decision memories
   - open tasks
6. Dashboard and project detail views aggregate this stored data into operational signals.

## 5. Project Lifecycle

Current project lifecycle:

1. `projects` row is created.
2. Documents are uploaded and optionally linked through `documents.project_id`.
3. Project-scoped conversations are created with `conversations.project_id`.
4. Raw messages accumulate in `messages`.
5. Important facts are promoted into `project_memories`.
6. Explicit next actions become `project_tasks`.
7. Session summarization condenses recent conversation slices into a rolling memory.
8. Project detail and dashboard surfaces score and summarize project state.

This lifecycle is intentionally layered from raw activity to structured intelligence.

## 6. Memory Hierarchy

The current memory hierarchy is:

### Raw Conversations

- persisted in `messages`
- most detailed but least structured
- used for continuity and summarization inputs

### Session Summaries

- stored in `project_memories`
- one rolling summary per source conversation
- include metadata cursor `[last_summarized_message_id:N]`
- bridge raw chat into durable orientation

### Project Memories

- stored in `project_memories`
- general-purpose durable project facts
- retrievable independently from documents

### Decisions

- also stored in `project_memories`
- explicitly durable approvals, constraints, or preferences
- higher-value operational memory than generic notes

### Tasks

- stored in `project_tasks`
- actionable operational commitments
- open/completed lifecycle

### Documents

- stored in `documents`, chunked into `document_chunks`
- foundational evidence layer for retrieval

Hierarchy principle:

- documents and raw messages are source material
- summaries, memories, decisions, and tasks are structured abstractions derived from that source material

## 7. Retrieval Flow

Project retrieval flow currently works as follows:

1. User sends a chat message.
2. `src/app/api/chat/route.ts` detects whether `projectId` is present.
3. If global, it retrieves general Knowledge Vault context.
4. If project-scoped, it builds a composite project context through `buildProjectChatContext`.
5. That composite context includes:
   - project summary
   - recent persisted messages from project conversations
   - relevant project memories
   - project-filtered document chunk retrieval
6. OpenAI receives the assembled context and user question.
7. Assistant response is persisted to `messages`.
8. Post-save memory routes may derive further structured memory.

Retrieval priority in practice:

1. project summary
2. recent conversation continuity
3. project memories
4. project document chunks

## 8. Project Intelligence Scoring

Project Intelligence v1 is rule-based and lives in:

- `src/lib/projectIntelligence.ts`

It consumes only existing project detail page data:

- documents
- conversations
- memories
- tasks

It computes:

- Project Health
- Project Confidence
- Project Priority
- Project Risk
- Project Momentum
- Recommended Next Action

Scoring principles:

- reward recent activity, durable memory, and structured context
- penalize thin evidence, unresolved work, stale activity, and failed/pending inputs
- keep output explainable with short textual reasons per score
- do not call OpenAI
- do not access Supabase inside the helper

First UI target is the project detail page because that page already owns the richest per-project data.

## 9. Dashboard Aggregation Design

Dashboard aggregation currently lives in:

- `src/app/api/dashboard/route.ts`

The route uses existing tables only and returns one JSON payload for the UI.

Current sections:

- greeting using `Asia/Kuching`
- top-level stats
- AI Briefing
- Today’s Priorities
- Projects Requiring Attention
- AI Learning Today

Design principles:

- aggregate server-side
- reuse current tables instead of introducing dashboard-specific schema
- use heuristic summaries instead of model calls
- use Sabah-local day windows where “today” matters

This route is the first Mission Control aggregator and should remain narrow and readable.

## 10. Content Studio Role

Content Studio is the outward-facing creation layer for marketing and communication workflows.

Current responsibilities:

- create structured content packages
- generate inspiration and idea lists
- save local browser-side history for generated output

Key surfaces:

- `src/app/content-studio/page.tsx`
- `src/app/api/content-studio/route.ts`

Architecturally, Content Studio is adjacent to project intelligence but separate from operational memory. It is a generation surface, not a retrieval-memory core.

## 11. Coding Principles

The current development pattern should remain explicit:

- inspect first
- make narrow changes
- avoid schema changes unless necessary
- prefer reuse over new storage surfaces
- keep server aggregation in helpers/routes
- keep pages focused on orchestration and presentation
- use project scope explicitly through `projectId`
- run build or focused validation before commit
- keep one responsibility per commit
- avoid unrelated cleanup inside feature work

These principles are already visible in recent milestones:

- conversation continuity
- session summarization
- dashboard aggregation
- dashboard UI connection
- project intelligence scoring

## 12. Future Roadmap

### Project DNA

Turn each project into a more stable operational object that captures:

- mission
- preferred strategy
- operating constraints
- counterparties
- recurring decision patterns

### Project Timeline

Add a chronological narrative layer that combines:

- documents
- conversations
- decisions
- summaries
- tasks

into a durable project history.

### Knowledge Graph

Move from isolated records toward explicit relationships between:

- projects
- documents
- decisions
- tasks
- conversations
- entities and concepts

### Specialist Agents

Introduce role-specific agents for tasks such as:

- legal review
- property research
- investor briefing
- content repurposing
- project health monitoring

### Automation

Add controlled automation for:

- scheduled summaries
- stale project detection
- reminder generation
- document ingestion workflows
- rule-based escalation from project risk/priority signals

## Closing Direction

Gatekeeper AI should continue evolving from a document-and-chat app into a structured operational intelligence system.

The architectural direction is:

- source material at the bottom
- structured memory in the middle
- rule-based and model-based intelligence above it
- dashboard and project workspaces as the operational interface

Future work should preserve that layering so the product remains understandable, scalable, and safe to extend.