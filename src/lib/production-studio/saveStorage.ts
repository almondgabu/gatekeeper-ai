export type ProductionStudioStepId =
  | "creative-brief"
  | "scene-planner"
  | "visual-prompt-builder"
  | "animation-prompt-builder"
  | "review"
  | "export-prompts";

export type ProductionStudioBrief = {
  projectTitle: string;
  platform: string;
  audience: string;
  goal: string;
  tone: string;
  hook: string;
  cta: string;
  targetVideoLength: string;
};

export type ProductionStudioScene = {
  id: string;
  sceneLabel: string;
  beat: string;
  purpose: string;
  duration: string;
  visual: string;
  camera: string;
  movement: string;
  imagePrompt: string;
  animationPrompt: string;
};

export type ProductionStudioCreativeDirection = {
  title: string;
  goal: string;
  viewerEmotion: Array<"Curiosity" | "Trust" | "Fear" | "Confidence" | "Relief">;
  narration: string;
  visualDescription: string;
  animationChecklist: string[];
  directorNotes: string;
  visualConcept: string;
  mood: string[];
  composition: string;
  lens: string;
  lighting: string;
  colorPalette: string;
  cameraPosition: string;
};

export type ProductionStudioReferenceItem = {
  id: string;
  title: string;
  description: string;
  source: string;
  addedAt: string;
};

export type ProductionStudioGenerationMetadata = {
  resolution: string;
  aspectRatio: string;
  generationTime: string;
  modelUsed: string;
  timestamp: string;
  promptVersion: string;
};

export type ProductionStudioGeneratedImageAsset = {
  id: string;
  sceneId: string;
  label: string;
  provider?: string;
  thumbnailUrl?: string | null;
  width?: number;
  height?: number;
  createdAt?: string;
  imageUrl: string;
  universalPrompt: string;
  aiUsed: string;
  favorite: boolean;
  isMaster: boolean;
  metadata: ProductionStudioGenerationMetadata;
};

export type ProductionStudioMasterImageSelection = {
  sceneId: string;
  masterImageId?: string;
  masterImage: string;
  masterPrompt: string;
  provider?: string;
  resolution?: string;
  createdAt?: string;
  generationMetadata: ProductionStudioGenerationMetadata;
};

export type ProductionStudioAnimationDirectorInput = {
  sceneId: string;
  projectMetadata: {
    projectName: string;
    platform: string;
    targetDuration: string;
  };
  sceneData: ProductionStudioScene;
  creativeDirection: ProductionStudioCreativeDirection;
  universalPrompt: string;
  masterImageSelection: ProductionStudioMasterImageSelection;
};

export type ProductionStudioFutureAssets = {
  images: string[];
  videos: string[];
  animationPrompts: string[];
  voiceScripts: string[];
  audio: string[];
  subtitles: string[];
  exports: string[];
  generatedImages?: ProductionStudioGeneratedImageAsset[];
  masterImageSelection?: ProductionStudioMasterImageSelection | null;
  animationDirectorInput?: ProductionStudioAnimationDirectorInput | null;
};

export type ProductionStudioVersionSnapshot = {
  id: string;
  name: string;
  createdAt: string;
  author: string;
  productionScore: number;
  approved: boolean;
  snapshot: {
    projectName: string;
    createdAt: string;
    updatedAt: string;
    currentStep: ProductionStudioStepId;
    productionStatus: string;
    platform: string;
    targetDuration: string;
    thumbnailPlaceholder: string;
    brief: ProductionStudioBrief;
    scenes: ProductionStudioScene[];
    creativeDirection: Record<string, ProductionStudioCreativeDirection>;
    referenceBoard: Record<string, ProductionStudioReferenceItem[]>;
    futureAssets: ProductionStudioFutureAssets;
  };
};

export type ProductionStudioSaveRecord = {
  id: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  currentStep: ProductionStudioStepId;
  productionStatus: string;
  platform: string;
  targetDuration: string;
  thumbnailPlaceholder: string;
  brief: ProductionStudioBrief;
  scenes: ProductionStudioScene[];
  creativeDirection: Record<string, ProductionStudioCreativeDirection>;
  referenceBoard: Record<string, ProductionStudioReferenceItem[]>;
  versionHistory: ProductionStudioVersionSnapshot[];
  futureAssets: ProductionStudioFutureAssets;
};

const STORAGE_KEY = "gatekeeper-production-studio-save";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function nowIsoString() {
  return new Date().toISOString();
}

function isBrief(value: unknown): value is ProductionStudioBrief {
  return (
    isObject(value) &&
    typeof value.projectTitle === "string" &&
    typeof value.platform === "string" &&
    typeof value.audience === "string" &&
    typeof value.goal === "string" &&
    typeof value.tone === "string" &&
    typeof value.hook === "string" &&
    typeof value.cta === "string" &&
    typeof value.targetVideoLength === "string"
  );
}

function isScene(value: unknown): value is ProductionStudioScene {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.sceneLabel === "string" &&
    typeof value.beat === "string" &&
    typeof value.purpose === "string" &&
    typeof value.duration === "string" &&
    typeof value.visual === "string" &&
    typeof value.camera === "string" &&
    typeof value.movement === "string" &&
    typeof value.imagePrompt === "string" &&
    typeof value.animationPrompt === "string"
  );
}

