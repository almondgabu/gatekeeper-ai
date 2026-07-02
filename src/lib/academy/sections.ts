import { quickStartChecklist } from "./quickStart";
import { workflowPhases } from "./workflowGuide";
import { developerStructure, developerStandards, qaProcess } from "./developerGuide";
import { academyFaq } from "./faq";
import { releaseTimeline } from "./releaseNotes";
import type { AcademySection } from "./types";

const workflowCards = workflowPhases.map((phase) => ({
  title: phase.phase,
  body: [
    `Purpose: ${phase.purpose}`,
    `Input: ${phase.input}`,
    `Output: ${phase.output}`,
    `Approval Gate: ${phase.approvalGate}`,
    `Artifact: ${phase.artifact}`,
    `Next Consumer: ${phase.nextConsumer}`,
  ],
}));

export const academySections: AcademySection[] = [
  {
    id: "welcome",
    title: "Welcome",
    keywords: ["version", "creative operating system", "introduction", "what is gatekeeper ai"],
    blocks: [
      {
        kind: "paragraph",
        text: "Gatekeeper AI | Version 1.0 | Creative Operating System",
      },
      {
        kind: "paragraph",
        text: "Gatekeeper AI is an AI Creative Director that plans strategy, structures production work, and guides publishing and intelligence loops.",
      },
      {
        kind: "list",
        items: [
          "Gatekeeper AI plans creative work and campaign flow.",
          "It does not render final media directly.",
          "It does not auto-publish directly to social channels.",
          "It orchestrates the complete creator workflow from idea to intelligence.",
        ],
      },
    ],
  },
  {
    id: "quick-start",
    title: "Quick Start",
    keywords: ["start", "checklist", "onboarding", "first campaign"],
    blocks: [
      {
        kind: "steps",
        items: quickStartChecklist,
      },
    ],
  },
  {
    id: "user-guide",
    title: "User Guide",
    keywords: ["getting started", "saving work", "tips", "troubleshooting", "creator"],
    blocks: [
      {
        kind: "cards",
        cards: [
          {
            title: "Getting Started",
            body: [
              "Begin with AI Idea Explorer and define one clear campaign objective.",
              "Move forward phase by phase only after approval confirmation.",
            ],
          },
          {
            title: "Creating a Project",
            body: [
              "Set a clear topic, audience, and expected result early.",
              "Keep campaign scope focused to one primary message.",
            ],
          },
          {
            title: "Using Each Phase",
            body: [
              "Treat each phase as a decision checkpoint with one primary task.",
              "Only approved output should flow to the next module.",
            ],
          },
          {
            title: "Saving Work",
            body: [
              "Use save controls regularly before major transitions.",
              "Use approval gates as your stable handoff points.",
            ],
          },
          {
            title: "Workflow Tips",
            body: [
              "Avoid rewriting previous approved artifacts unless strategy changed.",
              "Use the inherited context blocks as your source of truth.",
            ],
          },
          {
            title: "Troubleshooting",
            body: [
              "If context appears missing, revisit prior approval gate and reconfirm output.",
              "If payload copy fails, continue with dispatch and use manual paste fallback.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "workflow-guide",
    title: "Workflow Guide",
    keywords: ["phase", "approval gate", "artifact", "consumer", "workflow"],
    blocks: [
      {
        kind: "cards",
        cards: workflowCards,
      },
    ],
  },
  {
    id: "system-blueprint",
    title: "System Blueprint",
    keywords: ["architecture", "bridge", "ledger", "creator journey", "integration"],
    blocks: [
      {
        kind: "paragraph",
        text: "Product Vision: one continuous creator lifecycle with approval-based handoffs and zero internal copy/paste.",
      },
      {
        kind: "pairs",
        rows: [
          {
            label: "Architecture",
            value: "Module-based workflow with local editing state and milestone handoff ledger.",
          },
          {
            label: "Workflow Bridge",
            value: "Browser-side transport for approved artifacts only.",
          },
          {
            label: "MasterProjectRecord",
            value: "Immutable milestone ledger for p1 through p6 artifact continuity.",
          },
          {
            label: "Approval Gates",
            value: "Each phase closes with explicit approval before downstream consumption.",
          },
          {
            label: "Creator Journey",
            value: "Idea -> Content -> Viral Review -> Production -> Publishing -> Intelligence -> Next Idea.",
          },
        ],
      },
      {
        kind: "paragraph",
        text: "Flow Diagram: p1_idea -> p2_content -> p3_viralReview -> p4_production -> p5_publishing -> p6_intelligence -> next p1_idea",
      },
    ],
  },
  {
    id: "developer-guide",
    title: "Developer Guide",
    keywords: ["project structure", "state management", "standards", "qa", "build", "deployment"],
    blocks: [
      {
        kind: "cards",
        cards: [
          {
            title: "Project Structure",
            body: developerStructure,
          },
          {
            title: "Coding Standards",
            body: developerStandards,
          },
          {
            title: "QA and Build Process",
            body: qaProcess,
          },
          {
            title: "Deployment Notes",
            body: [
              "Treat build success and workflow QA as release gates.",
              "Deploy only after approval-gate wording and continuity checks pass.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "api-integrations",
    title: "API & Integrations",
    keywords: ["gpt", "sora", "google flow", "suno", "udio", "integration"],
    blocks: [
      {
        kind: "cards",
        cards: [
          {
            title: "GPT-5.5",
            body: [
              "Purpose: strategic and structured content reasoning.",
              "Current Status: active in planning and guidance surfaces.",
              "Usage: prompts, strategy framing, and refinement.",
              "Notes: keep prompts explicit and phase-scoped.",
              "Future Expansion: deeper campaign pattern extraction.",
            ],
          },
          {
            title: "GPT Image",
            body: [
              "Purpose: image concept generation from approved prompts.",
              "Current Status: integrated as optional production path.",
              "Usage: reference frame generation before motion stage.",
              "Notes: preserve composition continuity.",
              "Future Expansion: richer batch controls.",
            ],
          },
          {
            title: "OpenAI Sora",
            body: [
              "Purpose: external motion rendering target.",
              "Current Status: prompt export workflow ready.",
              "Usage: run approved animation prompts externally.",
              "Notes: final rendering stays outside Gatekeeper AI.",
              "Future Expansion: stronger template presets.",
            ],
          },
          {
            title: "Google Flow",
            body: [
              "Purpose: cinematic motion rendering pipeline.",
              "Current Status: prompt-ready export path supported.",
              "Usage: render from approved manifest and motion direction.",
              "Notes: retain scene continuity from master frames.",
              "Future Expansion: renderer-specific optimization packs.",
            ],
          },
          {
            title: "Suno",
            body: [
              "Purpose: music and audio blueprint generation.",
              "Current Status: manual prompt copy workflow.",
              "Usage: produce track drafts from acoustic direction.",
              "Notes: human review remains mandatory.",
              "Future Expansion: style profile libraries.",
            ],
          },
          {
            title: "Udio",
            body: [
              "Purpose: alternate audio generation pipeline.",
              "Current Status: manual prompt copy workflow.",
              "Usage: generate audio concepts from voice and tone goals.",
              "Notes: keep output aligned with campaign tone.",
              "Future Expansion: reusable voice mood packs.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "design-system",
    title: "Design System",
    keywords: ["typography", "spacing", "buttons", "cards", "forms", "responsive", "cta"],
    blocks: [
      {
        kind: "pairs",
        rows: [
          { label: "Typography", value: "Hierarchy first, readable long-form docs, strong heading rhythm." },
          { label: "Spacing", value: "Consistent vertical cadence with generous reading gutters." },
          { label: "Buttons", value: "One dominant action style and clear focus states." },
          { label: "Cards", value: "Lightweight content containers with minimal chrome." },
          { label: "Forms", value: "Accessible labels, sufficient contrast, clear placeholder intent." },
          { label: "Responsive Rules", value: "Desktop two-column docs, mobile single-column flow." },
          { label: "Color Usage", value: "High contrast text with restrained accent usage." },
          { label: "Approval Gates", value: "One screen -> one primary task -> one primary CTA." },
        ],
      },
    ],
  },
  {
    id: "product-philosophy",
    title: "Product Philosophy",
    keywords: ["is", "is not", "creative director", "planner", "assistant", "engine"],
    blocks: [
      {
        kind: "cards",
        cards: [
          {
            title: "Gatekeeper AI IS",
            body: [
              "AI Creative Director: turns intent into structured campaign plans.",
              "Production Planner: converts strategy into execution-ready manifests.",
              "Publishing Assistant: prepares dispatch payloads with context.",
              "Strategic Intelligence Engine: carries campaign learnings into the next cycle.",
            ],
          },
          {
            title: "Gatekeeper AI IS NOT",
            body: [
              "Video Renderer: rendering belongs to dedicated external tools.",
              "Image Renderer: image generation can be assisted but is not the product core.",
              "Auto Publisher: manual dispatch is intentional for control and compliance.",
              "Analytics Dashboard: intelligence is strategic guidance, not BI replacement.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "best-practices",
    title: "Best Practices",
    keywords: ["hooks", "storytelling", "facebook", "prompt writing", "drone", "mistakes", "regional marketing"],
    blocks: [
      {
        kind: "details",
        items: [
          {
            title: "Writing Better Hooks",
            points: [
              "Lead with one urgent viewer problem.",
              "Keep first line concrete and outcome-focused.",
              "Avoid vague intro language.",
            ],
          },
          {
            title: "Property Storytelling",
            points: [
              "Use location-specific proof points.",
              "Move from risk to clarity to action.",
              "Close with one decisive CTA.",
            ],
          },
          {
            title: "Facebook Optimization",
            points: [
              "Front-load relevance within first sentence.",
              "Use concise spacing for readability.",
              "Keep CTA explicit and friction-light.",
            ],
          },
          {
            title: "Prompt Writing",
            points: [
              "Describe intent, framing, and continuity constraints.",
              "Preserve approved scene identity across revisions.",
              "Avoid contradictory camera and lighting directions.",
            ],
          },
          {
            title: "Drone Video Planning",
            points: [
              "Define altitude, path, and reveal timing before generation.",
              "Anchor transitions around subject and geography.",
              "Maintain safe, legible motion pacing.",
            ],
          },
          {
            title: "Common Mistakes",
            points: [
              "Skipping approval gates before handoff.",
              "Rewriting approved artifacts in downstream phases.",
              "Using multiple competing CTAs in one output.",
            ],
          },
          {
            title: "Regional Marketing Tips",
            points: [
              "Reference local context, access, and practical buyer concerns.",
              "Use culturally familiar language and examples.",
              "Prioritize trust-building over hype.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "faq",
    title: "FAQ",
    keywords: ["questions", "workflow bridge", "masterprojectrecord", "google flow", "sora", "publishing"],
    blocks: [
      {
        kind: "faq",
        items: academyFaq,
      },
    ],
  },
  {
    id: "release-notes",
    title: "Release Notes",
    keywords: ["version", "timeline", "completed", "changes"],
    blocks: [
      {
        kind: "timeline",
        items: releaseTimeline,
      },
    ],
  },
  {
    id: "future-roadmap",
    title: "Future Roadmap",
    keywords: ["v1.1", "v2", "enterprise", "ai memory", "collaboration"],
    blocks: [
      {
        kind: "cards",
        cards: [
          {
            title: "Completed Work",
            body: [
              "Version 1.0 workflow integration and approval-ledger continuity.",
              "Production, publishing, and intelligence cycle completion.",
            ],
          },
          {
            title: "Version 1.1",
            body: [
              "Gatekeeper Academy knowledge center.",
              "Operational onboarding maturity.",
            ],
          },
          {
            title: "Version 2",
            body: [
              "Extended memory and enterprise operations.",
              "Team collaboration and governance layers.",
            ],
          },
          {
            title: "Enterprise",
            body: [
              "Policy controls and workspace governance.",
              "Audit-ready delivery process enhancements.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "support-feedback",
    title: "Support & Feedback",
    keywords: ["support", "bugs", "feature requests", "known issues", "contact"],
    blocks: [
      {
        kind: "cards",
        cards: [
          {
            title: "Bug Reports",
            body: [
              "Include route, phase, and expected versus actual behavior.",
              "Attach reproduction steps and screenshots when possible.",
            ],
          },
          {
            title: "Feature Requests",
            body: [
              "Describe user problem first, then suggested behavior.",
              "Specify which phase or artifact is impacted.",
            ],
          },
          {
            title: "Known Issues",
            body: [
              "Track current product limitations with clear status labels.",
              "Separate confirmed blockers from low-impact issues.",
            ],
          },
          {
            title: "Contact",
            body: [
              "Product Team: product@gatekeeper.local",
              "Engineering Team: engineering@gatekeeper.local",
              "Support Desk: support@gatekeeper.local",
            ],
          },
        ],
      },
    ],
  },
];
