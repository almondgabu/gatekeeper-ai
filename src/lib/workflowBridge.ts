type WorkflowBridgeContentStudioPayload = {
  title: string;
  summary: string;
  contentType: string;
  platform: string;
  topic: string;
  tone: string;
  language: string;
  goal: string;
  storyStyle: string;
  presentationStyle: string;
  durationSeconds: number;
  sceneCount: number;
  productionLevel: string;
  caption: string;
  cta: string;
  hashtags: string;
};

type WorkflowBridgeP1IdeaPayload = {
  creativeBrief: string;
  topic: string;
  objective: string;
  audience: string;
  platform: string;
  language: string;
  approvedAt: string;
  status: "brief-approved";
};

type WorkflowBridgeP2ContentPayload = {
  title: string;
  hook: string;
  caption: string;
  cta: string;
  hashtags: string;
  platform: string;
  approvedAt: string;
  status: "content-ready";
};

type WorkflowBridgeContentBlueprint = {
  opening: string;
  problem: string;
  evidence: string;
  solution: string;
  callToAction: string;
};

type WorkflowBridgeViralScannerPayload = {
  projectName: string;
  platform: string;
  originalReferenceLink: string;
  manualDescription: string;
  analysisSummary: string;
  contentBlueprint: WorkflowBridgeContentBlueprint;
  learningPoints: string[];
  selectedCreativeDirection: string;
  generatedStrategy: {
    strategySummary: string;
    hookDirection: string;
    audience: string;
    tone: string;
    storyStructure: string;
    ctaDirection: string;
    visualStyleRecommendation: string;
  };
  currentStep: string;
  sourceContentTitle: string;
  sourceContentSummary: string;
  sourceContentCaption: string;
  sourceContentCta: string;
  sourceContentHashtags: string;
  approvedAt?: string;
  viralScore?: number;
  optimizationNotes?: string;
};

type WorkflowBridgeP3ViralReviewPayload = {
  approvedCaption: string;
  viralScore: number;
  optimizationNotes: string;
  platform: string;
  selectedCreativeDirection: string;
  approvedAt: string;
  status: "content-approved-for-production";
};

type WorkflowBridgeIdeaExplorerPayload = {
  topic?: string;
};

type WorkflowBridgeContentCreatorPayload = {
  caption?: string;
  targetPlatform?: string;
};

type WorkflowBridgeP4ProductionPayload = {
  projectTitle?: string;
  targetPlatform?: string;
  approvedCaption?: string;
  productionManifestMarkdown?: string;
  productionManifestUpdatedAt?: string;
  approvedManifest?: string;
  productionMetadata?: string;
  status: "manifest-ready";
};

type WorkflowBridgeP5PublishingPayload = {
  dispatchedAt: string;
  selectedChannel: "facebook-core" | "instagram-reels" | "tiktok-business";
  selectedChannelLabel: string;
  dispatchedPayload: string;
  sourceManifestMarkdown?: string;
  sourceManifestSummary?: string;
  sourceCaption?: string;
  productionMetadata?: string;
  status: "payload-dispatched";
};

type WorkflowBridgeP6IntelligencePayload = {
  intelligenceSummary: string;
  optimizationTokens: string;
  bestPerformingPatterns: string;
  regionalLearnings: string;
  nextCampaignSeed: string;
  finalizedAt: string;
  status: "intelligence-complete";
};

export type WorkflowBridgeRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  p1_idea?: WorkflowBridgeP1IdeaPayload;
  p2_content?: WorkflowBridgeP2ContentPayload;
  p3_viralReview?: WorkflowBridgeP3ViralReviewPayload;
  p4_production?: WorkflowBridgeP4ProductionPayload;
  p5_publishing?: WorkflowBridgeP5PublishingPayload;
  p6_intelligence?: WorkflowBridgeP6IntelligencePayload;

  // Legacy compatibility fields that are still used by existing pages.
  ideaExplorer?: WorkflowBridgeIdeaExplorerPayload;
  contentCreator?: WorkflowBridgeContentCreatorPayload;
  contentStudio?: WorkflowBridgeContentStudioPayload;
  viralScanner?: WorkflowBridgeViralScannerPayload;
};

