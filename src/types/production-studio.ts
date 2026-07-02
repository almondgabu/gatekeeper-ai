/**
 * Production Studio Workspace Types
 * 
 * Flat schema optimized for local model readability and performance.
 */

/**
 * Types of content that can be produced in the Production Studio
 */
export type ProductionContentType = 
  | 'article'
  | 'blog_post'
  | 'social_media_post'
  | 'email_newsletter'
  | 'technical_documentation'
  | 'marketing_copy'
  | 'product_description'
  | 'press_release'
  | 'whitepaper'
  | 'case_study'
  | 'video_script'
  | 'podcast_script'
  | 'presentation_slides'
  | 'landing_page'
  | 'ad_copy'
  | 'faq'
  | 'tutorial'
  | 'review'
  | 'interview'
  | 'announcement';

/**
 * Status of production content items
 */
export type ProductionStatus = 
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'in_production'
  | 'published'
  | 'archived'
  | 'rejected'
  | 'scheduled';

/**
 * Creative production lifecycle status for AI Director Studio projects
 */
export type ProductionLifecycleStatus =
  | 'Planning'
  | 'Ready for Images'
  | 'Images Completed'
  | 'Ready for Video'
  | 'Video Completed'
  | 'Editing'
  | 'Ready to Publish'
  | 'Published'
  | 'Archived';

export type StoryboardSceneStatus =
  | 'Planning'
  | 'Ready for Images'
  | 'Images Completed'
  | 'Ready for Video'
  | 'Video Completed'
  | 'Editing'
  | 'Completed';

export interface StoryboardSceneDraft {
  id: string;
  sceneNumber: number;
  title: string;
  purpose: string;
  estimatedDuration: string;
  imagePrompt: string;
  videoPrompt: string;
  voiceover: string;
  directorNotes: string;
  status: StoryboardSceneStatus;
}

/**
 * Production workspace project structure
 * 
 * Flat schema optimized for local model processing with minimal nesting
 */
export interface ProductionWorkspaceProject {
  /** Unique project identifier */
  id: string;
  
  /** Project display name */
  name: string;
  
  /** Brief project description */
  description: string;
  
  /** Primary content type for this project */
  contentType: ProductionContentType;
  
  /** Current project status */
  status: ProductionStatus;
  
  /** Project owner/user ID */
  ownerId: string;
  
  /** Associated project ID from main projects system */
  associatedProjectId?: string;
  
  /** Target audience description */
  targetAudience: string;
  
  /** Brand voice/tone guidelines */
  brandVoice: string;
  
  /** Key messaging points */
  keyMessages: string[];
  
  /** SEO keywords */
  seoKeywords: string[];
  
  /** Word count target */
  targetWordCount: number;
  
  /** Deadline for completion */
  deadline?: string;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last update timestamp */
  updatedAt: string;

  /** Optional alias used by UI surfaces that prefer explicit wording */
  lastModifiedAt?: string;

  /** Optional project kind marker for local production project cards */
  projectKind?: 'production_project';

  /** Optional creative production lifecycle status */
  productionStatus?: ProductionLifecycleStatus;

  /** Optional user-facing category label (for dashboard cards) */
  category?: string;

  /** Optional thumbnail placeholder/prompt shown in saved cards */
  thumbnailPlaceholder?: string;

  /** Optional scene count for quick summary cards */
  sceneCount?: number;

  /** Editable storyboard scene drafts for AI Director Studio */
  storyboardScenes?: StoryboardSceneDraft[];

  /** Optional version number for local migration and edit tracking */
  version?: number;
  
  /** Completion timestamp (if applicable) */
  completedAt?: string;
  
  /** Published timestamp (if applicable) */
  publishedAt?: string;
  
  /** Content blocks (flat array for readability) */
  contentBlocks: Array<{
    id: string;
    type: 'heading' | 'paragraph' | 'list' | 'quote' | 'image' | 'code' | 'table' | 'callout';
    content: string;
    order: number;
    status: ProductionStatus;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  
  /** Revision history (flat array) */
  revisions: Array<{
    id: string;
    version: number;
    changes: string;
    authorId: string;
    createdAt: string;
  }>;
  
  /** Collaborators (flat array) */
  collaborators: Array<{
    userId: string;
    role: 'editor' | 'reviewer' | 'approver' | 'viewer';
    addedAt: string;
  }>;
  
  /** Tags for categorization */
  tags: string[];
  
  /** Performance metrics (optional) */
  metrics?: {
    readabilityScore?: number;
    seoScore?: number;
    engagementScore?: number;
    estimatedReadTime?: number;
  };
  
  /** External references/links */
  references: Array<{
    title: string;
    url: string;
    type: 'source' | 'inspiration' | 'competitor' | 'reference';
  }>;
  
  /** AI generation metadata */
  aiMetadata?: {
    modelUsed?: string;
    promptVersion?: string;
    temperature?: number;
    tokensUsed?: number;
    generationTime?: number;
  };

  /** Source idea metadata (preserved from InspirationIdea) */
  sourceMetadata?: {
    hook?: string;
    coreConcept?: string;
    whyThisWorks?: string;
    ideaType?: "social_post" | "short_video";
    bestFormat?: "Normal Post" | "Reel / Video";
    emotion?: string;
    platform?: string;
    inheritedGoal?: string;
    inheritedTone?: string;
    inheritedStyle?: string;
    estimatedReach?: number;
    engagementPotential?: number;
    difficulty?: "Easy" | "Medium" | "Advanced";
    productionTime?: string;
    suggestedCTA?: string;
    thumbnailPrompt?: string;
    keyVisualPrompt?: string;
    animationPrompt?: string;
    confidenceScore?: number;
    postDraft?: string;
    ctaDraft?: string;
    hashtagsDraft?: string;
    imagePrompt?: string;
  };
}

/**
 * Simplified project summary for lists and overviews
 */
export interface ProductionProjectSummary {
  id: string;
  name: string;
  contentType: ProductionContentType;
  status: ProductionStatus;
  targetAudience: string;
  targetWordCount: number;
  progress: number; // 0-100 percentage
  createdAt: string;
  updatedAt: string;
  deadline?: string;
}

/**
 * Content block template for reuse
 */
export interface ContentBlockTemplate {
  id: string;
  name: string;
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'image' | 'code' | 'table' | 'callout';
  defaultContent: string;
  description: string;
  contentType: ProductionContentType[];
  tags: string[];
}

/**
 * Production statistics for dashboard
 */
export interface ProductionStats {
  totalProjects: number;
  projectsByStatus: Record<ProductionStatus, number>;
  projectsByContentType: Record<ProductionContentType, number>;
  averageCompletionTime: number; // in hours
  totalWordsProduced: number;
  averageQualityScore: number;
}