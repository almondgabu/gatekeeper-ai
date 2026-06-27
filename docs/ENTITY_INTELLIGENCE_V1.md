# Entity Intelligence v1

## Purpose

Entity Intelligence is the next abstraction layer above today’s project-first memory and intelligence system.

Its role is to answer a simple question:

- what things actually exist in the business world represented by Gatekeeper AI
- how those things relate to one another
- which of those things deserve durable identity
- which should remain text, memory, or metadata

Entity Intelligence v1 is a planning milestone only.

It does not introduce:

- code changes
- schema changes
- new extraction pipelines
- new tables

It defines the narrowest architectural direction that can later support:

- Project DNA
- Project Timeline
- Knowledge Graph
- Specialist AI Agents
- Automation

---

## Part 1: Which Entities Already Exist Implicitly?

Some entities already exist explicitly in current tables. Others exist implicitly inside text, memory, project naming, or operational flows.

### Explicit or Near-explicit Today

#### Project

Status: explicit

Evidence:

- `projects`
- referenced by `documents.project_id`
- referenced by `conversations.project_id`
- referenced by `project_memories.project_id`
- referenced by `project_tasks.project_id`

#### Conversation

Status: explicit

Evidence:

- `conversations`
- optionally project-scoped via `project_id`

#### Message

Status: explicit

Evidence:

- `messages`
- linked to `conversation_id`

#### Document

Status: explicit

Evidence:

- `documents`
- chunked into `document_chunks`
- optionally linked to `project_id`

#### Task

Status: explicit

Evidence:

- `project_tasks`
- can link back to `source_conversation_id`

#### Decision

Status: semi-explicit

Evidence:

- stored inside `project_memories`
- identified by `memory_type = decision`

Decision already behaves like an entity, even though it currently lives as a typed memory record rather than its own table.

#### Session Summary

Status: semi-explicit

Evidence:

- stored inside `project_memories`
- identified by `memory_type = session_summary`
- linked to a `source_conversation_id`

#### Project Memory

Status: explicit container, not always a distinct business entity

Evidence:

- `project_memories`

Project memory is a storage abstraction, not automatically a business entity.

### Implicit Today

The following exist only indirectly through naming, document content, conversations, or memories.

#### Person

Status: implicit

Can appear in:

- raw messages
- project memories
- uploaded documents
- task descriptions

No dedicated identity exists.

#### Company

Status: implicit

Can appear in:

- project titles
- legal/financial/project documents
- chat and memory text

#### Property

Status: implicit

Often central to project meaning, but currently represented only through:

- project naming
- documents
- memories
- conversations
- content outputs

#### Location

Status: implicit

May appear in project titles, listing context, documents, or messages.

#### Marketing Campaign

Status: implicit

Currently marketing work is represented through Content Studio output or project context, not as a stable entity.

#### Legal Matter

Status: implicit

Can be inferred from legal documents, decisions, tasks, or conversations, but is not modeled explicitly.

#### Drone Survey

Status: implicit

Can exist as document/media context or in project content flows, but has no durable identity.

#### Financial Model

Status: implicit

May exist as a document or project context, but is not modeled as an entity.

#### Buyer

Status: implicit

Likely to appear in task, decision, or conversation text, but not modeled.

#### Owner

Status: implicit

Often highly important operationally, but currently text only.

#### Lawyer

Status: implicit

May appear in legal matters and communications, but currently unmodeled.

#### Agent

Status: implicit

Can mean real-estate agent, internal operator, or future AI agent. Human-agent identities do not exist yet as entities.

#### Vendor

Status: implicit

Appears only as operational text if present.

#### Media Asset

Status: implicit

Could be represented by uploaded files or content outputs, but no dedicated asset identity exists.

---

## Part 2: Which Relationships Already Exist?

Current relationships are mostly project-centered and relatively shallow.

### Explicit Relationships

#### Project -> Documents

Represented by:

- `documents.project_id`

#### Project -> Tasks

Represented by:

- `project_tasks.project_id`

#### Project -> Conversations

Represented by:

- `conversations.project_id`

#### Conversation -> Messages

Represented by:

- `messages.conversation_id`

#### Task -> Conversation

Represented by:

- `project_tasks.source_conversation_id`

This is a useful existing seed for traceable operational lineage.

#### Decision -> Project

Represented by:

- `project_memories.project_id`
- `project_memories.memory_type = decision`

