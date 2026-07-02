import {
  type ContentCreatorModuleData,
  type ContentIntelligenceModuleData,
  type GatekeeperProject,
  type GatekeeperProjectModuleName,
  type GatekeeperProjectModules,
  type GatekeeperProjectStatus,
  type IdeaExplorerModuleData,
  type ProductionStudioModuleData,
  type PublishingModuleData,
  type ViralScannerModuleData,
} from "@/types/gatekeeper-project";

const STORAGE_KEY = "gatekeeper-projects";

export const gatekeeperProjectsStorageKey = STORAGE_KEY;

function createDefaultIdeaExplorerModuleData(): IdeaExplorerModuleData {
  return {
    lastUpdatedAt: null,
    ideas: [],
    selectedIdeaId: null,
  };
}

function createDefaultViralScannerModuleData(): ViralScannerModuleData {
  return {
    lastUpdatedAt: null,
    analysis: null,
    selectedDirection: null,
    generatedStrategy: null,
  };
}

function createDefaultContentCreatorModuleData(): ContentCreatorModuleData {
  return {
    lastUpdatedAt: null,
    draft: null,
    assets: [],
  };
}

function createDefaultProductionStudioModuleData(): ProductionStudioModuleData {
  return {
    lastUpdatedAt: null,
    workspace: null,
    scenes: [],
  };
}

function createDefaultPublishingModuleData(): PublishingModuleData {
  return {
    lastUpdatedAt: null,
    channels: [],
    scheduledItems: [],
  };
}

function createDefaultContentIntelligenceModuleData(): ContentIntelligenceModuleData {
  return {
    lastUpdatedAt: null,
    reports: [],
    insights: [],
  };
}

function createDefaultModules(): GatekeeperProjectModules {
  return {
    ideaExplorer: createDefaultIdeaExplorerModuleData(),
    viralScanner: createDefaultViralScannerModuleData(),
    contentCreator: createDefaultContentCreatorModuleData(),
    productionStudio: createDefaultProductionStudioModuleData(),
    publishing: createDefaultPublishingModuleData(),
    contentIntelligence: createDefaultContentIntelligenceModuleData(),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function nowIsoString() {
  return new Date().toISOString();
}

function safeReadAll(): GatekeeperProject[] {
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

    const valid = parsed.filter((item) => {
      if (!isObject(item)) {
        return false;
      }

      return (
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.createdAt === "string" &&
        typeof item.updatedAt === "string" &&
        typeof item.status === "string" &&
        isObject(item.modules)
      );
    }) as GatekeeperProject[];

    if (valid.length !== parsed.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }

    return valid.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error("Failed to parse gatekeeper projects:", error);
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function safeWriteAll(projects: GatekeeperProject[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to write gatekeeper projects:", error);
  }
}

export function listGatekeeperProjects(): GatekeeperProject[] {
  return safeReadAll();
}

export function getGatekeeperProject(id: string): GatekeeperProject | null {
  const projects = safeReadAll();
  return projects.find((project) => project.id === id) ?? null;
}

export function saveGatekeeperProject(project: GatekeeperProject): void {
  const projects = safeReadAll();
  const index = projects.findIndex((item) => item.id === project.id);

  const normalized: GatekeeperProject = {
    ...project,
    updatedAt: nowIsoString(),
  };

  if (index >= 0) {
    projects[index] = normalized;
  } else {
    projects.push(normalized);
  }

  safeWriteAll(projects);
}

export function deleteGatekeeperProject(id: string): void {
  const projects = safeReadAll();
  const filtered = projects.filter((project) => project.id !== id);

  if (filtered.length !== projects.length) {
    safeWriteAll(filtered);
  }
}

export function updateGatekeeperProjectModule<TName extends GatekeeperProjectModuleName>(
  projectId: string,
  moduleName: TName,
  moduleData: GatekeeperProjectModules[TName],
): GatekeeperProject | null {
  const project = getGatekeeperProject(projectId);
  if (!project) {
    return null;
  }

  const updated: GatekeeperProject = {
    ...project,
    updatedAt: nowIsoString(),
    modules: {
      ...project.modules,
      [moduleName]: moduleData,
    },
  };

  saveGatekeeperProject(updated);
  return updated;
}

export function createGatekeeperProject(initialData: {
  title: string;
  status?: GatekeeperProjectStatus;
  modules?: Partial<GatekeeperProjectModules>;
}): GatekeeperProject {
  const now = nowIsoString();

  const project: GatekeeperProject = {
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`,
    title: initialData.title.trim() || "Untitled Project",
    createdAt: now,
    updatedAt: now,
    status: initialData.status ?? "draft",
    modules: {
      ...createDefaultModules(),
      ...(initialData.modules ?? {}),
    },
  };

  saveGatekeeperProject(project);
  return project;
}
