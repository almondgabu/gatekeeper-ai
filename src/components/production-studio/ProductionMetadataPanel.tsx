import { ProductionWorkspaceProject } from "@/types/production-studio";

type ProductionMetadataPanelProps = {
  project: ProductionWorkspaceProject;
};

function getValue(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") {
    return "Not provided";
  }
  return String(value);
}

function formatHashtags(tags: string[] | undefined): string {
  if (!tags || tags.length === 0) {
    return "Not provided";
  }

  return tags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`))
    .join(" ");
}

export default function ProductionMetadataPanel({
  project,
}: ProductionMetadataPanelProps) {
  const source = project.sourceMetadata;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">Production Metadata</h2>

      <div className="space-y-3 rounded-xl bg-slate-800/50 p-4 text-sm">
        <MetadataRow label="Status" value={project.status} />
        <MetadataRow label="Content Type" value={project.contentType} />
        <MetadataRow label="Platform" value={source?.platform} />
        <MetadataRow label="Target Audience" value={project.targetAudience} />
        <MetadataRow label="Difficulty" value={source?.difficulty} />
        <MetadataRow label="Production Time" value={source?.productionTime} />
        <MetadataRow label="Engagement Potential" value={source?.engagementPotential} />
        <MetadataRow label="Confidence Score" value={source?.confidenceScore} />
        <MetadataRow label="Hashtags" value={formatHashtags(project.tags)} />
        <MetadataRow label="Thumbnail Prompt" value={source?.thumbnailPrompt} multiline />
        <MetadataRow label="Key Visual Prompt" value={source?.keyVisualPrompt} multiline />
        <MetadataRow label="Animation Prompt" value={source?.animationPrompt} multiline />
      </div>
    </div>
  );
}

type MetadataRowProps = {
  label: string;
  value: string | number | undefined | null;
  multiline?: boolean;
};

function MetadataRow({ label, value, multiline = false }: MetadataRowProps) {
  return (
    <div className="border-b border-slate-700/50 pb-2 last:border-b-0 last:pb-0">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={multiline ? "mt-1 whitespace-pre-wrap text-slate-200" : "mt-1 text-slate-200"}>
        {getValue(value)}
      </p>
    </div>
  );
}