#### Session Summary -> Conversation

Represented by:

- `project_memories.source_conversation_id`
- `project_memories.memory_type = session_summary`

#### Session Summary -> Project

Represented by:

- `project_memories.project_id`

#### Document -> Project

Represented by:

- `documents.project_id`

#### Project Memory -> Conversation

Represented by:

- `project_memories.source_conversation_id`

### Implicit Relationships

These exist logically, but not as structured links.

#### Decision -> Task

Often true operationally, but not modeled.

#### Decision -> Document

A decision may be supported by specific documents, but that relationship is not stored.

#### Task -> Decision

Tasks may arise from decisions, but only loose conversational lineage exists.

#### Conversation -> Document

A conversation may rely on retrieved documents, but no persistent structured relationship is stored.

#### Memory -> Document

Memories can be influenced by document evidence, but there is no source-document linkage.

---

## Part 3: Which Relationships Are Missing?

The missing relationships are exactly what prevents the current system from becoming a full entity-aware operating layer.

### Missing but Important

#### Project -> Property

Projects often clearly involve a property or asset, but the system cannot represent that explicitly.

#### Project -> Person / Company

The system cannot currently represent the key actors attached to a project.

This includes:

- owner
- buyer
- lawyer
- vendor
- internal operator

#### Task -> Person / Company

No assignment or stakeholder linkage exists.

#### Decision -> Person / Company

The system cannot represent who made, approved, or is affected by a decision.

#### Document -> Person / Company / Property

Documents are project-linked, but not entity-linked.

#### Conversation -> Person / Company / Property

Conversations are project-scoped, but not entity-scoped.

#### Marketing Output -> Project

Content Studio outputs are not yet durably linked to projects as entities.

#### Legal Matter -> Project / Document / Decision

Legal concerns may exist in text, but cannot be represented as a connected structure.

#### Drone Survey -> Property / Project / Document

No durable survey object exists.

#### Financial Model -> Project / Document / Decision

No durable financial model object exists.

### Why These Missing Relationships Matter

Without these links, the system can summarize project state, but it cannot yet reason deeply about:

- repeated actors across projects
- evidence chains behind decisions
- which tasks belong to which stakeholder
- which documents matter to which entity
- how business context propagates across multiple projects

That is the exact boundary between current project intelligence and future entity intelligence.

---

## Part 4: Classify Every Entity

Each entity should be classified by how stable it is and how it should behave over time.

### Static

Static entities change rarely and are primarily descriptive.

Recommended static entities:

- Property
- Location
- Document type
- Media Asset type
- Legal document type
- Project type

These should not be re-derived every session.

### Semi-static

Semi-static entities persist durably but may evolve over time.

Recommended semi-static entities:

- Person
- Company
- Owner
- Buyer
- Lawyer
- Agent
- Vendor
- Project DNA
- Legal Matter
- Marketing Campaign
- Drone Survey
- Financial Model

These should be durable, but updatable.

### Dynamic

Dynamic entities change frequently and reflect live work.

Recommended dynamic entities:

- Conversation
- Message
- Task
- Project Timeline event
- Document linkage state
- Session

These represent active process rather than stable identity.

### Derived

Derived entities are computed from underlying activity.

Recommended derived entities:

- Project Health
- Project Confidence
- Project Priority
- Project Risk
- Project Momentum
- dashboard attention ranking
- daily briefing signals

These should remain outputs, not manually curated business objects.

### Generated

Generated entities are created by deterministic or AI-based interpretation.

Recommended generated entities:

- Recommended Next Action
- Session Summary
- Decision candidate
- memory suggestions
- timeline summaries
- future agent recommendations

Generated entities should be explainable and, where necessary, reviewable.

---

## Part 5: Narrowest Architecture for Entity Intelligence v1

### Recommendation

Entity Intelligence v1 should be hybrid.

Specifically:

- rule-based first
- user-curated where durable identity matters
- AI-extracted only where text must be promoted into structured candidates

### Why Not Pure Rule-based?

Rule-based systems are excellent for:

- scoring
- heuristics
- relationship inference from explicit foreign keys
- timeline ordering

But they are weak for discovering latent entities inside text such as:

- owners
- buyers
- legal counterparties
- property names
- company relationships

### Why Not Pure AI-extracted?

Pure AI extraction would be too unstable for v1 because:

