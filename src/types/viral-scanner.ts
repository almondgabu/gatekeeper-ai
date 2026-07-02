export type ScannerStepId =
  | "analyze-inspiration"
  | "what-makes-effective"
  | "content-blueprint"
  | "what-you-can-learn"
  | "creative-strategy-studio"
  | "continue-content-creator";

export type StrategyDirectionId =
  | "educational"
  | "storytelling"
  | "localized"
  | "authority"
  | "behind-the-scenes";

export type ViralScannerAnalysis = {
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

export type CreativeStrategy = {
  strategySummary: string;
  hookDirection: string;
  audience: string;
  tone: string;
  storyStructure: string;
  ctaDirection: string;
  visualStyleRecommendation: string;
};
