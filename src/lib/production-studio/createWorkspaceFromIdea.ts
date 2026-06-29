import { ProductionWorkspaceProject, ProductionContentType, ProductionStatus } from "@/types/production-studio";

/**
 * Inspiration idea type from the AI Idea Explorer
 * Based on the type definition in src/app/api/content-studio/route.ts
 */
type InspirationIdea = {
  title: string;
  hook: string;
  coreConcept: string;
  targetAudience: string;
  emotion: string;
  platform: string;
  estimatedReach: number;
  engagementPotential: number;
  difficulty: "Easy" | "Medium" | "Advanced";
  productionTime: string;
  suggestedCTA: string;
  thumbnailPrompt: string;
  keyVisualPrompt: string;
  animationPrompt?: string;
  confidenceScore: number;
  whyThisWorks: string;
};

/**
 * Creates a Production Workspace Project from an AI Idea Explorer inspiration card
 * 
 * This mapper converts inspiration ideas into editable production workspace projects
 * with sensible defaults and empty fields ready for user editing.
 * 
 * Rules followed:
 * - Generate unique id
 * - Set createdAt and updatedAt
 * - Copy source fields from inspiration idea
 * - Apply sensible fallback values where fields are missing
 * - Initialize editable production fields as empty
 * - Set status to "draft"
 * - No AI generation, API calls, or database writes
 */
export function createWorkspaceFromIdea(
  idea: InspirationIdea
): ProductionWorkspaceProject {
  const now = new Date().toISOString();
  
  // Map productionTime to content type (simplified mapping)
  const contentType: ProductionContentType = idea.platform?.toLowerCase().includes("video") 
    ? "video_script" 
    : "social_media_post";
  
  // Create the production workspace project
  const project: ProductionWorkspaceProject = {
    // Unique identifier
    id: generateUniqueId(),
    
    // Copy source fields
    name: idea.title,
    description: `${idea.hook} ${idea.coreConcept}`.trim(),
    contentType,
    
    // Set status to draft
    status: "draft" as ProductionStatus,
    
    // Owner ID - placeholder for now
    ownerId: "current-user",
    
    // Target audience and brand voice
    targetAudience: idea.targetAudience || "General audience",
    brandVoice: generateBrandVoice(idea.difficulty, idea.confidenceScore),
    
    // Key messages and SEO
    keyMessages: extractKeyMessages(idea.coreConcept),
    seoKeywords: generateSeoKeywords(idea.title, idea.coreConcept),
    
    // Word count target
    targetWordCount: estimateWordCount(idea.productionTime),
    
    // Timestamps
    createdAt: now,
    updatedAt: now,
    
    // Initialize empty content blocks
    contentBlocks: [],
    
    // Initialize empty revision history
    revisions: [],
    
    // Initialize empty collaborators
    collaborators: [],
    
    // Initialize empty tags
    tags: [],
    
    // Initialize empty references
    references: [],
    
    // Preserve source metadata from inspiration idea
    sourceMetadata: {
      hook: idea.hook,
      coreConcept: idea.coreConcept,
      whyThisWorks: idea.whyThisWorks,
      emotion: idea.emotion,
      platform: idea.platform,
      estimatedReach: idea.estimatedReach,
      engagementPotential: idea.engagementPotential,
      difficulty: idea.difficulty,
      productionTime: idea.productionTime,
      suggestedCTA: idea.suggestedCTA,
      thumbnailPrompt: idea.thumbnailPrompt,
      keyVisualPrompt: idea.keyVisualPrompt,
      animationPrompt: idea.animationPrompt,
      confidenceScore: idea.confidenceScore,
    },
    
    // Optional fields
    associatedProjectId: undefined,
    deadline: undefined,
    completedAt: undefined,
    publishedAt: undefined,
    metrics: undefined,
    aiMetadata: undefined,
  };
  
  return project;
}

/**
 * Generates brand voice based on difficulty and confidence score
 */
function generateBrandVoice(difficulty: "Easy" | "Medium" | "Advanced", confidenceScore: number): string {
  const scoreAdjective = confidenceScore >= 80 ? "high-impact" : confidenceScore >= 60 ? "balanced" : "approachable";
  
  switch (difficulty) {
    case "Easy":
      return `Simple, clear, and ${scoreAdjective} communication for broad understanding`;
    case "Medium":
      return `Professional, informative, and ${scoreAdjective} tone with moderate detail`;
    case "Advanced":
      return `Expert-level, detailed, and ${scoreAdjective} analysis for specialized audiences`;
    default:
      return `Professional and ${scoreAdjective} real estate communication`;
  }
}

/**
 * Extracts key messages from core concept
 * Splits into sentences and takes first 3 meaningful ones
 */
function extractKeyMessages(coreConcept: string): string[] {
  const sentences = coreConcept
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  
  // Take first 3 sentences or use default messages
  const extracted = sentences.slice(0, 3);
  
  if (extracted.length > 0) {
    return extracted;
  }
  
  // Fallback messages if no sentences extracted
  return [
    "Highlight unique property features and benefits",
    "Connect property value to audience needs",
    "Provide clear next steps for engagement"
  ];
}

/**
 * Generates SEO keywords from title and core concept
 * Extracts important words and adds real estate related terms
 */
function generateSeoKeywords(title: string, coreConcept: string): string[] {
  const combinedText = `${title} ${coreConcept}`.toLowerCase();
  
  // Common real estate keywords to look for
  const realEstateKeywords = [
    "property", "real estate", "land", "house", "home", "investment",
    "borneo", "sabah", "malaysia", "development", "commercial", "residential",
    "luxury", "affordable", "location", "price", "value", "opportunity"
  ];
  
  // Find keywords that appear in the text
  const foundKeywords = realEstateKeywords.filter(keyword => 
    combinedText.includes(keyword.toLowerCase())
  );
  
  // Add some default keywords if not enough found
  if (foundKeywords.length < 5) {
    foundKeywords.push("borneo real estate", "property investment", "land for sale", "real estate malaysia", "sabah property");
  }
  
  // Limit to 10 keywords
  return foundKeywords.slice(0, 10);
}

/**
 * Estimates word count based on production time
 */
function estimateWordCount(productionTime: string): number {
  const timeLower = productionTime.toLowerCase();
  
  if (timeLower.includes("quick") || timeLower.includes("short") || timeLower.includes("5") || timeLower.includes("10")) {
    return 300; // Short content
  } else if (timeLower.includes("medium") || timeLower.includes("standard") || timeLower.includes("15") || timeLower.includes("30")) {
    return 800; // Medium content
  } else if (timeLower.includes("long") || timeLower.includes("extended") || timeLower.includes("45") || timeLower.includes("60")) {
    return 1500; // Long content
  } else {
    return 500; // Default
  }
}

/**
 * Generates a unique ID for the project
 * Simple timestamp-based ID for local use
 */
function generateUniqueId(): string {
  return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}