export type MasterProjectRecord = WorkflowBridgeRecord;

export type WorkflowBridgeProductionBrief = {
  projectTitle: string;
  platform: string;
  audience: string;
  goal: string;
  tone: string;
  hook: string;
  cta: string;
  targetVideoLength: string;
};

const STORAGE_KEY = "gatekeeper-workflow-bridge";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isContentStudioPayload(value: unknown): value is WorkflowBridgeContentStudioPayload {
  return (
    isObject(value) &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    typeof value.contentType === "string" &&
    typeof value.platform === "string" &&
    typeof value.topic === "string" &&
    typeof value.tone === "string" &&
    typeof value.language === "string" &&
    typeof value.goal === "string" &&
    typeof value.storyStyle === "string" &&
    typeof value.presentationStyle === "string" &&
    typeof value.durationSeconds === "number" &&
    typeof value.sceneCount === "number" &&
    typeof value.productionLevel === "string" &&
    typeof value.caption === "string" &&
    typeof value.cta === "string" &&
    typeof value.hashtags === "string"
  );
}

function isP1IdeaPayload(value: unknown): value is WorkflowBridgeP1IdeaPayload {
  return (
    isObject(value) &&
    typeof value.creativeBrief === "string" &&
    typeof value.topic === "string" &&
    typeof value.objective === "string" &&
    typeof value.audience === "string" &&
    typeof value.platform === "string" &&
    typeof value.language === "string" &&
    typeof value.approvedAt === "string" &&
    value.status === "brief-approved"
  );
}

function isP2ContentPayload(value: unknown): value is WorkflowBridgeP2ContentPayload {
  return (
    isObject(value) &&
    typeof value.title === "string" &&
    typeof value.hook === "string" &&
    typeof value.caption === "string" &&
    typeof value.cta === "string" &&
    typeof value.hashtags === "string" &&
    typeof value.platform === "string" &&
    typeof value.approvedAt === "string" &&
    value.status === "content-ready"
  );
}

function isContentBlueprint(value: unknown): value is WorkflowBridgeContentBlueprint {
  return (
    isObject(value) &&
    typeof value.opening === "string" &&
    typeof value.problem === "string" &&
    typeof value.evidence === "string" &&
    typeof value.solution === "string" &&
    typeof value.callToAction === "string"
  );
}

function isGeneratedStrategy(value: unknown): value is WorkflowBridgeViralScannerPayload["generatedStrategy"] {
  return (
    isObject(value) &&
    typeof value.strategySummary === "string" &&
    typeof value.hookDirection === "string" &&
    typeof value.audience === "string" &&
    typeof value.tone === "string" &&
    typeof value.storyStructure === "string" &&
    typeof value.ctaDirection === "string" &&
    typeof value.visualStyleRecommendation === "string"
  );
}

function isViralScannerPayload(value: unknown): value is WorkflowBridgeViralScannerPayload {
  return (
    isObject(value) &&
    typeof value.projectName === "string" &&
    typeof value.platform === "string" &&
    typeof value.originalReferenceLink === "string" &&
    typeof value.manualDescription === "string" &&
    typeof value.analysisSummary === "string" &&
    isContentBlueprint(value.contentBlueprint) &&
    isStringArray(value.learningPoints) &&
    typeof value.selectedCreativeDirection === "string" &&
    isGeneratedStrategy(value.generatedStrategy) &&
    typeof value.currentStep === "string" &&
    typeof value.sourceContentTitle === "string" &&
    typeof value.sourceContentSummary === "string" &&
    typeof value.sourceContentCaption === "string" &&
    typeof value.sourceContentCta === "string" &&
    typeof value.sourceContentHashtags === "string" &&
    (value.approvedAt === undefined || typeof value.approvedAt === "string") &&
    (value.viralScore === undefined || typeof value.viralScore === "number") &&
    (value.optimizationNotes === undefined || typeof value.optimizationNotes === "string")
  );
}

