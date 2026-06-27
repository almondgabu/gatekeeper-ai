# Project DNA Engine v1

## Purpose

Project DNA is the durable identity layer for a project.

Project Intelligence answers:

- what is happening now

Project DNA should answer:

- what kind of project this is
- how this project tends to operate
- what durable traits define it
- which structural patterns should guide future intelligence, agents, and automation

Project DNA Engine v1 is planning only.

It does not introduce:

- code changes
- schema changes
- manual editing workflows
- AI extraction workflows

Its purpose is to define the narrowest computed architecture that can later become real without duplicating logic already present in:

- project memories
- session summaries
- decisions
- tasks
- documents
- project intelligence

---

## 1. Which DNA Fields Should Be Computed

Project DNA fields should represent stable or semi-stable project identity, not temporary activity.

Recommended v1 computed DNA fields:

### A. Project Identity

- `projectMode`
- `projectComplexity`
- `projectOperationalState`
- `projectEvidenceDepth`

### B. Strategic Character

- `executionStyle`
- `decisionDensity`
- `knowledgeMaturity`
- `followThroughStrength`

### C. Operating Pattern

- `workstreamProfile`
- `documentationReliance`
- `conversationReliance`
- `memoryReliance`

### D. Stability Signals

- `stabilityProfile`
- `continuityStrength`
- `riskPosture`
- `momentumPattern`

### E. Task and Delivery Pattern

- `deliveryPressure`
- `taskDiscipline`
- `taskClosurePattern`

### F. Recommended Identity Summary

- `dnaSummary`

This is not a generated essay in v1. It should be a short computed profile assembled from deterministic and heuristic fields.

---

## 2. Which Project Intelligence Metrics Feed Each DNA Field

Current Project Intelligence metrics already provide the best starting signals.

### `projectMode`

Feeds from:

- Project Confidence
- Project Health
- document count
- conversation count
- memory count

Interpretation:

- document-heavy projects suggest research/evidence mode
- conversation-heavy but low-document projects suggest coordination/discovery mode
- balanced signals suggest active managed execution mode

### `projectComplexity`

Feeds from:

- Project Confidence
- Project Risk
- task count
- decision count
- session summary presence

Interpretation:

- more decisions, more open tasks, and more structured memory usually indicate higher operational complexity

### `projectOperationalState`

Feeds from:

- Project Health
- Project Momentum
- Project Priority

Interpretation:

- active, building, stalled, fragile, stable, or execution-heavy project state

### `projectEvidenceDepth`

Feeds from:

- Project Confidence
- document count
- failed/pending document patterns
- session summary count

Interpretation:

- how strong the evidence base is for future work

### `executionStyle`

Feeds from:

- Project Priority
- Project Momentum
- open task count
- task churn

Interpretation:

- reactive, steady, slow-build, or execution-driven pattern

### `decisionDensity`

Feeds from:

- decision count
- session summary count
- conversation volume

Interpretation:

- whether the project tends to formalize decisions or leave knowledge implicit

### `knowledgeMaturity`

Feeds from:

- Project Confidence
- Project Health
- documents
- memories
- decisions
- session summaries

Interpretation:

- sparse, developing, grounded, or mature knowledge state

### `followThroughStrength`

Feeds from:

- Project Priority
- Project Risk
- open task count
- completed task count
- overdue task patterns

Interpretation:

- whether decisions appear to convert into tracked work and closure

### `workstreamProfile`

Feeds from:

- documents
- tasks
- decisions
- session summaries
- conversations

Interpretation:

- research-heavy
- execution-heavy
- memory-heavy
- coordination-heavy
- early-stage setup

### `documentationReliance`

Feeds from:

- document count
- confidence
- health

Interpretation:

- low, medium, high documentation dependence

### `conversationReliance`

Feeds from:

- conversation count
- total message count
- session summary count

Interpretation:

- whether the project is mostly living in chat rather than structured memory or evidence

### `memoryReliance`

