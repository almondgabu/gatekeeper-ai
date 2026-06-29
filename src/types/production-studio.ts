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