function isP3ViralReviewPayload(value: unknown): value is WorkflowBridgeP3ViralReviewPayload {
  return (
    isObject(value) &&
    typeof value.approvedCaption === "string" &&
    typeof value.viralScore === "number" &&
    typeof value.optimizationNotes === "string" &&
    typeof value.platform === "string" &&
    typeof value.selectedCreativeDirection === "string" &&
    typeof value.approvedAt === "string" &&
    value.status === "content-approved-for-production"
  );
}

function isP4ProductionPayload(value: unknown): value is WorkflowBridgeP4ProductionPayload {
  return (
    isObject(value) &&
    value.status === "manifest-ready" &&
    (value.projectTitle === undefined || typeof value.projectTitle === "string") &&
    (value.targetPlatform === undefined || typeof value.targetPlatform === "string") &&
    (value.approvedCaption === undefined || typeof value.approvedCaption === "string") &&
    (value.productionManifestMarkdown === undefined || typeof value.productionManifestMarkdown === "string") &&
    (value.productionManifestUpdatedAt === undefined || typeof value.productionManifestUpdatedAt === "string") &&
    (value.approvedManifest === undefined || typeof value.approvedManifest === "string") &&
    (value.productionMetadata === undefined || typeof value.productionMetadata === "string")
  );
}

function isP5PublishingPayload(value: unknown): value is WorkflowBridgeP5PublishingPayload {
  return (
    isObject(value) &&
    typeof value.dispatchedAt === "string" &&
    (value.selectedChannel === "facebook-core" || value.selectedChannel === "instagram-reels" || value.selectedChannel === "tiktok-business") &&
    typeof value.selectedChannelLabel === "string" &&
    typeof value.dispatchedPayload === "string" &&
    (value.sourceManifestMarkdown === undefined || typeof value.sourceManifestMarkdown === "string") &&
    (value.sourceManifestSummary === undefined || typeof value.sourceManifestSummary === "string") &&
    (value.sourceCaption === undefined || typeof value.sourceCaption === "string") &&
    (value.productionMetadata === undefined || typeof value.productionMetadata === "string") &&
    value.status === "payload-dispatched"
  );
}

function isP6IntelligencePayload(value: unknown): value is WorkflowBridgeP6IntelligencePayload {
  return (
    isObject(value) &&
    typeof value.intelligenceSummary === "string" &&
    typeof value.optimizationTokens === "string" &&
    typeof value.bestPerformingPatterns === "string" &&
    typeof value.regionalLearnings === "string" &&
    typeof value.nextCampaignSeed === "string" &&
    typeof value.finalizedAt === "string" &&
    value.status === "intelligence-complete"
  );
}

function isWorkflowBridgeRecord(value: unknown): value is WorkflowBridgeRecord {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    (value.p1_idea === undefined || isP1IdeaPayload(value.p1_idea)) &&
    (value.p2_content === undefined || isP2ContentPayload(value.p2_content)) &&
    (value.p3_viralReview === undefined || isP3ViralReviewPayload(value.p3_viralReview)) &&
    (value.p4_production === undefined || isP4ProductionPayload(value.p4_production)) &&
    (value.p5_publishing === undefined || isP5PublishingPayload(value.p5_publishing)) &&
    (value.p6_intelligence === undefined || isP6IntelligencePayload(value.p6_intelligence)) &&
    (value.ideaExplorer === undefined || isObject(value.ideaExplorer)) &&
    (value.contentCreator === undefined || isObject(value.contentCreator)) &&
    (value.contentStudio === undefined || isContentStudioPayload(value.contentStudio)) &&
    (value.viralScanner === undefined || isViralScannerPayload(value.viralScanner))
  );
}

function nowIsoString() {
  return new Date().toISOString();
}

function createWorkflowBridgeId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `workflow-bridge-${Date.now()}`;
}

