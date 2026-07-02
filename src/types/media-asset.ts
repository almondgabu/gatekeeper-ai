export type MediaAssetType = "image" | "video";
export type MediaAssetStatus = "pending" | "ready" | "failed";

export type MediaAsset = {
  id: string;
  type: MediaAssetType;
  provider: string;
  mediaUrl: string;
  prompt: string;
  sceneId: string;
  createdAt: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  status: MediaAssetStatus;
  thumbnail: string | null;
  metadata: Record<string, unknown>;
};