- not every noun should become an entity
- extraction quality depends on incomplete text
- duplicate entity formation would become a major problem
- false positives would pollute the system quickly

### Why Not Pure User-curated?

Pure user curation would create too much friction and would undercut the intelligence value of the system.

### Best v1 Shape

The narrowest workable Entity Intelligence v1 architecture is:

1. Rule-based relationship layer over existing explicit project data.
2. User-curated durable entities only where identity matters.
3. AI-extracted candidates later, but always reviewed or normalized before becoming durable entities.

That means:

- project, conversation, message, document, task, decision, session summary stay as core v1 anchors
- future entities like owner, buyer, property, company, legal matter begin as optional curated overlays
- Project Intelligence and dashboard logic continue to remain rule-based

This is the safest path because it reuses the current architecture rather than replacing it.

---

## Part 6: Long-term Evolution

Entity Intelligence becomes the foundation for several planned layers.

### Project DNA

Entity Intelligence gives Project DNA its durable nouns.

Without entities, Project DNA remains a text summary.

With entities, Project DNA can stabilize:

- who the project is about
- what asset it concerns
- which stakeholders matter
- what legal/commercial identity the project has

### Project Timeline

Entity Intelligence gives the timeline semantic depth.

Instead of showing only generic activity, the timeline can eventually say:

- this decision involved this owner
- this task followed that legal matter
- this document changed the project’s commercial stance

### Knowledge Graph

Entity Intelligence is the prerequisite for a graph.

A graph without stable entities becomes noisy text indexing.

Entity Intelligence defines:

- which nodes deserve identity
- which relationships are explicit
- which relationships are inferred
- which are too weak to persist

### Specialist AI Agents

Specialist agents need shared, stable business objects.

Entity Intelligence makes that possible by giving all agents a common model of:

- who is involved
- what the project concerns
- which evidence matters
- which decisions and tasks are connected

That prevents each agent from inventing its own private version of reality.

### Automation

Automation depends on entities because automations should trigger on meaningful business objects, not arbitrary text.

Examples:

- remind when buyer follow-up is overdue
- notify when a legal matter has unresolved tasks
- escalate when a property-linked project loses momentum
- schedule reporting by stakeholder or campaign

Without entity intelligence, automation would remain too generic.

---

## Part 7: What Should NOT Become an Entity

This is the most important architectural guardrail.

Not every noun deserves a durable identity.

### Should Remain Raw Text

The following often should remain text unless repeated, important, and stable:

- casual mentions in conversation
- one-off descriptive phrases
- stylistic language
- brainstorming fragments
- temporary drafting language
- speculative references

### Should Remain Conversation

The following should usually stay as conversation content, not entity records:

- transient discussion
- informal back-and-forth reasoning
- one-off questions
- draft phrasing
- tentative suggestions

### Should Remain Memory

The following usually belong in memory rather than becoming entities:

- stable constraints
- durable user preferences
- project decisions
- session orientation summaries
- facts worth retrieval but not identity

Decision is the clearest example of something that should remain a typed memory for now, even if it later participates in entity relationships.

### Should Remain Metadata

The following often belong as metadata rather than entities:

- importance score
- recency score
- momentum score
- project health score
- dashboard ranking position
- source conversation id
- retrieval similarity
- last summarized message id

These are signals about entities, not entities themselves.

### Specific Anti-patterns to Avoid

Do not create an entity for:

- every extracted noun
- every document filename
- every conversation topic
- every memory title
- every recommendation
- every dashboard card label

The threshold should be:

- durable
- referable
- reusable across contexts
- operationally meaningful

If something is not durable, referable, reusable, and meaningful, it should remain text, memory, or metadata.

---

## Recommended v1 Direction

Entity Intelligence v1 should begin conceptually with this stack:

1. Preserve the current project-first core.
2. Treat existing project-linked records as the first entity anchors.
3. Distinguish clearly between entities, memories, derived signals, and generated suggestions.
4. Introduce durable non-project entities only when their operational value is clear.
5. Avoid premature schema expansion until the identity model is stable.

The current platform already has the right foundation:

- project-scoped storage
- durable memory forms
- session summarization
- rule-based intelligence
- dashboard aggregation

Entity Intelligence v1 should formalize the ontology before formalizing the schema.

That is the safest way to prepare for:

- Project DNA
- Project Timeline
- Knowledge Graph
- Specialist AI Agents
- Automation