function deriveViralScore(source?: WorkflowBridgeViralScannerPayload): number {
  if (!source) {
    return 78;
  }

  if (typeof source.viralScore === "number" && Number.isFinite(source.viralScore)) {
    return Math.max(0, Math.min(100, Math.round(source.viralScore)));
  }

  const learningWeight = source.learningPoints.length * 5;
  const hookWeight = source.generatedStrategy.hookDirection.trim() ? 10 : 0;
  const ctaWeight = source.generatedStrategy.ctaDirection.trim() ? 7 : 0;
  const base = 60 + learningWeight + hookWeight + ctaWeight;

  return Math.max(0, Math.min(98, Math.round(base)));
}

function deriveOptimizationNotes(source?: WorkflowBridgeViralScannerPayload): string {
  if (!source) {
    return "Optimization notes unavailable.";
  }

  if (source.optimizationNotes?.trim()) {
    return source.optimizationNotes.trim();
  }

  const notes = source.learningPoints.filter((item) => item.trim()).slice(0, 4);
  if (notes.length === 0) {
    return "Apply stronger hook clarity and clearer CTA sequencing for the next production pass.";
  }

  return notes.join(" | ");
}

function normalizeLegacyMilestones(record: WorkflowBridgeRecord): WorkflowBridgeRecord {
  const p1Idea = record.p1_idea ?? (
    record.contentStudio
      ? {
        creativeBrief: `${record.contentStudio.title}\n\n${record.contentStudio.summary}`,
        topic: record.contentStudio.topic,
        objective: record.contentStudio.goal,
        audience: "General audience",
        platform: record.contentStudio.platform,
        language: record.contentStudio.language,
        approvedAt: record.updatedAt,
        status: "brief-approved" as const,
      }
      : undefined
  );

  const p2Content = record.p2_content ?? (
    record.contentStudio
      ? {
        title: record.contentStudio.title,
        hook: record.contentStudio.summary.split(".")[0] || record.contentStudio.title,
        caption: record.contentStudio.caption,
        cta: record.contentStudio.cta,
        hashtags: record.contentStudio.hashtags,
        platform: record.contentStudio.platform,
        approvedAt: record.updatedAt,
        status: "content-ready" as const,
      }
      : undefined
  );

  const p3Viral = record.p3_viralReview ?? (
    record.viralScanner
      ? {
        approvedCaption: record.viralScanner.generatedStrategy.strategySummary,
        viralScore: deriveViralScore(record.viralScanner),
        optimizationNotes: deriveOptimizationNotes(record.viralScanner),
        platform: record.viralScanner.platform,
        selectedCreativeDirection: record.viralScanner.selectedCreativeDirection,
        approvedAt: record.viralScanner.approvedAt ?? record.updatedAt,
        status: "content-approved-for-production" as const,
      }
      : undefined
  );

  return {
    ...record,
    p1_idea: p1Idea,
    p2_content: p2Content,
    p3_viralReview: p3Viral,
    ideaExplorer: record.ideaExplorer ?? (p1Idea ? { topic: p1Idea.topic } : undefined),
    contentCreator: record.contentCreator ?? (p2Content ? { caption: p2Content.caption, targetPlatform: p2Content.platform } : undefined),
  };
}

