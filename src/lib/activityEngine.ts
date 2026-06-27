import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const ACTIVITY_TYPES = [
  "opportunity_created",
  "opportunity_updated",
  "converted_to_project",
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];

export type ActivityMetadata = Record<string, unknown>;

export type CreateActivityInput = {
  activityType: ActivityType;
  title: string;
  summary?: string | null;
  opportunityId?: string | null;
  projectId?: string | null;
  sourceTable?: string | null;
  sourceId?: string | null;
  metadata?: ActivityMetadata;
};

export type ActivityRow = {
  id: string;
  activity_type: ActivityType;
  title: string;
  summary: string | null;
  opportunity_id: string | null;
  project_id: string | null;
  source_table: string | null;
  source_id: string | null;
  metadata: ActivityMetadata;
  created_at: string;
};

type MeaningfulOpportunityField =
  | "stage"
  | "next_action"
  | "follow_up_date"
  | "estimated_commission"
  | "title"
  | "opportunity_type";

export const MEANINGFUL_OPPORTUNITY_ACTIVITY_FIELDS: readonly MeaningfulOpportunityField[] = [
  "stage",
  "next_action",
  "follow_up_date",
  "estimated_commission",
  "title",
  "opportunity_type",
];

type OpportunityActivityComparable = Partial<Record<MeaningfulOpportunityField, unknown>>;

const ACTIVITY_SELECT = [
  "id",
  "activity_type",
  "title",
  "summary",
  "opportunity_id",
  "project_id",
  "source_table",
  "source_id",
  "metadata",
  "created_at",
].join(", ");

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeComparableValue(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  return value;
}

function asActivityRow(value: unknown) {
  return value as ActivityRow;
}

function isMissingActivitiesTableError(message: string) {
  return (
    message.includes("Could not find the table 'public.activities'") ||
    message.includes('relation "public.activities" does not exist') ||
    message.includes('relation "activities" does not exist')
  );
}

export async function createActivity(input: CreateActivityInput) {
  const title = normalizeText(input.title);
  const opportunityId = normalizeText(input.opportunityId);
  const projectId = normalizeText(input.projectId);

  if (!title) {
    throw new Error("activity title is required");
  }

  if (!opportunityId && !projectId) {
    throw new Error("activity requires opportunityId or projectId");
  }

  const { data, error } = await supabaseAdmin
    .from("activities")
    .insert({
      activity_type: input.activityType,
      title,
      summary: normalizeText(input.summary) || null,
      opportunity_id: opportunityId || null,
      project_id: projectId || null,
      source_table: normalizeText(input.sourceTable) || null,
      source_id: normalizeText(input.sourceId) || null,
      metadata: input.metadata ?? {},
    })
    .select(ACTIVITY_SELECT)
    .single();

  if (error || !data) {
    const message = error?.message ?? "failed to create activity";

    if (isMissingActivitiesTableError(message)) {
      console.error("activity logging skipped", message);
      return null;
    }

    throw new Error(message);
  }

  return asActivityRow(data);
}

export function getMeaningfulOpportunityChangedFields(
  previous: OpportunityActivityComparable,
  next: OpportunityActivityComparable,
) {
  return MEANINGFUL_OPPORTUNITY_ACTIVITY_FIELDS.filter((field) => {
    return normalizeComparableValue(previous[field]) !== normalizeComparableValue(next[field]);
  });
}