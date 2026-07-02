type BuildStrategyPromptOptions = {
  direction: "educational" | "storytelling" | "localized" | "authority" | "behind-the-scenes";
  analysis: {
    whatMakesThisContentEffective: string[];
    contentBlueprint: {
      opening: string;
      problem: string;
      evidence: string;
      solution: string;
      callToAction: string;
    };
    whatYouCanLearn: string[];
  };
  manualDescription: string;
  videoUrl: string;
};

const directionDescriptions: Record<BuildStrategyPromptOptions["direction"], string> = {
  educational: "Prioritize teaching and practical audience value.",
  storytelling: "Prioritize narrative progression and emotional movement.",
  localized: "Prioritize local context, language style, and cultural relevance.",
  authority: "Prioritize trust signals, proof, and expert positioning.",
  "behind-the-scenes": "Prioritize process, authenticity, and execution moments.",
};

export function buildViralScannerStrategyPrompt({
  direction,
  analysis,
  manualDescription,
  videoUrl,
}: BuildStrategyPromptOptions) {
  const contextSummary = [
    `Direction selected: ${direction}`,
    `Direction intent: ${directionDescriptions[direction]}`,
    videoUrl ? `Video URL: ${videoUrl}` : "Video URL: Not provided.",
    manualDescription ? `Manual description: ${manualDescription}` : "Manual description: Not provided.",
    `What makes this content effective: ${analysis.whatMakesThisContentEffective.join(" | ") || "Not available."}`,
    `Content blueprint: Opening=${analysis.contentBlueprint.opening}; Problem=${analysis.contentBlueprint.problem}; Evidence=${analysis.contentBlueprint.evidence}; Solution=${analysis.contentBlueprint.solution}; CallToAction=${analysis.contentBlueprint.callToAction}`,
    `What you can learn: ${analysis.whatYouCanLearn.join(" | ") || "Not available."}`,
  ].join("\n");

  return `
You are Viral Scanner Creative Strategy Studio.

Role:
You are an AI strategist, not a content generator.

Goal:
Generate one focused creative strategy framework based on the selected direction.

Strict prohibitions:
- Do NOT generate posts.
- Do NOT generate captions.
- Do NOT generate hashtags.
- Do NOT generate image prompts.
- Do NOT generate video prompts.
- Do NOT generate storyboards.
- Do NOT generate narration.

Output rules:
- Return exactly one JSON object.
- Use only the keys listed below.
- Every field must be concise natural language.
- No extra keys.

Return this exact shape:
{
  "strategySummary": "...",
  "hookDirection": "...",
  "audience": "...",
  "tone": "...",
  "storyStructure": "...",
  "ctaDirection": "...",
  "visualStyleRecommendation": "..."
}

Context:
${contextSummary}
`;
}
