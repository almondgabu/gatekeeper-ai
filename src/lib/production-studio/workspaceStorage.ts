import { ProductionWorkspaceProject } from "@/types/production-studio";

const STORAGE_KEY = "gatekeeper-production-workspaces";

/**
 * Saves a production workspace project to localStorage
 * Replaces existing project if the same id already exists
 */
export function saveProductionWorkspace(
  project: ProductionWorkspaceProject
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    // Load existing workspaces
    const existing = loadAllWorkspaces();
    
    // Find if project already exists
    const existingIndex = existing.findIndex(p => p.id === project.id);
    
    if (existingIndex >= 0) {
      // Update existing project
      existing[existingIndex] = project;
    } else {
      // Add new project
      existing.push(project);
    }
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error("Failed to save production workspace:", error);
  }
}

/**
 * Loads a production workspace project by ID
 * Returns null if not found or on error
 */
export function loadProductionWorkspace(
  id: string
): ProductionWorkspaceProject | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const workspaces = loadAllWorkspaces();
    return workspaces.find(project => project.id === id) || null;
  } catch (error) {
    console.error("Failed to load production workspace:", error);
    return null;
  }
}

/**
 * Loads the most recently updated production workspace project
 * Returns null if no workspaces exist or on error
 */
export function loadLatestProductionWorkspace():
  ProductionWorkspaceProject | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const workspaces = loadAllWorkspaces();
    
    if (workspaces.length === 0) {
      return null;
    }
    
    // Sort by updatedAt descending and return the first one
    return [...workspaces].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
  } catch (error) {
    console.error("Failed to load latest production workspace:", error);
    return null;
  }
}

/**
 * Lists all production workspace projects
 * Returns empty array if none exist or on error
 */
export function listProductionWorkspaces():
  ProductionWorkspaceProject[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return loadAllWorkspaces();
  } catch (error) {
    console.error("Failed to list production workspaces:", error);
    return [];
  }
}

/**
 * Deletes a production workspace project by ID
 * Does nothing if project not found
 */
export function deleteProductionWorkspace(
  id: string
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const workspaces = loadAllWorkspaces();
    const filtered = workspaces.filter(project => project.id !== id);
    
    if (filtered.length !== workspaces.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error("Failed to delete production workspace:", error);
  }
}

/**
 * Internal helper: Loads all workspaces from localStorage
 * Handles empty storage and corrupted JSON gracefully
 */
function loadAllWorkspaces(): ProductionWorkspaceProject[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    
    if (!raw) {
      return [];
    }
    
    const parsed = JSON.parse(raw);
    
    // Validate it's an array
    if (!Array.isArray(parsed)) {
      console.warn("Invalid workspace data in localStorage, resetting to empty array");
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    
    // Validate each item has required fields
    const validWorkspaces = parsed.filter(item => 
      item && 
      typeof item === "object" &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.createdAt === "string" &&
      typeof item.updatedAt === "string"
    );
    
    // If validation removed items, save cleaned version
    if (validWorkspaces.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validWorkspaces));
    }
    
    return validWorkspaces;
  } catch (error) {
    console.error("Failed to parse workspace data from localStorage:", error);
    
    // Clear corrupted data
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}