function isCreativeDirection(value: unknown): value is ProductionStudioCreativeDirection {
  return (
    isObject(value) &&
    typeof value.title === "string" &&
    typeof value.goal === "string" &&
    Array.isArray(value.viewerEmotion) &&
    typeof value.narration === "string" &&
    typeof value.visualDescription === "string" &&
    Array.isArray(value.animationChecklist) &&
    typeof value.directorNotes === "string" &&
    typeof value.visualConcept === "string" &&
    Array.isArray(value.mood) &&
    typeof value.composition === "string" &&
    typeof value.lens === "string" &&
    typeof value.lighting === "string" &&
    typeof value.colorPalette === "string" &&
    typeof value.cameraPosition === "string"
  );
}

function isReferenceItem(value: unknown): value is ProductionStudioReferenceItem {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.source === "string" &&
    typeof value.addedAt === "string"
  );
}

function isFutureAssets(value: unknown): value is ProductionStudioFutureAssets {
  if (!isObject(value)) {
    return false;
  }

  const hasRequiredArrays =
    Array.isArray(value.images) &&
    Array.isArray(value.videos) &&
    Array.isArray(value.animationPrompts) &&
    Array.isArray(value.voiceScripts) &&
    Array.isArray(value.audio) &&
    Array.isArray(value.subtitles) &&
    Array.isArray(value.exports);

  if (!hasRequiredArrays) {
    return false;
  }

  const generatedImages = value.generatedImages;
  if (
    generatedImages !== undefined &&
    !(
      Array.isArray(generatedImages) &&
      generatedImages.every((item) => (
        isObject(item) &&
        typeof item.id === "string" &&
        typeof item.sceneId === "string" &&
        typeof item.label === "string" &&
        (item.provider === undefined || typeof item.provider === "string") &&
        (item.thumbnailUrl === undefined || item.thumbnailUrl === null || typeof item.thumbnailUrl === "string") &&
        (item.width === undefined || typeof item.width === "number") &&
        (item.height === undefined || typeof item.height === "number") &&
        (item.createdAt === undefined || typeof item.createdAt === "string") &&
        typeof item.imageUrl === "string" &&
        typeof item.universalPrompt === "string" &&
        typeof item.aiUsed === "string" &&
        typeof item.favorite === "boolean" &&
        typeof item.isMaster === "boolean" &&
        isObject(item.metadata) &&
        typeof item.metadata.resolution === "string" &&
        typeof item.metadata.aspectRatio === "string" &&
        typeof item.metadata.generationTime === "string" &&
        typeof item.metadata.modelUsed === "string" &&
        typeof item.metadata.timestamp === "string" &&
        typeof item.metadata.promptVersion === "string"
      ))
    )
  ) {
    return false;
  }

  const masterImageSelection = value.masterImageSelection;
  if (
    masterImageSelection !== undefined &&
    !(
      masterImageSelection === null ||
      (
        isObject(masterImageSelection) &&
        typeof masterImageSelection.sceneId === "string" &&
        (masterImageSelection.masterImageId === undefined || typeof masterImageSelection.masterImageId === "string") &&
        typeof masterImageSelection.masterImage === "string" &&
        typeof masterImageSelection.masterPrompt === "string" &&
        (masterImageSelection.provider === undefined || typeof masterImageSelection.provider === "string") &&
        (masterImageSelection.resolution === undefined || typeof masterImageSelection.resolution === "string") &&
        (masterImageSelection.createdAt === undefined || typeof masterImageSelection.createdAt === "string") &&
        isObject(masterImageSelection.generationMetadata) &&
        typeof masterImageSelection.generationMetadata.resolution === "string" &&
        typeof masterImageSelection.generationMetadata.aspectRatio === "string" &&
        typeof masterImageSelection.generationMetadata.generationTime === "string" &&
        typeof masterImageSelection.generationMetadata.modelUsed === "string" &&
        typeof masterImageSelection.generationMetadata.timestamp === "string" &&
        typeof masterImageSelection.generationMetadata.promptVersion === "string"
      )
    )
  ) {
    return false;
  }

  const animationDirectorInput = value.animationDirectorInput;
  if (
    animationDirectorInput !== undefined &&
    !(
      animationDirectorInput === null ||
      (
        isObject(animationDirectorInput) &&
        typeof animationDirectorInput.sceneId === "string" &&
        isObject(animationDirectorInput.projectMetadata) &&
        typeof animationDirectorInput.projectMetadata.projectName === "string" &&
        typeof animationDirectorInput.projectMetadata.platform === "string" &&
        typeof animationDirectorInput.projectMetadata.targetDuration === "string" &&
        isScene(animationDirectorInput.sceneData) &&
        isCreativeDirection(animationDirectorInput.creativeDirection) &&
        typeof animationDirectorInput.universalPrompt === "string" &&
        isObject(animationDirectorInput.masterImageSelection) &&
        typeof animationDirectorInput.masterImageSelection.sceneId === "string" &&
        (animationDirectorInput.masterImageSelection.masterImageId === undefined || typeof animationDirectorInput.masterImageSelection.masterImageId === "string") &&
        typeof animationDirectorInput.masterImageSelection.masterImage === "string" &&
        typeof animationDirectorInput.masterImageSelection.masterPrompt === "string" &&
        (animationDirectorInput.masterImageSelection.provider === undefined || typeof animationDirectorInput.masterImageSelection.provider === "string") &&
        (animationDirectorInput.masterImageSelection.resolution === undefined || typeof animationDirectorInput.masterImageSelection.resolution === "string") &&
        (animationDirectorInput.masterImageSelection.createdAt === undefined || typeof animationDirectorInput.masterImageSelection.createdAt === "string") &&
        isObject(animationDirectorInput.masterImageSelection.generationMetadata) &&
        typeof animationDirectorInput.masterImageSelection.generationMetadata.resolution === "string" &&
        typeof animationDirectorInput.masterImageSelection.generationMetadata.aspectRatio === "string" &&
        typeof animationDirectorInput.masterImageSelection.generationMetadata.generationTime === "string" &&
        typeof animationDirectorInput.masterImageSelection.generationMetadata.modelUsed === "string" &&
        typeof animationDirectorInput.masterImageSelection.generationMetadata.timestamp === "string" &&
        typeof animationDirectorInput.masterImageSelection.generationMetadata.promptVersion === "string"
      )
    )
  ) {
    return false;
  }

  return true;
}

