export const supportedVideoPlatforms = [
  "TikTok",
  "Facebook Reel",
  "Instagram Reel",
  "YouTube Shorts",
] as const;

export type SupportedVideoPlatform = (typeof supportedVideoPlatforms)[number];

function safeHostname(value: string) {
  try {
    const parsed = new URL(value.trim());
    return parsed.hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function detectSupportedVideoPlatform(videoUrl: string): SupportedVideoPlatform | null {
  const host = safeHostname(videoUrl);

  if (!host) {
    return null;
  }

  if (host.includes("tiktok.com")) {
    return "TikTok";
  }

  if (host.includes("instagram.com")) {
    return "Instagram Reel";
  }

  if (host.includes("facebook.com") || host.includes("fb.watch")) {
    return "Facebook Reel";
  }

  if (host.includes("youtube.com") || host.includes("youtu.be")) {
    return "YouTube Shorts";
  }

  return null;
}

export function isSupportedVideoUrl(videoUrl: string) {
  return detectSupportedVideoPlatform(videoUrl) !== null;
}
