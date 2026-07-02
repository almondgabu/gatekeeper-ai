"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Camera,
  Calendar,
  Check,
  Clapperboard,
  FolderOpen,
  GraduationCap,
  ImageUp,
  Link2,
  MapPin,
  MessageSquareText,
  Milestone,
  MoveDown,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import { detectSupportedVideoPlatform } from "@/lib/viral-scanner/platform";
import {
  deleteViralScannerProject,
  listViralScannerProjects,
  saveViralScannerProject,
  type ViralScannerProject,
} from "@/lib/viral-scanner/projectStorage";
import { saveWorkflowBridgeRecord, loadWorkflowBridgeRecord } from "@/lib/workflowBridge";
import type {
  CreativeStrategy,
  ScannerStepId,
  ViralScannerAnalysis,
} from "@/types/viral-scanner";

const scannerSteps: Array<{ id: ScannerStepId; label: string; purpose: string }> = [
  { id: "analyze-inspiration", label: "Analyze Inspiration", purpose: "What content?" },
  { id: "what-makes-effective", label: "What Makes This Content Effective?", purpose: "Why does it work?" },
  { id: "content-blueprint", label: "Content Blueprint", purpose: "How is it structured?" },
  { id: "what-you-can-learn", label: "What You Can Learn", purpose: "What should I apply?" },
  { id: "creative-strategy-studio", label: "Creative Strategy Studio", purpose: "Which direction should I choose?" },
  { id: "continue-content-creator", label: "Continue to Production Studio", purpose: "What happens next?" },
];

const strategyDirections = [
  {
    id: "educational",
    label: "Educational",
    description: "Teach a practical lesson with simple, useful takeaways.",
    icon: GraduationCap,
  },
  {
    id: "storytelling",
    label: "Storytelling",
    description: "Lead with a narrative arc that creates emotional momentum.",
    icon: BookOpen,
  },
  {
    id: "localized",
    label: "Localized",
    description: "Adapt the message to local culture, language, and context.",
    icon: MapPin,
  },
  {
    id: "authority",
    label: "Authority",
    description: "Position the creator as a credible expert with clear proof.",
    icon: ShieldCheck,
  },
  {
    id: "behind-the-scenes",
    label: "Behind the Scenes",
    description: "Show process, effort, and real execution moments.",
    icon: Camera,
  },
] as const;

type StrategyDirectionId = (typeof strategyDirections)[number]["id"];

type AnalysisInputSnapshot = {
  usedVideoLink: boolean;
  usedScreenshot: boolean;
  usedManualDescription: boolean;
};

type RefineTone = "auto" | "confident" | "friendly" | "premium" | "bold";
type RefineAudience = "auto" | "beginners" | "growth-marketers" | "small-business-owners" | "creators";
type RefinePlatform = "auto" | "tiktok" | "instagram-reels" | "youtube-shorts" | "facebook-reels";

const thinkingSteps = [
  "Reading your description...",
  "Understanding the hook...",
  "Detecting emotional triggers...",
  "Extracting storytelling structure...",
  "Preparing learning points...",
];

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";

      if (!result) {
        reject(new Error("Unable to read screenshot."));
        return;
      }

      resolve(result);
    };

    reader.onerror = () => {
      reject(new Error("Unable to read screenshot."));
    };

    reader.readAsDataURL(file);
  });
}