function isVersionSnapshot(value: unknown): value is ProductionStudioVersionSnapshot {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.author === "string" &&
    typeof value.productionScore === "number" &&
    typeof value.approved === "boolean" &&
    isObject(value.snapshot) &&
    typeof value.snapshot.projectName === "string" &&
    typeof value.snapshot.createdAt === "string" &&
    typeof value.snapshot.updatedAt === "string" &&
    typeof value.snapshot.currentStep === "string" &&
    typeof value.snapshot.productionStatus === "string" &&
    typeof value.snapshot.platform === "string" &&
    typeof value.snapshot.targetDuration === "string" &&
    typeof value.snapshot.thumbnailPlaceholder === "string" &&
    isBrief(value.snapshot.brief) &&
    Array.isArray(value.snapshot.scenes) &&
    value.snapshot.scenes.every(isScene) &&
    isObject(value.snapshot.creativeDirection) &&
    isObject(value.snapshot.referenceBoard) &&
    isFutureAssets(value.snapshot.futureAssets)
  );
}

function isRecordOfArrays(value: unknown): value is Record<string, ProductionStudioReferenceItem[]> {
  if (!isObject(value)) {
    return false;
  }

  return Object.values(value).every((entry) => Array.isArray(entry) && entry.every(isReferenceItem));
}

function isSaveRecord(value: unknown): value is ProductionStudioSaveRecord {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.projectName === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    typeof value.currentStep === "string" &&
    typeof value.productionStatus === "string" &&
    typeof value.platform === "string" &&
    typeof value.targetDuration === "string" &&
    typeof value.thumbnailPlaceholder === "string" &&
    isBrief(value.brief) &&
    Array.isArray(value.scenes) &&
    value.scenes.every(isScene) &&
    isObject(value.creativeDirection) &&
    Object.values(value.creativeDirection).every(isCreativeDirection) &&
    isRecordOfArrays(value.referenceBoard) &&
    Array.isArray(value.versionHistory) &&
    value.versionHistory.every(isVersionSnapshot) &&
    isFutureAssets(value.futureAssets)
  );
}

function loadAllRecords(): ProductionStudioSaveRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    const validRecords = parsed.filter(isSaveRecord);

    if (validRecords.length !== parsed.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validRecords));
    }

    return validRecords.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error("Failed to read production studio save data:", error);
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function writeAllRecords(records: ProductionStudioSaveRecord[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error("Failed to write production studio save data:", error);
    throw error;
  }
}

export function loadProductionStudioRecord(): ProductionStudioSaveRecord | null {
  return loadAllRecords()[0] ?? null;
}

export function saveProductionStudioRecord(record: ProductionStudioSaveRecord): ProductionStudioSaveRecord {
  const normalized: ProductionStudioSaveRecord = {
    ...record,
    updatedAt: nowIsoString(),
  };

  const records = loadAllRecords();
  const index = records.findIndex((item) => item.id === normalized.id);

  if (index >= 0) {
    records[index] = normalized;
  } else {
    records.unshift(normalized);
  }

  writeAllRecords(records);
  return normalized;
}

export function createProductionStudioRecordId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}`;
}

export function createProductionStudioVersionSnapshot(params: {
  name: string;
  author: string;
  productionScore: number;
  approved: boolean;
  snapshot: ProductionStudioVersionSnapshot["snapshot"];
}): ProductionStudioVersionSnapshot {
  return {
    id: createProductionStudioRecordId(),
    name: params.name,
    createdAt: nowIsoString(),
    author: params.author,
    productionScore: params.productionScore,
    approved: params.approved,
    snapshot: params.snapshot,
  };
}
