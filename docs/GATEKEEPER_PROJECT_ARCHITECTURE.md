# Gatekeeper Project Architecture

## Problem Statement

Gatekeeper modules are beginning to persist data independently in separate localStorage containers.

If this continues, user work becomes fragmented across isolated module stores. This creates:

- duplicate project identities across modules
- broken continuity between module workflows
- inconsistent project lifecycle status
- harder migration to shared cloud sync

## Why A Unified Project Model Is Needed

A unified project model ensures one project identity across all modules.

Benefits:

- one source of truth for project metadata
- module handoff continuity without manual copy/paste
- predictable ownership boundaries per module
- simpler migration path to Supabase sync
- easier auditing, backup, and recovery

## Unified Data Model

Top-level container:

- GatekeeperProject

Core fields:

- id
- title
- createdAt
- updatedAt
- status
- modules

Module sections under modules:

- ideaExplorer
- viralScanner
- contentCreator
- productionStudio
- publishing
- contentIntelligence

Principle:

One project. Many module sections.

## Module Read/Write Rules

Rule 1:

- Every module may read top-level project metadata.

Rule 2:

- A module may write only its own module section under modules.

Rule 3:

- A module must not mutate sibling module sections.

Rule 4:

- Cross-module updates must happen through explicit orchestrated flows, not implicit side effects.

Rule 5:

- Top-level status changes should be intentional and centralized.

## Storage Strategy (Current Phase)

Local architecture foundation uses one key:

- gatekeeper-projects

Storage behavior:

- list all projects from one array
- get by id
- create project shell with module defaults
- save full project record
- update one module section safely
- delete by id

Current sprint constraint:

- no migration of existing module-specific stores yet

## Migration Strategy (Future Sprint)

Phase 1:

- ship shared model and helpers without changing existing module behavior

Phase 2:

- dual-write from modules to legacy keys and unified key

Phase 3:

- backfill legacy records into unified project envelopes

Phase 4:

- switch read paths to unified model

Phase 5:

- deprecate legacy per-module keys after validation

## Future Supabase Sync Notes

Planned shape for sync layer:

- projects table for top-level metadata
- module payload columns (JSONB) or module child table
- updatedAt based conflict detection
- optimistic merge per module section

Recommended sync semantics:

- per-module patch updates
- last-write-wins within a module section
- explicit conflict policy when the same module section diverges

## Developer Rules

- Do not create new per-module storage islands for project continuity data.
- Always persist project continuity data under gatekeeper-projects.
- Keep module payloads schema-aware and versionable.
- Preserve unknown module payload fields when updating module data.
- Never mutate unrelated module sections during module updates.
- Do not migrate existing legacy keys in this architecture sprint.
- Keep UI behavior unchanged until dedicated migration sprints.
