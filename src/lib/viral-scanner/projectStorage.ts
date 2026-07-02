import type { ScannerStepId, StrategyDirectionId, ViralScannerAnalysis, CreativeStrategy } from "@/types/viral-scanner";

const STORAGE_KEY = "gatekeeper-viral-scanner-projects";

export type ViralScannerProject = {
  id: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  platform: string;
  originalReferenceLink: string;
  manualDescription: string;
  screenshotReference: string;
  analysis: ViralScannerAnalysis | null;
  contentBlueprint: ViralScannerAnalysis["contentBlueprint"] | null;
  learningPoints: string[];
  selectedCreativeDirection: StrategyDirectionId | null;
  generatedStrategy: CreativeStrategy | null;
  currentStep: ScannerStepId;
};

export function listViralScannerProjects(): ViralScannerProject[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return loadAllProjects();
  } catch (error) {
    console.error("Failed to list Viral Scanner projects:", error);
    return [];
  }
}

export function saveViralScannerProject(project: ViralScannerProject): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const existing = loadAllProjects();
    const existingIndex = existing.findIndex((item) => item.id === project.id);

    if (existingIndex >= 0) {
      existing[existingIndex] = project;
    } else {
      existing.push(project);
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error("Failed to save Viral Scanner project:", error);
  }
}

export function deleteViralScannerProject(id: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const existing = loadAllProjects();
    const filtered = existing.filter((item) => item.id !== id);
    if (filtered.length !== existing.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error("Failed to delete Viral Scanner project:", error);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function loadAllProjects(): ViralScannerProject[] {
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
      if (!isPlainObject(item)) {
        return false;
      }

      return (
        typeof item.id === "string" &&
        typeof item.projectName === "string" &&
        typeof item.createdAt === "string" &&
        typeof item.updatedAt === "string" &&
        typeof item.platform === "string" &&
        typeof item.originalReferenceLink === "string" &&
        typeof item.manualDescription === "string" &&
        typeof item.screenshotReference === "string" &&
        typeof item.currentStep === "string"
      );
    }) as ViralScannerProject[];

    if (valid.length !== parsed.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }

    return valid.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error("Failed to parse Viral Scanner projects:", error);
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export const viralScannerProjectStorageKey = STORAGE_KEY;