Feeds from:

- memory count
- decision count
- summary count

Interpretation:

- whether the project depends on durable memory as a working layer

### `stabilityProfile`

Feeds from:

- Project Health
- Project Risk
- Project Momentum

Interpretation:

- stable, fragile, volatile, or rebuilding

### `continuityStrength`

Feeds from:

- session summary count
- decision count
- memory count
- conversation history depth

Interpretation:

- how well the system could pick up the project again later without losing context

### `riskPosture`

Feeds from:

- Project Risk
- Project Confidence
- failed/pending document signals

Interpretation:

- low-risk, moderate-risk, high-risk operating posture

### `momentumPattern`

Feeds from:

- Project Momentum
- Project Priority
- recent task changes
- recent conversation activity

Interpretation:

- accelerating, steady, slow, or stalled

### `deliveryPressure`

Feeds from:

- open tasks
- overdue tasks
- due-soon tasks
- priority

Interpretation:

- low, moderate, elevated, urgent delivery pressure

### `taskDiscipline`

Feeds from:

- task count
- completion behavior
- decision-to-task patterns

Interpretation:

- weak, emerging, structured task discipline

### `taskClosurePattern`

Feeds from:

- open vs completed task behavior
- reopened tasks later if available

Interpretation:

- backlog-heavy, balanced, closure-driven

### `dnaSummary`

Feeds from:

- all major DNA dimensions above

Interpretation:

- one compact identity summary assembled from computed fields, not freeform prose generation in v1

---

## 3. Which Fields Come From Which Source Types

### Documents

Documents should feed:

- `projectEvidenceDepth`
- `documentationReliance`
- `knowledgeMaturity`
- part of `projectMode`
- part of `stabilityProfile`

Documents provide the strongest evidence of grounded project context.

### Memories

Project memories should feed:

- `knowledgeMaturity`
- `memoryReliance`
- `continuityStrength`
- part of `projectOperationalState`
- part of `workstreamProfile`

Memories tell us whether the project is being turned into durable structured context.

### Conversations

Conversations should feed:

- `conversationReliance`
- `momentumPattern`
- `continuityStrength`
- part of `projectMode`
- part of `executionStyle`

Conversation activity reveals working tempo and coordination style.

### Tasks

Tasks should feed:

- `deliveryPressure`
- `followThroughStrength`
- `taskDiscipline`
- `taskClosurePattern`
- `executionStyle`
- part of `projectPriority`

Tasks are the clearest execution signal.

### Decisions

Decisions should feed:

- `decisionDensity`
- `knowledgeMaturity`
- `continuityStrength`
- `projectComplexity`
- `workstreamProfile`

Decisions represent durable strategic structure.

### Session Summaries

Session summaries should feed:

- `continuityStrength`
- `knowledgeMaturity`
- `memoryReliance`
- `projectOperationalState`
- `dnaSummary`

Session summaries indicate that conversation activity has been condensed into reusable orientation.

---

## 4. Which Fields Should Never Be Manually Edited

The following should remain computed only.

### Never manually edited

- `projectOperationalState`
- `projectEvidenceDepth`
- `decisionDensity`
- `knowledgeMaturity`
- `followThroughStrength`
- `documentationReliance`
- `conversationReliance`
- `memoryReliance`
- `stabilityProfile`
- `continuityStrength`
- `riskPosture`
- `momentumPattern`
- `deliveryPressure`
- `taskDiscipline`
- `taskClosurePattern`

Reason:

- these fields are operational reflections of current system evidence
- manual edits would undermine explainability
- they should remain traceable back to source data and scoring rules

---

## 5. Which Fields May Be Manually Overridden Later

Some Project DNA fields should support curated correction later, but not in v1.

### Candidates for future manual override

- `projectMode`
- `projectComplexity`
- `executionStyle`
- `workstreamProfile`
- `dnaSummary`

Reason:

- these are interpretive identity fields
- users may know stable truths not yet inferable from current data
- later overrides can improve agent behavior and project classification