export function loadWorkflowBridgeRecord(): WorkflowBridgeRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!isWorkflowBridgeRecord(parsed)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const normalized = normalizeLegacyMilestones(parsed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch (error) {
    console.error("Failed to read workflow bridge data:", error);
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveWorkflowBridgeRecord(patch: {
  p1_idea?: WorkflowBridgeP1IdeaPayload;
  p2_content?: WorkflowBridgeP2ContentPayload;
  p3_viralReview?: WorkflowBridgeP3ViralReviewPayload;
  ideaExplorer?: WorkflowBridgeIdeaExplorerPayload;
  contentCreator?: WorkflowBridgeContentCreatorPayload;
  contentStudio?: WorkflowBridgeContentStudioPayload;
  viralScanner?: WorkflowBridgeViralScannerPayload;
  p4_production?: WorkflowBridgeP4ProductionPayload;
  p5_publishing?: WorkflowBridgeP5PublishingPayload;
  p6_intelligence?: WorkflowBridgeP6IntelligencePayload;
  clearFields?: Array<"contentStudio" | "viralScanner">;
  clearMilestones?: Array<"p1_idea" | "p2_content" | "p3_viralReview" | "p4_production" | "p5_publishing" | "p6_intelligence">;
}): WorkflowBridgeRecord {
  if (typeof window === "undefined") {
    throw new Error("Workflow bridge can only be saved in the browser.");
  }

  const current = loadWorkflowBridgeRecord();
  const clearMilestones = new Set(patch.clearMilestones ?? []);

  const nextP1 = clearMilestones.has("p1_idea") ? undefined : patch.p1_idea ?? current?.p1_idea;
  const nextP2 = clearMilestones.has("p2_content") ? undefined : patch.p2_content ?? current?.p2_content;
  const nextP3 = clearMilestones.has("p3_viralReview") ? undefined : patch.p3_viralReview ?? current?.p3_viralReview;
  const nextP4 = clearMilestones.has("p4_production") ? undefined : patch.p4_production ?? current?.p4_production;
  const nextP5 = clearMilestones.has("p5_publishing") ? undefined : patch.p5_publishing ?? current?.p5_publishing;
  const nextP6 = clearMilestones.has("p6_intelligence") ? undefined : patch.p6_intelligence ?? current?.p6_intelligence;

  const nextRecord: WorkflowBridgeRecord = {
    id: current?.id ?? createWorkflowBridgeId(),
    createdAt: current?.createdAt ?? nowIsoString(),
    updatedAt: nowIsoString(),
    p1_idea: nextP1,
    p2_content: nextP2,
    p3_viralReview: nextP3,
    p4_production: nextP4,
    p5_publishing: nextP5,
    p6_intelligence: nextP6,
    ideaExplorer: patch.ideaExplorer ?? current?.ideaExplorer ?? (nextP1 ? { topic: nextP1.topic } : undefined),
    contentCreator: patch.contentCreator ?? current?.contentCreator ?? (nextP2 ? { caption: nextP2.caption, targetPlatform: nextP2.platform } : undefined),
    contentStudio: patch.clearFields?.includes("contentStudio") ? undefined : patch.contentStudio ?? current?.contentStudio,
    viralScanner: patch.clearFields?.includes("viralScanner") ? undefined : patch.viralScanner ?? current?.viralScanner,
  };

  const normalized = normalizeLegacyMilestones(nextRecord);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearWorkflowBridgeRecord(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function buildProductionBriefFromBridge(record: WorkflowBridgeRecord): WorkflowBridgeProductionBrief | null {
  const source = record.viralScanner;
  const approvedViral = record.p3_viralReview;
  const approvedContent = record.p2_content;
  const approvedIdea = record.p1_idea;

  if (!source && !approvedViral) {
    return null;
  }

  return {
    projectTitle: source?.projectName || approvedContent?.title || approvedIdea?.topic || "Gatekeeper Production Project",
    platform: approvedViral?.platform || source?.platform || approvedContent?.platform || approvedIdea?.platform || "Unknown",
    audience: source?.generatedStrategy.audience || approvedIdea?.audience || source?.sourceContentSummary || "Primary audience",
    goal: approvedViral?.optimizationNotes || source?.generatedStrategy.strategySummary || approvedIdea?.objective || source?.contentBlueprint.callToAction || "Build a clear production-ready version",
    tone: source?.generatedStrategy.tone || "Confident",
    hook: approvedViral?.approvedCaption || approvedContent?.hook || source?.generatedStrategy.hookDirection || source?.manualDescription || source?.sourceContentSummary || "Lead with the strongest hook",
    cta: approvedContent?.cta || source?.generatedStrategy.ctaDirection || source?.contentBlueprint.callToAction || "Prompt the next action",
    targetVideoLength: "30-45 seconds",
  };
}
