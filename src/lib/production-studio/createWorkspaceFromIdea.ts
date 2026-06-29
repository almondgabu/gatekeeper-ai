import { ProductionWorkspaceProject, ProductionContentType, ProductionStatus } from "@/types/production-studio";

/**
 * Inspiration idea type from the AI Idea Explorer
 * Based on the type definition in src/app/content-studio/page.tsx
 */
type InspirationIdea = {
  title: string;
  summary: string;
  bestFormat: "Normal Post" | "Reel / Video";
  potentialScore: number;
  difficulty: "Easy" | "Medium" | "Advanced";
  estimatedProductionTime: string;
  whyThisIdea: string;
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
  
  // Map best format to content type
  const contentType: ProductionContentType = mapBestFormatToContentType(idea.bestFormat);
  
  // Generate target audience from idea summary
  const targetAudience = extractTargetAudience(idea.summary);
  
  // Generate brand voice from difficulty and potential score
  const brandVoice = generateBrandVoice(idea.difficulty, idea.potentialScore);
  
  // Extract key messages from summary
  const keyMessages = extractKeyMessages(idea.summary);
  
  // Generate SEO keywords from title and summary
  const seoKeywords = generateSeoKeywords(idea.title, idea.summary);
  
  // Estimate word count from estimated production time
  const targetWordCount = estimateWordCount(idea.estimatedProductionTime);
  
  // Create the production workspace project
  const project: ProductionWorkspaceProject = {
    // Unique identifier
    id: generateUniqueId(),
    
    // Copy source fields
    name: idea.title,
    description: idea.summary,
    contentType,
    
    // Set status to draft
    status: "draft" as ProductionStatus,
    
    // Owner ID - placeholder for now
    ownerId: "current-user",
    
    // Target audience and brand voice
    targetAudience,
    brandVoice,
    
    // Key messages and SEO
    keyMessages,
    seoKeywords,
    
    // Word count target
    targetWordCount,
    
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
 * Maps AI Idea Explorer best format to Production Studio content type
 */
function mapBestFormatToContentType(bestFormat: "Normal Post" | "Reel / Video"): ProductionContentType {
  switch (bestFormat) {
    case "Reel / Video":
      return "video_script";
    case "Normal Post":
    default:
      return "social_media_post";
  }
}

/**
 * Extracts target audience from idea summary
 * Uses simple keyword matching for common audience types
 */
function extractTargetAudience(summary: string): string {
  const summaryLower = summary.toLowerCase();
  
  if (summaryLower.includes("investor") || summaryLower.includes("investment")) {
    return "Real estate investors and property developers";
  } else if (summaryLower.includes("buyer") || summaryLower.includes("purchase")) {
    return "Property buyers and home seekers";
  } else if (summaryLower.includes("seller") || summaryLower.includes("list")) {
    return "Property sellers and landowners";
  } else if (summaryLower.includes("agent") || summaryLower.includes("broker")) {
    return "Real estate agents and brokers";
  } else if (summaryLower.includes("tourist") || summaryLower.includes("travel")) {
    return "Tourists and travel enthusiasts";
  } else if (summaryLower.includes("student") || summaryLower.includes("learn")) {
    return "Students and learners";
  } else if (summaryLower.includes("business") || summaryLower.includes("entrepreneur")) {
    return "Business owners and entrepreneurs";
  } else {
    return "General audience interested in Borneo real estate";
  }
}

/**
 * Generates brand voice based on difficulty and potential score
 */
function generateBrandVoice(difficulty: "Easy" | "Medium" | "Advanced", potentialScore: number): string {
  const scoreAdjective = potentialScore >= 80 ? "high-impact" : potentialScore >= 60 ? "balanced" : "approachable";
  
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
 * Extracts key messages from idea summary
 * Splits summary into sentences and takes first 3 meaningful ones
 */
function extractKeyMessages(summary: string): string[] {
  const sentences = summary
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
 * Generates SEO keywords from title and summary
 * Extracts important words and adds real estate related terms
 */
function generateSeoKeywords(title: string, summary: string): string[] {
  const combinedText = `${title} ${summary}`.toLowerCase();
  const words = combinedText.split(/\s+/);
  
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
 * Estimates word count based on estimated production time
 */
function estimateWordCount(estimatedProductionTime: string): number {
  const timeLower = estimatedProductionTime.toLowerCase();
  
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