Important rule:

- override should not erase computed evidence
- computed value and curated override should remain conceptually separate

Examples:

- computed mode may look like “coordination-heavy”
- user may later override to “legal-sensitive land transaction”

That override should be treated as identity guidance, not a replacement for raw signals.

---

## 6. Which DNA Sections Are Deterministic, Heuristic, or Future AI-generated

Project DNA should be layered deliberately.

### Deterministic

Deterministic fields come directly from explicit counts, timestamps, and typed records.

Recommended deterministic DNA sections:

- `projectEvidenceDepth`
- `documentationReliance`
- `conversationReliance`
- `memoryReliance`
- `deliveryPressure`
- `continuityStrength` baseline

These should be derived from explicit project data with no ambiguity.

### Heuristic

Heuristic fields are rule-based interpretations of deterministic signals.

Recommended heuristic DNA sections:

- `projectMode`
- `projectComplexity`
- `projectOperationalState`
- `executionStyle`
- `decisionDensity`
- `knowledgeMaturity`
- `followThroughStrength`
- `workstreamProfile`
- `stabilityProfile`
- `riskPosture`
- `momentumPattern`
- `taskDiscipline`
- `taskClosurePattern`

These should remain explainable through rules and evidence mappings.

### Future AI-generated

AI-generated sections should come later, only after deterministic and heuristic identity is stable.

Recommended future AI-generated sections:

- richer `dnaSummary`
- project archetype narrative
- stakeholder narrative
- operating pattern narrative
- emerging blind spots summary
- long-horizon project identity evolution notes

These should never become the foundational truth layer. They should sit above rule-based DNA, not replace it.

---

## 7. Recommend the Narrowest Architecture

### Core Recommendation

Project DNA Engine v1 should be:

- computed
- project-first
- rule-based first
- layered above Project Intelligence
- built from existing source types only

### Narrowest Architectural Shape

Recommended shape:

1. Keep Project Intelligence as the current operational scoring engine.
2. Add Project DNA later as a second pure computation layer that reads:
   - Project Intelligence outputs
   - project detail source data
3. Keep DNA output as a structured object, not a table, in v1.
4. Treat DNA as a computed profile before introducing persistence.

### Why This Is the Narrowest Safe Path

Because the repo already has:

- project-scoped documents
- project-scoped conversations
- project memories
- decisions
- session summaries
- tasks
- rule-based Project Intelligence

The system does not need a new schema or a new AI layer to define DNA v1 conceptually.

### Recommended v1 Layering

The cleanest future computation chain is:

1. Source data:
   - documents
   - conversations
   - messages
   - memories
   - decisions
   - session summaries
   - tasks
2. Project Intelligence:
   - health
   - confidence
   - priority
   - risk
   - momentum
   - recommended next action
3. Project DNA Engine:
   - identity fields
   - operating pattern fields
   - stability and maturity fields
   - computed DNA summary

This prevents duplicate logic.

Project DNA should not recompute everything from scratch if Project Intelligence already provides stable metrics.

### What Project DNA Should Not Be in v1

Project DNA should not be:

- a manual form first
- an AI-generated paragraph first
- a schema-first expansion
- a second competing scoring engine

Project DNA v1 should be a computed identity profile built from existing evidence and current intelligence.

---

## Recommended Final Position

Project DNA Engine v1 should be treated as a computed identity layer with three classes of fields:

1. Deterministic evidence fields
2. Heuristic identity fields
3. Future AI-generated narrative fields

The system should preserve these rules:

- compute from existing project evidence first
- reuse Project Intelligence rather than duplicate it
- never let manual edits override evidence-derived operational signals
- reserve manual overrides for durable identity interpretation only
- reserve AI generation for narrative enrichment, not foundational truth

This is the narrowest path that keeps Gatekeeper AI:

- project-first
- explainable
- composable
- scalable toward Project DNA, Timeline, Knowledge Graph, Agents, and Automation