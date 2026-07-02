import { ProductionWorkspaceProject, ProductionContentType, ProductionStatus } from "@/types/production-studio";

/**
 * Inspiration idea type from the AI Idea Explorer
 * Based on the type definition in src/app/api/content-studio/route.ts
 */
type InspirationIdea = {
  title?: string | null;
  hook?: string | null;
  coreConcept?: string | null;
  ideaType?: "social_post" | "short_video";
  bestFormat?: "Normal Post" | "Reel / Video";
  targetAudience?: string | null;
  emotion?: string | null;
  platform?: string | null;
  inheritedGoal?: string | null;
  inheritedTone?: string | null;
  inheritedStyle?: string | null;
  estimatedReach?: number | null;
  engagementPotential?: number | null;
  difficulty?: "Easy" | "Medium" | "Advanced";
  productionTime?: string | null;
  suggestedCTA?: string | null;
  thumbnailPrompt?: string | null;
  keyVisualPrompt?: string | null;
  animationPrompt?: string | null;
  confidenceScore?: number | null;
  whyThisWorks?: string | null;
};

type NormalizedInspirationIdea = {
  title: string;
  hook: string;
  coreConcept: string;
  ideaType: "social_post" | "short_video";
  bestFormat?: "Normal Post" | "Reel / Video";
  targetAudience: string;
  emotion: string;
  platform: string;
  inheritedGoal?: string;
  inheritedTone?: string;
  inheritedStyle?: string;
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

type GeneratedPostPackage = {
  postDraft: string;
  ctaDraft: string;
  hashtagsDraft: string;
  imagePrompt: string;
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
  idea: InspirationIdea,
): ProductionWorkspaceProject {
  const now = new Date().toISOString();
  const normalizedIdea = normalizeInspirationIdea(idea);
  const isNormalPost = normalizedIdea.ideaType === "social_post" || normalizedIdea.bestFormat === "Normal Post";
  const generatedPostPackage = isNormalPost ? buildValidatedNormalPostPackage(normalizedIdea) : null;

  // Map productionTime to content type (simplified mapping)
  const contentType: ProductionContentType = normalizedIdea.platform.toLowerCase().includes("video")
    ? "video_script"
    : "social_media_post";

  // Create the production workspace project
  const project: ProductionWorkspaceProject = {
    // Unique identifier
    id: generateUniqueId(),

    // Copy source fields
    name: normalizedIdea.title,
    description: `${normalizedIdea.hook} ${normalizedIdea.coreConcept}`.trim(),
    contentType,

    // Set status to draft
    status: "draft" as ProductionStatus,

    // Local production-project metadata defaults (backward compatible optional fields)
    projectKind: "production_project",
    productionStatus: "Planning",
    category: normalizedIdea.bestFormat === "Reel / Video" ? "Video / Reel" : "Normal Post",
    thumbnailPlaceholder: normalizedIdea.thumbnailPrompt || `Cover concept for ${normalizedIdea.title}`,
    sceneCount: estimateSceneCount(normalizedIdea.productionTime),
    version: 1,

    // Owner ID - placeholder for now
    ownerId: "current-user",

    // Target audience and brand voice
    targetAudience: normalizedIdea.targetAudience,
    brandVoice: generateBrandVoice(normalizedIdea.difficulty, normalizedIdea.confidenceScore),

    // Key messages and SEO
    keyMessages: extractKeyMessages(normalizedIdea.coreConcept),
    seoKeywords: generateSeoKeywords(normalizedIdea.title, normalizedIdea.coreConcept),

    // Word count target
    targetWordCount: estimateWordCount(normalizedIdea.platform, normalizedIdea.productionTime),

    // Timestamps
    createdAt: now,
    updatedAt: now,
    lastModifiedAt: now,

    // Initialize focused content blocks for normal-post ideas, otherwise empty.
    contentBlocks: normalizedIdea.ideaType === "social_post" || normalizedIdea.bestFormat === "Normal Post"
      ? [
          {
            id: "normal_post_editor",
            type: "paragraph",
            content: generatedPostPackage?.postDraft ?? "",
            order: 1,
            status: "draft",
            notes: "Facebook post editor",
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "normal_post_cta",
            type: "callout",
            content: generatedPostPackage?.ctaDraft ?? normalizedIdea.suggestedCTA,
            order: 2,
            status: "draft",
            notes: "CTA",
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "normal_post_hashtags",
            type: "list",
            content: generatedPostPackage?.hashtagsDraft ?? "",
            order: 3,
            status: "draft",
            notes: "Hashtags",
            createdAt: now,
            updatedAt: now,
          },
        ]
      : [],

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
      hook: normalizedIdea.hook,
      coreConcept: normalizedIdea.coreConcept,
      whyThisWorks: normalizedIdea.whyThisWorks,
      ideaType: normalizedIdea.ideaType,
      bestFormat: normalizedIdea.bestFormat,
      emotion: normalizedIdea.emotion,
      platform: normalizedIdea.platform,
      inheritedGoal: normalizedIdea.inheritedGoal,
      inheritedTone: normalizedIdea.inheritedTone,
      inheritedStyle: normalizedIdea.inheritedStyle,
      estimatedReach: normalizedIdea.estimatedReach,
      engagementPotential: normalizedIdea.engagementPotential,
      difficulty: normalizedIdea.difficulty,
      productionTime: normalizedIdea.productionTime,
      suggestedCTA: normalizedIdea.suggestedCTA,
      thumbnailPrompt: normalizedIdea.thumbnailPrompt,
      keyVisualPrompt: generatedPostPackage?.imagePrompt ?? normalizedIdea.keyVisualPrompt,
      animationPrompt: normalizedIdea.animationPrompt,
      confidenceScore: normalizedIdea.confidenceScore,
      postDraft: generatedPostPackage?.postDraft,
      ctaDraft: generatedPostPackage?.ctaDraft,
      hashtagsDraft: generatedPostPackage?.hashtagsDraft,
      imagePrompt: generatedPostPackage?.imagePrompt,
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

function normalizeText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function getPlatformLabel(platform: string): string {
  const normalized = platform.toLowerCase();

  if (normalized.includes("linkedin")) {
    return "LinkedIn";
  }

  if (normalized.includes("instagram")) {
    return "Instagram";
  }

  if (normalized.includes("tiktok")) {
    return "TikTok";
  }

  if (normalized.includes("youtube")) {
    return "YouTube Shorts";
  }

  return "Facebook";
}

function getPlatformVoice(platform: string): string {
  const normalized = platform.toLowerCase();

  if (normalized.includes("linkedin")) {
    return "clear, credible, and professional";
  }

  if (normalized.includes("instagram")) {
    return "warm, visual, and easy to scan";
  }

  if (normalized.includes("tiktok")) {
    return "quick, sharp, and conversational";
  }

  if (normalized.includes("youtube")) {
    return "concise, visual, and easy to follow";
  }

  return "warm, practical, and easy to read";
}

function getPlatformClosing(platform: string): string {
  const normalized = platform.toLowerCase();

  if (normalized.includes("linkedin")) {
    return "If this perspective is useful, follow Borneo Land Gatekeeper for more practical Sabah land and property insights.";
  }

  if (normalized.includes("instagram")) {
    return "Save this post before viewing land, and share it with someone who is comparing Sabah property options.";
  }

  if (normalized.includes("tiktok") || normalized.includes("youtube")) {
    return "Follow Borneo Land Gatekeeper for the next practical breakdown on Sabah land and property.";
  }

  return "Save this post before you view land, and share it with someone who wants clearer Sabah property advice.";
}

function normalizeHashtag(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

  return slug.length > 0 ? `#${slug}` : "";
}

function buildSupportingHashtag(idea: NormalizedInspirationIdea): string {
  const concept = `${idea.title} ${idea.coreConcept}`.toLowerCase();

  if (concept.includes("checklist")) {
    return "#LandChecklist";
  }

  if (concept.includes("invest")) {
    return "#PropertyInvestment";
  }

  if (concept.includes("buyer")) {
    return "#LandBuyerTips";
  }

  if (concept.includes("seller")) {
    return "#LandOwnerTips";
  }

  if (concept.includes("sabah")) {
    return "#SabahLand";
  }

  return "#SabahPropertyTips";
}

function buildHashtags(idea: NormalizedInspirationIdea): string {
  const tags = [
    "#BorneoLandGatekeeper",
    "#SabahProperty",
    "#PropertyTips",
    "#RealEstateMalaysia",
    buildSupportingHashtag(idea),
  ];

  return Array.from(new Set(tags.filter((tag) => tag.length > 0))).slice(0, 5).join(" ");
}

function buildImagePrompt(idea: NormalizedInspirationIdea): string {
  const aspectRatio = getImageAspectRatio(idea.platform);
  const subject = idea.targetAudience.toLowerCase().includes("investor")
    ? "a Sabah property advisor discussing land opportunities with an interested investor"
    : "a Sabah property advisor helping a buyer review practical land options";
  const setting = idea.coreConcept.toLowerCase().includes("checklist")
    ? "a clean modern office with a clipboard and paperwork on the table"
    : "a calm professional office with subtle Sabah landscape details in the background";

  return [
    `Subject: ${subject}`,
    `Setting: ${setting}`,
    "Composition: subject in the foreground with clear negative space for a premium social graphic",
    "Camera angle: eye-level three-quarter angle with a shallow depth of field",
    "Lighting: soft natural window light with warm highlights",
    "Mood: calm, credible, and practical",
    "Style: realistic commercial photography with a polished editorial finish",
    `Aspect ratio: ${aspectRatio}`,
    "No text overlay unless specifically requested",
  ].join(", ");
}

function buildNormalPostPackage(idea: NormalizedInspirationIdea): GeneratedPostPackage {
  const profile = getPostLengthProfile(idea.platform, idea.productionTime);
  const platformLabel = getPlatformLabel(idea.platform);
  const voice = getPlatformVoice(idea.platform);
  const targetAudience = idea.targetAudience.trim();
  const cta = getPlatformClosing(idea.platform);
  const audienceLine = targetAudience === "General audience" ? "readers" : targetAudience;
  const topicFocus = inferTopicFocus(idea);
  const openingSentence = buildOpeningSentence(idea.platform, topicFocus, idea.inheritedGoal, audienceLine);
  const contextSentence = buildContextSentence(idea.platform, topicFocus, idea.inheritedStyle, idea.emotion);
  const insightSentence = buildInsightSentence(idea.platform, topicFocus, voice, platformLabel, idea.inheritedGoal);
  const exampleSentence = buildExampleSentence(idea.platform, topicFocus, audienceLine);
  const adviceSentence = buildAdviceSentence(idea.platform, topicFocus, platformLabel, idea.productionTime, idea.inheritedTone);
  const goalText = getGoalAngle(idea.inheritedGoal);
  const platformNote = getPlatformContext(idea.platform, idea.productionTime);
  const bodySentences = profile.targetWords >= 220
    ? [
        openingSentence,
        `${platformNote} ${contextSentence}`,
        `In practical terms, ${insightSentence}`,
        `For example, ${exampleSentence}`,
        `${adviceSentence} ${goalText}`,
        `That is why the post should stay ${voice}, because the strongest versions feel calm, specific, and genuinely useful instead of assembled from fragments of the idea card.`,
      ]
    : profile.targetWords >= 100
      ? [
          openingSentence,
          `${platformNote} ${contextSentence}`,
          `In practical terms, ${insightSentence}`,
          `${adviceSentence} ${goalText}`,
        ]
      : [
          openingSentence,
          `${contextSentence} ${insightSentence}`,
          `${adviceSentence} ${goalText}`,
        ];

  const postDraft = [
    ...bodySentences,
    `${cta}`,
  ].join("\n\n");

  return {
    postDraft,
    ctaDraft: cta,
    hashtagsDraft: buildHashtags(idea),
    imagePrompt: buildImagePrompt(idea),
  };
}

function buildFallbackNormalPostPackage(idea: NormalizedInspirationIdea): GeneratedPostPackage {
  const profile = getPostLengthProfile(idea.platform, idea.productionTime);
  const platformLabel = getPlatformLabel(idea.platform);
  const targetAudience = idea.targetAudience.trim() || "readers";
  const cta = getPlatformClosing(idea.platform);
  const topicFocus = inferTopicFocus(idea);
  const openingSentence = buildOpeningSentence(idea.platform, topicFocus, idea.inheritedGoal, targetAudience);
  const contextSentence = buildContextSentence(idea.platform, topicFocus, idea.inheritedStyle, idea.emotion);
  const insightSentence = buildInsightSentence(idea.platform, topicFocus, getPlatformVoice(idea.platform), platformLabel, idea.inheritedGoal);
  const adviceSentence = buildAdviceSentence(idea.platform, topicFocus, platformLabel, idea.productionTime, idea.inheritedTone);

  const bodySentences = profile.targetWords >= 180
    ? [
        openingSentence,
        `${contextSentence}`,
        `In practical terms, ${insightSentence}`,
        `For example, a buyer comparing two land options may discover that access, surrounding use, or the next question they ask changes the decision more than the headline price does.`,
        `${adviceSentence}`,
        `That gives ${targetAudience} a useful takeaway they can apply during a viewing, a call, or a conversation with someone they trust.`,
      ]
    : profile.targetWords >= 100
      ? [
          openingSentence,
          `${contextSentence}`,
          `${adviceSentence}`,
        ]
      : [
          openingSentence,
          `${adviceSentence}`,
        ];

  const postDraft = [
    ...bodySentences,
    `${cta}`,
  ].join("\n\n");

  return {
    postDraft,
    ctaDraft: cta,
    hashtagsDraft: buildHashtags(idea),
    imagePrompt: buildImagePrompt(idea),
  };
}

function buildValidatedNormalPostPackage(idea: NormalizedInspirationIdea): GeneratedPostPackage {
  const profile = getPostLengthProfile(idea.platform, idea.productionTime);
  const primaryPackage = buildNormalPostPackage(idea);

  if (isValidGeneratedPostPackage(primaryPackage, profile)) {
    return primaryPackage;
  }

  const fallbackPackage = buildFallbackNormalPostPackage(idea);

  if (isValidGeneratedPostPackage(fallbackPackage, profile)) {
    return fallbackPackage;
  }

  return {
    postDraft: `${idea.hook.replace(/[.!?]+$/u, "")}.\n\n${idea.coreConcept.replace(/[.!?]+$/u, "")}.\n\n${getPlatformClosing(idea.platform)}`,
    ctaDraft: getPlatformClosing(idea.platform),
    hashtagsDraft: "#BorneoLandGatekeeper #SabahProperty #PropertyTips #RealEstateMalaysia #SabahLand",
    imagePrompt: buildImagePrompt(idea),
  };
}

function isValidGeneratedPostPackage(packageToCheck: GeneratedPostPackage, profile: PostLengthProfile): boolean {
  const postDraft = packageToCheck.postDraft.trim();
  const ctaDraft = packageToCheck.ctaDraft.trim();
  const hashtagsDraft = packageToCheck.hashtagsDraft.trim();
  const imagePrompt = packageToCheck.imagePrompt.trim();
  const wordCount = countWords(postDraft);

  if (!postDraft || !ctaDraft || !hashtagsDraft || !imagePrompt) {
    return false;
  }

  if (wordCount < profile.minWords || wordCount > profile.maxWords) {
    return false;
  }

  if (!hashtagsDraft.includes("#BorneoLandGatekeeper")) {
    return false;
  }

  const ideaEchoPatterns = /\bplanning to buy land in sabah\b|\bstart with a simple checklist\b|\ba cheap land listing is not always a good deal\b|\bmost people talk about price before value\b|\bbefore you buy land, ask three simple questions\b|\bif the paperwork is unclear, stop and verify first\b/i;

  const placeholderPatterns = /expand paragraph|write about|add details|insert here|placeholder|lorem ipsum|draft here/i;

  return !placeholderPatterns.test(postDraft) && !placeholderPatterns.test(ctaDraft) && !placeholderPatterns.test(hashtagsDraft) && !placeholderPatterns.test(imagePrompt) && !ideaEchoPatterns.test(postDraft);
}

function getGoalAngle(goal: string | undefined): string {
  const normalized = normalizeText(goal, "Educate").toLowerCase();

  if (normalized.includes("authorit")) {
    return "The message should sound calm, experienced, and grounded in local context.";
  }

  if (normalized.includes("buyer")) {
    return "The post should help a buyer feel informed enough to take a next step.";
  }

  if (normalized.includes("seller")) {
    return "The post should show land owners what practical buyer-minded advice looks like.";
  }

  if (normalized.includes("brand")) {
    return "The post should keep the brand sounding steady, clear, and locally credible.";
  }

  if (normalized.includes("engage")) {
    return "The post should give readers something useful enough to save or share.";
  }

  return "The post should feel like a useful guide rather than a sales pitch.";
}

function getPlatformContext(platform: string, productionTime: string): string {
  const profile = getPostLengthProfile(platform, productionTime);

  if (profile.label === "LinkedIn") {
    return "Open with practical context and a professional point of view.";
  }

  if (profile.label === "Instagram") {
    return "Keep the message sharp, visual, and easy to save.";
  }

  if (profile.label === "TikTok" || profile.label === "YouTube Shorts") {
    return "Lead with a fast, concrete idea that reads naturally in a caption.";
  }

  return "Lead with a direct local insight that earns attention quickly.";
}

function inferTopicFocus(idea: NormalizedInspirationIdea): string {
  const combinedText = `${idea.title} ${idea.hook} ${idea.coreConcept} ${idea.whyThisWorks}`.toLowerCase();

  if (combinedText.includes("checklist")) {
    return "a simple checklist that helps buyers verify the practical details before they move forward";
  }

  if (combinedText.includes("access") || combinedText.includes("road")) {
    return "how access, road conditions, and surrounding use shape the real decision";
  }

  if (combinedText.includes("value")) {
    return "why value is bigger than the asking price and what really changes the decision";
  }

  if (combinedText.includes("paperwork") || combinedText.includes("deed") || combinedText.includes("title")) {
    return "the checks that matter when the paperwork needs a closer look";
  }

  if (combinedText.includes("question")) {
    return "the questions a buyer should ask before committing to a land viewing or offer";
  }

  if (combinedText.includes("buyer")) {
    return "the practical details a buyer needs in order to feel confident about the next step";
  }

  return "the practical details that make a Sabah property post genuinely useful";
}

function getPlatformOpeningStyle(platform: string): string {
  const normalized = platform.toLowerCase();

  if (normalized.includes("linkedin")) {
    return "strategic";
  }

  if (normalized.includes("instagram")) {
    return "visual";
  }

  if (normalized.includes("tiktok") || normalized.includes("youtube")) {
    return "direct";
  }

  return "practical";
}

function buildOpeningSentence(platform: string, topicFocus: string, goal: string | undefined, audience: string): string {
  const openingStyle = getPlatformOpeningStyle(platform);
  const goalLabel = normalizeText(goal, "Educate").toLowerCase();

  if (openingStyle === "strategic") {
    return `In Sabah property marketing, the strongest posts are the ones that help ${audience.toLowerCase()} make a better decision, not just a faster one.`;
  }

  if (openingStyle === "visual") {
    return `A strong social post should give ${audience.toLowerCase()} one clear reason to pause, save it, and think more carefully about the next step.`;
  }

  if (openingStyle === "direct") {
    return `Before you buy land, there are a few details that matter more than the headline.`;
  }

  if (goalLabel.includes("brand")) {
    return `When a Sabah property brand sounds calm and specific, people pay more attention to the message.`;
  }

  return `When buyers look at Sabah land, ${topicFocus} usually matters more than the first impression.`;
}

function buildContextSentence(platform: string, topicFocus: string, style: string | undefined, emotion: string | undefined): string {
  const styleLabel = normalizeText(style, "practical").toLowerCase();
  const emotionLabel = normalizeText(emotion, "confidence").toLowerCase();

  if (platform.toLowerCase().includes("linkedin")) {
    return `However, the topic works best when the post explains ${topicFocus}, because that creates a more credible and useful perspective for the audience.`;
  }

  if (platform.toLowerCase().includes("instagram")) {
    return `For a visual platform, the message should stay ${styleLabel} and ${emotionLabel} so readers can follow it quickly.`;
  }

  if (platform.toLowerCase().includes("tiktok") || platform.toLowerCase().includes("youtube")) {
    return `This becomes even more important when the caption needs to feel quick, sharp, and useful within a few seconds.`;
  }

  return `Before making a decision, readers usually want one simple reason to care, and ${topicFocus} gives the post that anchor.`;
}

function buildInsightSentence(platform: string, topicFocus: string, voice: string, platformLabel: string, goal: string | undefined): string {
  const goalLabel = normalizeText(goal, "educate").toLowerCase();

  if (platform.toLowerCase().includes("linkedin")) {
    return `the post should break down ${topicFocus} in a way that feels measured, credible, and easy to apply in real conversations.`;
  }

  if (platform.toLowerCase().includes("instagram")) {
    return `the post should show ${topicFocus} in a way that feels easy to save and simple to scan.`;
  }

  if (platform.toLowerCase().includes("tiktok") || platform.toLowerCase().includes("youtube")) {
    return `the post should deliver ${topicFocus} quickly, so the idea lands before attention drifts.`;
  }

  if (goalLabel.includes("authority")) {
    return `the post should show ${topicFocus} with enough detail to sound informed without losing clarity.`;
  }

  return `the post should explain ${topicFocus} in a way that feels useful, local, and easy to trust on ${platformLabel}.`;
}

function buildExampleSentence(platform: string, topicFocus: string, audience: string): string {
  if (platform.toLowerCase().includes("linkedin")) {
    return `a client comparing two options may realize that ${topicFocus} changes the conversation more than price alone.`;
  }

  if (platform.toLowerCase().includes("instagram")) {
    return `a buyer scrolling quickly will still understand the point if the caption shows one clear local example.`;
  }

  if (platform.toLowerCase().includes("tiktok") || platform.toLowerCase().includes("youtube")) {
    return `a quick example keeps the caption grounded, such as what a buyer should check before deciding to save the listing.`;
  }

  return `for example, ${audience.toLowerCase()} can use it as a short filter during a viewing or a phone call.`;
}

function buildAdviceSentence(platform: string, topicFocus: string, platformLabel: string, productionTime: string, tone: string | undefined): string {
  const toneLabel = normalizeText(tone, "clear").toLowerCase();
  const timeLabel = normalizeText(productionTime, "15-30 minutes").toLowerCase();

  if (platform.toLowerCase().includes("linkedin")) {
    return `Another point to consider is writing the advice in a way that keeps the ${toneLabel} tone steady while still ending with a practical next step.`;
  }

  if (platform.toLowerCase().includes("instagram")) {
    return `Another point to consider is keeping the advice short enough to scan, but specific enough to feel worth saving.`;
  }

  if (platform.toLowerCase().includes("tiktok") || platform.toLowerCase().includes("youtube")) {
    return `In practical terms, the advice should stay punchy and direct so it feels natural in a short caption.`;
  }

  if (timeLabel.includes("quick")) {
    return `In practical terms, the advice should be short, clear, and tied to one useful next action.`;
  }

  return `In practical terms, the advice should show how ${topicFocus} helps the reader move one step closer to a better decision on ${platformLabel}.`;
}

type PostLengthProfile = {
  label: string;
  minWords: number;
  targetWords: number;
  maxWords: number;
};

function getPostLengthProfile(platform: string, productionTime: string | null | undefined): PostLengthProfile {
  const normalizedPlatform = platform.toLowerCase();
  const timeLower = normalizeText(productionTime).toLowerCase();

  let profile: PostLengthProfile;

  if (normalizedPlatform.includes("linkedin")) {
    profile = { label: "LinkedIn", minWords: 220, targetWords: 320, maxWords: 450 };
  } else if (normalizedPlatform.includes("instagram")) {
    profile = { label: "Instagram", minWords: 100, targetWords: 150, maxWords: 220 };
  } else if (normalizedPlatform.includes("tiktok") || normalizedPlatform.includes("youtube")) {
    profile = { label: "TikTok", minWords: 60, targetWords: 100, maxWords: 140 };
  } else {
    profile = { label: "Facebook", minWords: 180, targetWords: 250, maxWords: 350 };
  }

  if (timeLower.includes("quick") || timeLower.includes("short") || timeLower.includes("2-4") || timeLower.includes("5") || timeLower.includes("10")) {
    return { ...profile, targetWords: Math.max(profile.minWords + 20, Math.round(profile.minWords + (profile.maxWords - profile.minWords) * 0.25)) };
  }

  if (timeLower.includes("long") || timeLower.includes("extended") || timeLower.includes("premium") || timeLower.includes("45") || timeLower.includes("60")) {
    return { ...profile, targetWords: Math.min(profile.maxWords - 20, Math.round(profile.minWords + (profile.maxWords - profile.minWords) * 0.8)) };
  }

  if (timeLower.includes("medium") || timeLower.includes("standard") || timeLower.includes("15") || timeLower.includes("30")) {
    return { ...profile, targetWords: Math.round((profile.minWords + profile.maxWords) / 2) };
  }

  return profile;
}

function countWords(value: string): number {
  return value.trim().length === 0 ? 0 : value.trim().split(/\s+/).length;
}

function normalizeNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeDifficulty(value: unknown): "Easy" | "Medium" | "Advanced" {
  const normalized = normalizeText(value, "Medium").toLowerCase();

  if (normalized === "easy") {
    return "Easy";
  }

  if (normalized === "advanced") {
    return "Advanced";
  }

  return "Medium";
}

function normalizeInspirationIdea(idea: InspirationIdea): NormalizedInspirationIdea {
  const title = normalizeText(idea.title, "Untitled Idea");
  const hook = normalizeText(idea.hook, title);
  const coreConcept = normalizeText(idea.coreConcept, hook);
  const confidenceScore = normalizeNumber(idea.confidenceScore, 70);
  const engagementPotential = normalizeNumber(idea.engagementPotential, confidenceScore);

  return {
    title,
    hook,
    coreConcept,
    ideaType: idea.ideaType ?? "social_post",
    bestFormat: idea.bestFormat,
    targetAudience: normalizeText(idea.targetAudience, "General audience"),
    emotion: normalizeText(idea.emotion, "Trust"),
    platform: normalizeText(idea.platform, "facebook"),
    inheritedGoal: normalizeText(idea.inheritedGoal),
    inheritedTone: normalizeText(idea.inheritedTone),
    inheritedStyle: normalizeText(idea.inheritedStyle),
    estimatedReach: normalizeNumber(idea.estimatedReach, 100),
    engagementPotential,
    difficulty: normalizeDifficulty(idea.difficulty),
    productionTime: normalizeText(idea.productionTime, "15-30 minutes"),
    suggestedCTA: normalizeText(idea.suggestedCTA),
    thumbnailPrompt: normalizeText(idea.thumbnailPrompt, `Cover concept for ${title}`),
    keyVisualPrompt: normalizeText(idea.keyVisualPrompt, `Key visual concept for ${title}`),
    animationPrompt: normalizeText(idea.animationPrompt),
    confidenceScore,
    whyThisWorks: normalizeText(idea.whyThisWorks, "Strong fit for the selected workflow and goal."),
  };
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
function extractKeyMessages(coreConcept: string | null | undefined): string[] {
  const normalizedConcept = normalizeText(coreConcept);
  const sentences = normalizedConcept
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 10);

  // Take first 3 sentences or use default messages
  const extracted = sentences.slice(0, 3);

  if (extracted.length > 0) {
    return extracted;
  }

  // Fallback messages if no sentences extracted
  return [
    "Highlight unique property features and benefits",
    "Connect property value to audience needs",
    "Provide clear next steps for engagement",
  ];
}

/**
 * Generates SEO keywords from title and core concept
 * Extracts important words and adds real estate related terms
 */
function generateSeoKeywords(title: string | null | undefined, coreConcept: string | null | undefined): string[] {
  const combinedText = `${normalizeText(title)} ${normalizeText(coreConcept)}`.toLowerCase();

  // Common real estate keywords to look for
  const realEstateKeywords = [
    "property", "real estate", "land", "house", "home", "investment",
    "borneo", "sabah", "malaysia", "development", "commercial", "residential",
    "luxury", "affordable", "location", "price", "value", "opportunity",
  ];

  // Find keywords that appear in the text
  const foundKeywords = realEstateKeywords.filter((keyword) =>
    combinedText.includes(keyword.toLowerCase()),
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
function estimateWordCount(platform: string, productionTime: string | null | undefined): number {
  return getPostLengthProfile(platform, productionTime).targetWords;
}

/**
 * Generates a unique ID for the project
 * Simple timestamp-based ID for local use
 */
function generateUniqueId(): string {
  return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function estimateSceneCount(productionTime: string | null | undefined): number {
  const normalized = normalizeText(productionTime).toLowerCase();

  if (!normalized) {
    return 5;
  }

  if (normalized.includes("2-4") || normalized.includes("short") || normalized.includes("quick")) {
    return 5;
  }

  if (normalized.includes("half") || normalized.includes("medium") || normalized.includes("standard")) {
    return 6;
  }

  if (normalized.includes("full") || normalized.includes("long") || normalized.includes("premium")) {
    return 8;
  }

  return 5;
}

function getImageAspectRatio(platform: string): string {
  const normalized = platform.toLowerCase();

  if (normalized.includes("linkedin")) {
    return "1:1";
  }

  if (normalized.includes("tiktok") || normalized.includes("youtube")) {
    return "9:16";
  }

  return "4:5";
}
