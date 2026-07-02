import { openai } from "@/lib/embeddings";
import { MEDIA_PROVIDERS } from "@/lib/ai/providers";
import type { MediaAsset } from "@/types/media-asset";

type SupportedAspectRatio = "1:1" | "9:16" | "16:9";

type GenerateImageParams = {
  sceneId: string;
  prompt: string;
  promptVersion: string;
  aspectRatio: SupportedAspectRatio;
};

type GenerateVideoParams = {
  sceneId: string;
  prompt: string;
  draft: boolean;
};

function imageSizeFromAspectRatio(aspectRatio: SupportedAspectRatio) {
  if (aspectRatio === "1:1") {
    return { size: "1024x1024" as const, width: 1024, height: 1024 };
  }

  if (aspectRatio === "16:9") {
    return { size: "1536x1024" as const, width: 1536, height: 1024 };
  }

  return { size: "1024x1536" as const, width: 1024, height: 1536 };
}

export async function generateImage(params: GenerateImageParams): Promise<MediaAsset> {
  const provider = MEDIA_PROVIDERS.image.gptImage2;
  const dimensions = imageSizeFromAspectRatio(params.aspectRatio);

  const response = await openai.images.generate({
    model: provider.model,
    prompt: params.prompt,
    size: dimensions.size,
    quality: "auto",
  });

  const imageData = response.data?.[0];
  const imageBase64 = imageData?.b64_json?.trim() ?? "";
  const hostedUrl = imageData?.url?.trim() ?? "";

  if (!imageBase64 && !hostedUrl) {
    throw new Error("Image generation returned no image data.");
  }

  const createdAt = new Date().toISOString();
  const imageUrl = imageBase64 ? `data:image/png;base64,${imageBase64}` : hostedUrl;
  const thumbnailUrl = (imageData as { thumbnail_url?: unknown })?.thumbnail_url;

  return {
    id: `${params.sceneId || "scene"}-${params.promptVersion}-${Date.now()}`,
    type: "image",
    provider: provider.label,
    mediaUrl: imageUrl,
    prompt: params.prompt,
    sceneId: params.sceneId,
    createdAt,
    width: dimensions.width,
    height: dimensions.height,
    duration: null,
    status: "ready",
    thumbnail: typeof thumbnailUrl === "string" && thumbnailUrl.trim() ? thumbnailUrl.trim() : null,
    metadata: {
      modelUsed: provider.model,
      promptVersion: params.promptVersion,
      aspectRatio: params.aspectRatio,
    },
  };
}

export async function generateVideo(_params: GenerateVideoParams): Promise<MediaAsset> {
  throw new Error("Video generation is not enabled yet. Placeholder service only.");
}
