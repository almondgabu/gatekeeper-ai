import { AI_MODELS } from "@/lib/ai/modelConfig";

export type MediaProviderType = "image" | "video";

export type MediaProvider = {
  id: string;
  label: string;
  type: MediaProviderType;
  model: string;
  tier: "standard" | "draft" | "production";
};

export const MEDIA_PROVIDERS = {
  image: {
    gptImage2: {
      id: "openai:gpt-image-2",
      label: "GPT Image 2",
      type: "image",
      model: AI_MODELS.image,
      tier: "standard",
    },
  },
  video: {
    googleFlow: {
      id: "google:flow",
      label: "Google Flow",
      type: "video",
      model: "external-manual-render",
      tier: "production",
    },
    sora2: {
      id: "openai:sora-2",
      label: "Sora 2",
      type: "video",
      model: AI_MODELS.videoDraft,
      tier: "draft",
    },
    sora2Pro: {
      id: "openai:sora-2-pro",
      label: "Sora 2 Pro",
      type: "video",
      model: AI_MODELS.videoProduction,
      tier: "production",
    },
  },
} as const;
