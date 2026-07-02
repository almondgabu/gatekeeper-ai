export const AI_MODELS = {
  chat: "gpt-5.5",
  image: "gpt-image-2",
  videoDraft: "sora-2",
  videoProduction: "sora-2-pro",
} as const;

export type AiModelRole = keyof typeof AI_MODELS;
