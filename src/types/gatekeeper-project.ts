export type GatekeeperProjectStatus =
  | "draft"
  | "active"
  | "in_review"
  | "ready"
  | "published"
  | "archived";

export type IdeaExplorerModuleData = {
  lastUpdatedAt: string | null;
  ideas: Array<Record<string, unknown>>;
  selectedIdeaId: string | null;
};

export type ViralScannerModuleData = {
  lastUpdatedAt: string | null;
  analysis: Record<string, unknown> | null;
  selectedDirection: string | null;
  generatedStrategy: Record<string, unknown> | null;
};

export type ContentCreatorModuleData = {
  lastUpdatedAt: string | null;
  draft: Record<string, unknown> | null;
  assets: Array<Record<string, unknown>>;
};

export type ProductionStudioModuleData = {
  lastUpdatedAt: string | null;
  workspace: Record<string, unknown> | null;
  scenes: Array<Record<string, unknown>>;
};

export type PublishingModuleData = {
  lastUpdatedAt: string | null;
  channels: Array<Record<string, unknown>>;
  scheduledItems: Array<Record<string, unknown>>;
};

export type ContentIntelligenceModuleData = {
  lastUpdatedAt: string | null;
  reports: Array<Record<string, unknown>>;
  insights: Array<Record<string, unknown>>;
};

export type GatekeeperProjectModules = {
  ideaExplorer: IdeaExplorerModuleData;
  viralScanner: ViralScannerModuleData;
  contentCreator: ContentCreatorModuleData;
  productionStudio: ProductionStudioModuleData;
  publishing: PublishingModuleData;
  contentIntelligence: ContentIntelligenceModuleData;
};

export type GatekeeperProject = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: GatekeeperProjectStatus;
  modules: GatekeeperProjectModules;
};

export type GatekeeperProjectModuleName = keyof GatekeeperProjectModules;