export default function ViralScannerPage() {
  const router = useRouter();
  const hasAppliedBridgeRef = useRef(false);
  const [activeStep, setActiveStep] = useState<ScannerStepId>("analyze-inspiration");
  const [videoLink, setVideoLink] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotReference, setScreenshotReference] = useState("");
  const [screenshotName, setScreenshotName] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [analysis, setAnalysis] = useState<ViralScannerAnalysis | null>(null);
  const [analysisInputs, setAnalysisInputs] = useState<AnalysisInputSnapshot | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDirection, setSelectedDirection] = useState<StrategyDirectionId | null>(null);
  const [strategy, setStrategy] = useState<CreativeStrategy | null>(null);
  const [strategyError, setStrategyError] = useState("");
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [refineTone, setRefineTone] = useState<RefineTone>("auto");
  const [refineAudience, setRefineAudience] = useState<RefineAudience>("auto");
  const [refinePlatform, setRefinePlatform] = useState<RefinePlatform>("auto");
  const [savedProjects, setSavedProjects] = useState<ViralScannerProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [lastSavedHash, setLastSavedHash] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const analysisTimeoutMs = 45000;

  const activeIndex = scannerSteps.findIndex((step) => step.id === activeStep);
  const nextStep = activeIndex >= 0 && activeIndex < scannerSteps.length - 1 ? scannerSteps[activeIndex + 1] : null;

  useEffect(() => {
    setSavedProjects(listViralScannerProjects());
  }, []);

  useEffect(() => {
    if (hasAppliedBridgeRef.current) {
      return;
    }

    const bridge = loadWorkflowBridgeRecord();
    const sourceContent = bridge?.contentStudio;
    const approvedContent = bridge?.p2_content;
    const inheritedSummary = approvedContent
      ? [approvedContent.title, approvedContent.hook, approvedContent.caption].filter(Boolean).join("\n\n")
      : sourceContent?.summary ?? "";

    if (!inheritedSummary || manualDescription.trim().length > 0 || analysis || selectedDirection) {
      return;
    }

    hasAppliedBridgeRef.current = true;
    setManualDescription(inheritedSummary);
    setActiveStep("analyze-inspiration");
    setSaveMessage("Loaded approved content handoff.");
  }, [analysis, manualDescription, selectedDirection]);

  useEffect(() => {
    if (!screenshotFile) {
      return;
    }

    let cancelled = false;
    void fileToDataUrl(screenshotFile)
      .then((dataUrl) => {
        if (!cancelled) {
          setScreenshotReference(dataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setScreenshotReference("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [screenshotFile]);

  useEffect(() => {
    if (!isAnalyzing) {
      setThinkingIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setThinkingIndex((current) => (current + 1) % thinkingSteps.length);
    }, 1300);

    return () => {
      clearInterval(timer);
    };
  }, [isAnalyzing]);

  function goNextStep() {
    if (!nextStep) {
      return;
    }

    setActiveStep(nextStep.id);
  }

  function goPreviousStep() {
    if (activeIndex <= 0) {
      return;
    }

    setActiveStep(scannerSteps[activeIndex - 1].id);
  }

  async function handleAnalyzeInspiration() {
    setErrorMessage("");

    const trimmedUrl = videoLink.trim();
    const trimmedDescription = manualDescription.trim();

    if (!trimmedUrl && !trimmedDescription && !screenshotFile) {
      setErrorMessage("Add a video link, screenshot, or manual description first.");
      return;
    }

    if (trimmedUrl && !detectSupportedVideoPlatform(trimmedUrl)) {
      setErrorMessage("Unsupported URL. Use TikTok, Facebook Reel, Instagram Reel, or YouTube Shorts.");
      return;
    }

    setIsAnalyzing(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), analysisTimeoutMs);

    try {
      const screenshotDataUrl = screenshotFile ? await fileToDataUrl(screenshotFile) : "";

      const response = await fetch("/api/viral-scanner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl: trimmedUrl,
          screenshotDataUrl,
          manualDescription: trimmedDescription,
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "AI analysis failed.");
      }

      setAnalysis(data.analysis as ViralScannerAnalysis);
      setAnalysisInputs({
        usedVideoLink: Boolean(trimmedUrl),
        usedScreenshot: Boolean(screenshotFile),
        usedManualDescription: Boolean(trimmedDescription),
      });
      setActiveProjectId("");
      setLastSavedHash("");
      setSaveMessage("");
      setActiveStep("what-makes-effective");
    } catch (error: any) {
      if (error?.name === "AbortError") {
        setErrorMessage("The analysis took too long to complete. Please try again.");
        return;
      }

      setErrorMessage(error?.message || "AI analysis failed. Please try again.");
    } finally {
      clearTimeout(timeout);
      setIsAnalyzing(false);
    }
  }

  function buildRefinementContext() {
    const toneLabels: Record<RefineTone, string> = {
      auto: "Auto",
      confident: "Confident",
      friendly: "Friendly",
      premium: "Premium",
      bold: "Bold",
    };

    const audienceLabels: Record<RefineAudience, string> = {
      auto: "Auto",
      beginners: "Beginners",
      "growth-marketers": "Growth Marketers",
      "small-business-owners": "Small Business Owners",
      creators: "Creators",
    };

    const platformLabels: Record<RefinePlatform, string> = {
      auto: "Auto",
      tiktok: "TikTok",
      "instagram-reels": "Instagram Reels",
      "youtube-shorts": "YouTube Shorts",
      "facebook-reels": "Facebook Reels",
    };

    if (refineTone === "auto" && refineAudience === "auto" && refinePlatform === "auto") {
      return "";
    }

    return [
      "Refinement preferences:",
      `- Tone: ${toneLabels[refineTone]}`,
      `- Audience: ${audienceLabels[refineAudience]}`,
      `- Platform: ${platformLabels[refinePlatform]}`,
    ].join("\n");
  }

  async function generateStrategy(direction: StrategyDirectionId) {
    setStrategyError("");

    if (!analysis) {
      setStrategyError("Run Analyze Inspiration first to unlock strategy generation.");
      return;
    }

    setIsGeneratingStrategy(true);

    try {
      const refinementContext = buildRefinementContext();
      const mergedManualDescription = [manualDescription.trim(), refinementContext].filter(Boolean).join("\n\n");

      const response = await fetch("/api/viral-scanner/strategy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          direction,
          analysis,
          manualDescription: mergedManualDescription,
          videoUrl: videoLink.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Strategy generation failed.");
      }

      setStrategy(data.strategy as CreativeStrategy);
    } catch (error: any) {
      setStrategyError(error?.message || "Strategy generation failed. Please try again.");
    } finally {
      setIsGeneratingStrategy(false);
    }
  }

  async function handleSelectDirection(direction: StrategyDirectionId) {
    setSelectedDirection(direction);
    setStrategy(null);
    await generateStrategy(direction);
  }

  async function handleRefineStrategy() {
    if (!selectedDirection) {
      setStrategyError("Select one creative direction first.");
      return;
    }

    await generateStrategy(selectedDirection);
  }

  function resolvePlatformLabel() {
    const detected = detectSupportedVideoPlatform(videoLink.trim());

    if (detected) {
      return detected;
    }

    const platformMap: Record<RefinePlatform, string> = {
      auto: "Unknown",
      tiktok: "TikTok",
      "instagram-reels": "Instagram Reels",
      "youtube-shorts": "YouTube Shorts",
      "facebook-reels": "Facebook Reels",
    };

    return platformMap[refinePlatform];
  }

  function buildProjectName() {
    const label = strategyDirections.find((item) => item.id === selectedDirection)?.label ?? "Strategy";
    const derived = manualDescription.trim().split(/\s+/).slice(0, 6).join(" ");
    return derived ? `${derived} - ${label}` : `Viral Scanner Project - ${label}`;
  }

  function hashProject(project: ViralScannerProject) {
    return JSON.stringify({
      projectName: project.projectName,
      platform: project.platform,
      originalReferenceLink: project.originalReferenceLink,
      manualDescription: project.manualDescription,
      screenshotReference: project.screenshotReference,
      analysis: project.analysis,
      contentBlueprint: project.contentBlueprint,
      learningPoints: project.learningPoints,
      selectedCreativeDirection: project.selectedCreativeDirection,
      generatedStrategy: project.generatedStrategy,
      currentStep: project.currentStep,
    });
  }

  function buildCurrentStateHash() {
    const payload = {
      projectName: activeProjectId
        ? savedProjects.find((project) => project.id === activeProjectId)?.projectName || buildProjectName()
        : buildProjectName(),
      platform: resolvePlatformLabel(),
      originalReferenceLink: videoLink.trim(),
      manualDescription: manualDescription.trim(),
      screenshotReference,
      analysis,
      contentBlueprint: analysis?.contentBlueprint ?? null,
      learningPoints: analysis?.whatYouCanLearn ?? [],
      selectedCreativeDirection: selectedDirection,
      generatedStrategy: strategy,
      currentStep: activeStep,
    };

    return JSON.stringify(payload);
  }

  async function handleSaveProject(silent = false) {
    if (!analysis || !strategy || !selectedDirection) {
      setStrategyError("Generate a strategy first, then save your project.");
      return false;
    }

    const now = new Date().toISOString();
    const existing = activeProjectId
      ? savedProjects.find((project) => project.id === activeProjectId) || null
      : null;

    const id = existing?.id || (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`);

    const project: ViralScannerProject = {
      id,
      projectName: existing?.projectName || buildProjectName(),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      platform: resolvePlatformLabel(),
      originalReferenceLink: videoLink.trim(),
      manualDescription: manualDescription.trim(),
      screenshotReference,
      analysis,
      contentBlueprint: analysis.contentBlueprint,
      learningPoints: analysis.whatYouCanLearn,
      selectedCreativeDirection: selectedDirection,
      generatedStrategy: strategy,
      currentStep: activeStep,
    };

    saveViralScannerProject(project);
    const nextProjects = listViralScannerProjects();
    setSavedProjects(nextProjects);
    setActiveProjectId(project.id);
    setLastSavedHash(hashProject(project));

    if (!silent) {
      setSaveMessage("Project saved.");
    }

    return true;
  }

  async function ensureSavedBeforeBuild() {
    if (!analysis || !strategy || !selectedDirection) {
      return false;
    }

    const currentHash = buildCurrentStateHash();
    if (lastSavedHash && currentHash === lastSavedHash) {
      return true;
    }

    const saved = await handleSaveProject(true);
    if (!saved) {
      return false;
    }

    setSaveMessage("Project auto-saved before continuing.");
    return true;
  }

  async function handleOpenProductionStudio() {
    const ready = await ensureSavedBeforeBuild();

    if (!ready || !analysis || !strategy || !selectedDirection) {
      return;
    }

    const nowIso = new Date().toISOString();
    const inferredViralScore = Math.max(
      65,
      Math.min(
        98,
        58 + (analysis.whatMakesThisContentEffective.length * 6) + (analysis.whatYouCanLearn.length * 4),
      ),
    );
    const optimizationNotes = analysis.whatYouCanLearn.slice(0, 4).join(" | ") || "Refine hook timing, visual pacing, and CTA framing for stronger conversion.";

    saveWorkflowBridgeRecord({
      clearFields: ["contentStudio"],
      clearMilestones: ["p4_production", "p5_publishing"],
      p3_viralReview: {
        approvedCaption: strategy.strategySummary,
        viralScore: inferredViralScore,
        optimizationNotes,
        platform: resolvePlatformLabel(),
        selectedCreativeDirection: selectedDirection,
        approvedAt: nowIso,
        status: "content-approved-for-production",
      },
      viralScanner: {
        projectName: buildProjectName(),
        platform: resolvePlatformLabel(),
        originalReferenceLink: videoLink.trim(),
        manualDescription: manualDescription.trim(),
        analysisSummary: analysis.whatMakesThisContentEffective.join(" "),
        contentBlueprint: analysis.contentBlueprint,
        learningPoints: analysis.whatYouCanLearn,
        selectedCreativeDirection: selectedDirection,
        generatedStrategy: strategy,
        currentStep: activeStep,
        sourceContentTitle: buildProjectName(),
        sourceContentSummary: analysis.contentBlueprint.callToAction,
        sourceContentCaption: strategy.strategySummary,
        sourceContentCta: strategy.ctaDirection,
        sourceContentHashtags: strategy.visualStyleRecommendation,
        approvedAt: nowIso,
        viralScore: inferredViralScore,
        optimizationNotes,
      },
    });

    setSaveMessage("Project saved and sent to Production Studio.");
    router.push("/production-studio");
  }

  function openSavedProject(project: ViralScannerProject) {
    setActiveProjectId(project.id);
    setVideoLink(project.originalReferenceLink);
    setManualDescription(project.manualDescription);
    setScreenshotFile(null);
    setScreenshotReference(project.screenshotReference);
    setScreenshotName(project.screenshotReference ? "Saved screenshot reference" : "");
    setAnalysis(project.analysis);
    setAnalysisInputs({
      usedVideoLink: Boolean(project.originalReferenceLink),
      usedScreenshot: Boolean(project.screenshotReference),
      usedManualDescription: Boolean(project.manualDescription),
    });
    setSelectedDirection(project.selectedCreativeDirection);
    setStrategy(project.generatedStrategy);
    setActiveStep(project.currentStep);
    setLastSavedHash(hashProject(project));
    setSaveMessage("Project restored.");
    setErrorMessage("");
    setStrategyError("");
  }

  function deleteSavedProject(projectId: string) {
    const shouldDelete = window.confirm("Delete this project?\n\nThis action cannot be undone.");
    if (!shouldDelete) {
      return;
    }

    deleteViralScannerProject(projectId);
    const nextProjects = listViralScannerProjects();
    setSavedProjects(nextProjects);

    if (activeProjectId === projectId) {
      setActiveProjectId("");
      setLastSavedHash("");
      setSaveMessage("Active project deleted.");
    }
  }

  const analysisNotReadyMessage = "Run Analyze Inspiration to generate this section.";

  return (
    <section className="min-h-screen px-5 py-7 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1160px]">
        <header className="space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">Viral Scanner v1.0</p>
          <h1 className="max-w-4xl text-3xl font-semibold leading-tight text-white md:text-4xl">
            Learn why content works, then create your own original version
          </h1>
          <p className="max-w-3xl text-base leading-8 text-slate-300">
            This flow is designed as mentor guidance, not an analytics dashboard.
          </p>
          <div className="space-y-2 rounded-xl bg-slate-900/40 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">STEP {activeIndex + 1} OF {scannerSteps.length}</p>
            <div className="flex items-center gap-2.5" aria-label="Progress steps">
              {scannerSteps.map((step, index) => {
                const isCurrent = step.id === activeStep;
                const isPast = index < activeIndex;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    aria-label={`Go to ${step.label}`}
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      isCurrent ? "bg-cyan-300" : isPast ? "bg-slate-300" : "bg-slate-700 hover:bg-slate-500"
                    }`}
                  />
                );
              })}
            </div>
            <p className="text-sm text-slate-300">{scannerSteps[activeIndex]?.label}</p>
          </div>
        </header>

        <main className="mt-10 space-y-12">
          {activeStep === "analyze-inspiration" ? (
            <section className="space-y-6">
              <SectionHeader icon={<Link2 size={16} />} title="Analyze Inspiration" subtitle="What content?" />

              <div className="space-y-5">
                <label className="block space-y-2.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Paste Video Link</span>
                  <input
                    value={videoLink}
                    onChange={(event) => setVideoLink(event.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none"
                  />
                  <p className="text-xs text-slate-500">
                    Supported: TikTok, Facebook Reels, Instagram Reels, YouTube Shorts
                  </p>
                </label>

                <label className="block space-y-2.5">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                    <ImageUp size={12} /> Upload Screenshot
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setScreenshotFile(file);
                      setScreenshotName(file?.name ?? "");
                      if (!file) {
                        setScreenshotReference("");
                      }
                    }}
                    className="block w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-200"
                  />
                  {screenshotName ? <p className="text-xs text-slate-500">Selected: {screenshotName}</p> : null}
                </label>

                <label className="block space-y-2.5">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                    <MessageSquareText size={12} /> Describe the content manually
                  </span>
                  <textarea
                    value={manualDescription}
                    onChange={(event) => setManualDescription(event.target.value)}
                    placeholder="Describe what happens in the video, what hook it uses, and how it ends."
                    rows={5}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none"
                  />
                </label>
              </div>

              {errorMessage ? (
                <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {errorMessage}
                </div>
              ) : null}

              {isAnalyzing ? (
                <div className="space-y-3 rounded-xl bg-slate-900/60 px-4 py-4">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
                    <RefreshCw size={14} className="animate-spin" />
                    Analyzing Inspiration...
                  </p>
                  <ul className="space-y-2">
                    {thinkingSteps.map((step, index) => {
                      const isComplete = index < thinkingIndex;
                      const isCurrent = index === thinkingIndex;

                      return (
                        <li key={step} className="inline-flex items-center gap-2 text-sm text-slate-300">
                          {isComplete ? <Check size={14} className="text-emerald-300" /> : <span className={`h-2 w-2 rounded-full ${isCurrent ? "animate-pulse bg-cyan-300" : "bg-slate-600"}`} />}
                          {step}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void handleAnalyzeInspiration()}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-cyan-300/60"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Analyzing Inspiration...
                  </>
                ) : (
                  <>
                    Analyze Inspiration
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </section>
          ) : null}

          {activeStep === "what-makes-effective" ? (
            <section className="space-y-6">
              <SectionHeader
                icon={<Sparkles size={16} />}
                title="What Makes This Content Effective?"
                subtitle="Why does it work?"
              />

              {analysisInputs ? (
                <AnalysisTransparency inputs={analysisInputs} />
              ) : null}

              <div className="space-y-3">
                {analysis ? (
                  analysis.whatMakesThisContentEffective.map((point) => (
                    <ExplanationCard key={point} text={point} />
                  ))
                ) : (
                  <MissingContextNote headline={analysisNotReadyMessage} />
                )}
              </div>
            </section>
          ) : null}

          {activeStep === "content-blueprint" ? (
            <section className="space-y-6">
              <SectionHeader icon={<Workflow size={16} />} title="Content Blueprint" subtitle="How is it structured?" />

              <StoryFlow
                opening={analysis?.contentBlueprint.opening}
                problem={analysis?.contentBlueprint.problem}
                evidence={analysis?.contentBlueprint.evidence}
                solution={analysis?.contentBlueprint.solution}
                callToAction={analysis?.contentBlueprint.callToAction}
              />
            </section>
          ) : null}

          {activeStep === "what-you-can-learn" ? (
            <section className="space-y-6">
              <SectionHeader icon={<Milestone size={16} />} title="What You Can Learn" subtitle="What should I apply?" />

              <div className="space-y-4">
                {analysis ? (
                  analysis.whatYouCanLearn.map((lesson, index) => (
                    <LearningCard key={lesson} lesson={lesson} index={index} />
                  ))
                ) : (
                  <MissingContextNote headline={analysisNotReadyMessage} />
                )}
              </div>
            </section>
          ) : null}

          {activeStep === "creative-strategy-studio" ? (
            <section className="space-y-6">
              <SectionHeader icon={<Target size={16} />} title="Creative Strategy Studio" subtitle="Choose one direction" />

              <p className="text-sm leading-7 text-slate-300">
                Select one creative direction. The strategist will generate one focused strategy framework.
              </p>

              <div className="space-y-3">
                {strategyDirections.map((direction) => {
                  const Icon = direction.icon;
                  const isSelected = selectedDirection === direction.id;

                  return (
                    <button
                      key={direction.id}
                      type="button"
                      onClick={() => void handleSelectDirection(direction.id)}
                      disabled={isGeneratingStrategy}
                      className={`w-full rounded-xl border px-4 py-4 text-left transition ${
                        isSelected
                          ? "border-cyan-300 bg-cyan-500/10"
                          : "border-slate-700 bg-slate-900/70 hover:border-slate-500"
                      } disabled:cursor-not-allowed disabled:opacity-80`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
                            <Icon size={14} className={isSelected ? "text-cyan-200" : "text-slate-400"} />
                            {direction.label}
                          </p>
                          <p className="mt-1 text-sm leading-7 text-slate-300">{direction.description}</p>
                        </div>
                        {isSelected ? <Check size={16} className="mt-0.5 text-cyan-200" /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedDirection && strategy ? (
                <div className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                    Why {strategyDirections.find((item) => item.id === selectedDirection)?.label}?
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-200">{buildWhyThisStrategyParagraph(strategy)}</p>
                </div>
              ) : null}

              {isGeneratingStrategy ? (
                <div className="inline-flex items-center gap-2 rounded-lg bg-slate-900/60 px-4 py-3 text-sm text-cyan-100">
                  <RefreshCw size={14} className="animate-spin" />
                  Generating strategy...
                </div>
              ) : null}

              {strategyError ? (
                <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {strategyError}
                </div>
              ) : null}

              {strategy ? (
                <div className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveProject()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                    >
                      Save Project
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void (async () => {
                          const ready = await ensureSavedBeforeBuild();
                          if (ready) {
                            setActiveStep("continue-content-creator");
                          }
                        })();
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                    >
                      Build This Content
                    </button>
                  </div>

                  {saveMessage ? (
                    <p className="text-sm text-emerald-200">{saveMessage}</p>
                  ) : null}

                  <section className="space-y-3">
                    <h3 className="text-xl font-semibold text-white">Saved Projects</h3>
                    {savedProjects.length ? (
                      <div className="space-y-3">
                        {savedProjects.map((project) => (
                          <article key={project.id} className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-4">
                            <p className="text-sm font-semibold text-slate-100">{project.projectName}</p>
                            <p className="mt-1 text-sm text-slate-300">{project.platform || "Unknown"}</p>
                            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-400">
                              <Calendar size={12} />
                              Last Modified: {new Date(project.updatedAt).toLocaleString()}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.13em] text-cyan-200">
                              Selected Strategy: {strategyDirections.find((item) => item.id === project.selectedCreativeDirection)?.label || "Not selected"}
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openSavedProject(project)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-400"
                              >
                                <FolderOpen size={12} />
                                Open
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteSavedProject(project.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/40 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:border-rose-300"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <PlaceholderNote text="No saved projects yet. Save a strategy to resume later." />
                    )}
                  </section>

                  <BriefSummaryFlow strategy={strategy} />

                  <section className="space-y-3">
                    <h3 className="text-xl font-semibold text-white">Creative Direction</h3>
                    <div className="space-y-3">
                      <BriefLine label="Goal" value={extractGoal(strategy)} />
                      <BriefLine label="Audience" value={strategy.audience} />
                      <BriefLine label="Tone" value={strategy.tone} />
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-xl font-semibold text-white">Story Blueprint</h3>
                    <div className="space-y-3">
                      <BriefLine label="Hook" value={strategy.hookDirection} />
                      <BriefLine label="Story Structure" value={strategy.storyStructure} />
                      <BriefLine label="CTA" value={strategy.ctaDirection} />
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-xl font-semibold text-white">Visual Direction</h3>
                    <VisualDirectionChips text={strategy.visualStyleRecommendation} />
                  </section>

                  <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-4">
                    <h3 className="text-base font-semibold text-white">Refine Strategy</h3>
                    <p className="text-sm text-slate-300">
                      Fine-tune the brief by adjusting tone, audience, and platform.
                    </p>
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Tone</span>
                        <select
                          value={refineTone}
                          onChange={(event) => setRefineTone(event.target.value as RefineTone)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none"
                        >
                          <option value="auto">Auto</option>
                          <option value="confident">Confident</option>
                          <option value="friendly">Friendly</option>
                          <option value="premium">Premium</option>
                          <option value="bold">Bold</option>
                        </select>
                      </label>

                      <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Audience</span>
                        <select
                          value={refineAudience}
                          onChange={(event) => setRefineAudience(event.target.value as RefineAudience)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none"
                        >
                          <option value="auto">Auto</option>
                          <option value="beginners">Beginners</option>
                          <option value="growth-marketers">Growth Marketers</option>
                          <option value="small-business-owners">Small Business Owners</option>
                          <option value="creators">Creators</option>
                        </select>
                      </label>

                      <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Platform</span>
                        <select
                          value={refinePlatform}
                          onChange={(event) => setRefinePlatform(event.target.value as RefinePlatform)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none"
                        >
                          <option value="auto">Auto</option>
                          <option value="tiktok">TikTok</option>
                          <option value="instagram-reels">Instagram Reels</option>
                          <option value="youtube-shorts">YouTube Shorts</option>
                          <option value="facebook-reels">Facebook Reels</option>
                        </select>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleRefineStrategy()}
                      disabled={isGeneratingStrategy}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isGeneratingStrategy ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Refining...
                        </>
                      ) : (
                        "Refine Strategy"
                      )}
                    </button>
                  </section>
                </div>
              ) : (
                <PlaceholderNote text="Choose one direction to generate a strategy framework." />
              )}
            </section>
          ) : null}

          {activeStep === "continue-content-creator" ? (
            <section className="space-y-6">
              <SectionHeader
                icon={<Clapperboard size={16} />}
                title="Continue to Production Studio"
                subtitle="What happens next?"
              />

              <p className="text-sm leading-7 text-slate-300">
                ✓ CONTENT APPROVED FOR PRODUCTION
              </p>

              <button
                type="button"
                disabled={!strategy}
                onClick={() => {
                  void handleOpenProductionStudio();
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-cyan-300/60"
              >
                Initialize Production Studio
                <Clapperboard size={16} />
              </button>
              {saveMessage ? <p className="text-sm text-emerald-200">{saveMessage}</p> : null}
              <p className="text-sm text-slate-400">The saved strategy bridge will prefill Production Studio automatically.</p>
            </section>
          ) : null}

          {activeStep !== "analyze-inspiration" ? (
            <div className="border-t border-slate-800/80 pt-6">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/50 px-4 py-3">
              <button
                type="button"
                onClick={goPreviousStep}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500"
              >
                <ArrowRight size={14} className="rotate-180" />
                Back
              </button>

              {nextStep ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeStep === "creative-strategy-studio") {
                      void (async () => {
                        const ready = await ensureSavedBeforeBuild();
                        if (ready) {
                          goNextStep();
                        }
                      })();
                      return;
                    }

                    goNextStep();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-cyan-300/60"
                  disabled={isAnalyzing || (activeStep === "creative-strategy-studio" && !strategy)}
                >
                  {activeStep === "creative-strategy-studio" ? "Build This Content" : "Continue"}
                  <ArrowRight size={14} />
                </button>
              ) : null}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </section>
  );
}

function PlaceholderNote({ text }: { text: string }) {
  return <p className="rounded-xl bg-slate-900/70 px-4 py-4 text-sm leading-7 text-slate-400">{text}</p>;
}

function MissingContextNote({ headline }: { headline: string }) {
  return (
    <div className="space-y-3 rounded-xl bg-slate-900/70 px-4 py-4 text-sm leading-7 text-slate-300">
      <p className="font-medium text-slate-200">{headline}</p>
      <p>I could not confidently infer this section because:</p>
      <ul className="space-y-1.5 text-slate-400">
        <li>- no description was provided</li>
        <li>- no screenshot was uploaded</li>
        <li>- the video link is reference-only and not directly viewable here</li>
      </ul>
      <p className="text-cyan-100">Providing a short description will significantly improve the analysis.</p>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="space-y-2">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">
        {icon} {subtitle}
      </p>
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
    </div>
  );
}

function ExplanationCard({ text }: { text: string }) {
  return <div className="rounded-xl bg-slate-900/70 px-5 py-4 text-base leading-8 text-slate-100">{text}</div>;
}

function BlueprintStep({ label }: { label: string }) {
  return <div className="rounded-xl bg-slate-900/70 px-4 py-3 text-sm font-medium leading-7 text-slate-100">{label}</div>;
}

function BlueprintArrow() {
  return (
    <div className="flex justify-center py-1 text-slate-500">
      <MoveDown size={16} />
    </div>
  );
}

function AnalysisTransparency({ inputs }: { inputs: AnalysisInputSnapshot }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-3 rounded-lg bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
      <span className="font-semibold uppercase tracking-[0.12em] text-slate-400">Analysis based on:</span>
      <InputStatus label="Manual Description" used={inputs.usedManualDescription} />
      <InputStatus label="Screenshot" used={inputs.usedScreenshot} />
      <InputStatus label="Video Link (reference only)" used={inputs.usedVideoLink} />
    </div>
  );
}

function InputStatus({ label, used }: { label: string; used: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {used ? <Check size={12} className="text-emerald-300" /> : <X size={12} className="text-slate-500" />}
      {label}
    </span>
  );
}

function normalizeBlueprintValue(value?: string) {
  if (!value || value === "Not clearly present.") {
    return "I could not clearly identify this from the provided context. A short description can improve this section.";
  }

  return value;
}

function StoryFlow({
  opening,
  problem,
  evidence,
  solution,
  callToAction,
}: {
  opening?: string;
  problem?: string;
  evidence?: string;
  solution?: string;
  callToAction?: string;
}) {
  const steps = [
    { label: "HOOK", value: normalizeBlueprintValue(opening) },
    { label: "PROBLEM", value: normalizeBlueprintValue(problem) },
    { label: "PROOF", value: normalizeBlueprintValue(evidence) },
    { label: "SOLUTION", value: normalizeBlueprintValue(solution) },
    { label: "CALL TO ACTION", value: normalizeBlueprintValue(callToAction) },
  ];

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.label} className="space-y-2">
          <div className="rounded-xl bg-slate-900/70 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">{step.label}</p>
            <p className="mt-1.5 text-sm leading-7 text-slate-100">{step.value}</p>
          </div>
          {index < steps.length - 1 ? <BlueprintArrow /> : null}
        </div>
      ))}
    </div>
  );
}

function inferWhyItMatters(lesson: string) {
  const lowered = lesson.toLowerCase();

  if (lowered.includes("hook") || lowered.includes("opening")) {
    return "It improves the first impression and helps stop the scroll faster.";
  }

  if (lowered.includes("payoff") || lowered.includes("outcome")) {
    return "Viewers stay longer when they quickly understand the value they will get.";
  }

  if (lowered.includes("short") || lowered.includes("scene") || lowered.includes("pacing")) {
    return "Better pacing keeps attention high and makes your message easier to follow.";
  }

  return "It makes your message clearer and more actionable for viewers.";
}

function inferHowToApply(lesson: string) {
  const lowered = lesson.toLowerCase();

  if (lowered.includes("hook") || lowered.includes("opening")) {
    return "Start the first 1-2 seconds with one specific problem or bold promise.";
  }

  if (lowered.includes("payoff") || lowered.includes("outcome")) {
    return "Reveal the result earlier, then explain how it was achieved.";
  }

  if (lowered.includes("short") || lowered.includes("scene") || lowered.includes("pacing")) {
    return "Break your idea into smaller beats and remove any filler transitions.";
  }

  return "Rewrite the idea in one sentence, then build each scene around that sentence.";
}

function LearningCard({ lesson, index }: { lesson: string; index: number }) {
  return (
    <article className="rounded-xl bg-slate-900/70 px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Lesson {index + 1}</p>
      <p className="mt-1.5 text-base text-slate-100">{lesson}</p>
      <div className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
        <p><span className="font-semibold text-slate-100">Why it matters:</span> {inferWhyItMatters(lesson)}</p>
        <p><span className="font-semibold text-slate-100">How to apply:</span> {inferHowToApply(lesson)}</p>
      </div>
    </article>
  );
}

function BriefLine({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl bg-slate-900/70 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">{label}</p>
      <p className="mt-1.5 text-sm leading-7 text-slate-100">{value}</p>
    </article>
  );
}

function firstSentence(text: string) {
  const parts = text.trim().split(/(?<=[.!?])\s+/);
  return parts[0] || text;
}

function extractGoal(strategy: CreativeStrategy) {
  return firstSentence(strategy.strategySummary);
}

function extractCoreMessage(strategy: CreativeStrategy) {
  return firstSentence(strategy.hookDirection);
}

function extractViewerEmotion(strategy: CreativeStrategy) {
  return firstSentence(strategy.tone);
}

function extractExpectedResult(strategy: CreativeStrategy) {
  return firstSentence(strategy.ctaDirection);
}

function buildWhyThisStrategyParagraph(strategy: CreativeStrategy) {
  return `${firstSentence(strategy.strategySummary)} This direction preserves the strongest part of the inspiration while keeping your execution original through ${firstSentence(strategy.storyStructure).toLowerCase()}`;
}

function BriefSummaryFlow({ strategy }: { strategy: CreativeStrategy }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xl font-semibold text-white">Strategy Snapshot</h3>
      <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-4">
        <SummaryRow label="Goal" value={extractGoal(strategy)} />
        <SummaryArrow />
        <SummaryRow label="Core Message" value={extractCoreMessage(strategy)} />
        <SummaryArrow />
        <SummaryRow label="Viewer Emotion" value={extractViewerEmotion(strategy)} />
        <SummaryArrow />
        <SummaryRow label="Expected Result" value={extractExpectedResult(strategy)} />
      </div>
    </section>
  );
}

function SummaryArrow() {
  return <p className="text-center text-cyan-300">↓</p>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">{label}</p>
      <p className="mt-1 text-sm leading-7 text-slate-100">{value}</p>
    </div>
  );
}

function VisualDirectionChips({ text }: { text: string }) {
  const chips = parseVisualStyleChips(text);

  return (
    <div className="space-y-3 rounded-xl bg-slate-900/70 px-4 py-4">
      <p className="text-sm leading-7 text-slate-200">{firstSentence(text)}</p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span key={chip} className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function parseVisualStyleChips(text: string) {
  const candidateMap: Array<{ label: string; patterns: RegExp[] }> = [
    { label: "Talking Head", patterns: [/talking\s*head/i] },
    { label: "Drone", patterns: [/drone/i] },
    { label: "B-roll", patterns: [/b[\s-]?roll/i] },
    { label: "Screen Recording", patterns: [/screen\s*record/i] },
    { label: "Text Overlay", patterns: [/text\s*overlay|caption|on-screen\s*text/i] },
    { label: "Before/After", patterns: [/before\s*\/\s*after|before\s*and\s*after/i] },
    { label: "Quick Cuts", patterns: [/quick\s*cut|fast\s*cut/i] },
    { label: "Split Screen", patterns: [/split\s*screen/i] },
    { label: "Numbered Steps", patterns: [/numbered|step\s*[0-9]|three\s*steps?/i] },
  ];

  const chips = candidateMap
    .filter((candidate) => candidate.patterns.some((pattern) => pattern.test(text)))
    .map((candidate) => candidate.label);

  if (!chips.length) {
    return ["Clean Framing", "Text Overlay", "Consistent Branding"];
  }

  return chips;
}
