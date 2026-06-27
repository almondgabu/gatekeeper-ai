import { NextResponse } from "next/server";
import {
  OPPORTUNITY_STAGES,
  OPPORTUNITY_TYPES,
  OPPORTUNITY_URGENCY,
  type OpportunityRecord,
  type OpportunityStage,
  type OpportunityType,
  type OpportunityUrgency,
} from "@/lib/opportunityIntelligence";
import {
  createActivity,
  getMeaningfulOpportunityChangedFields,
} from "@/lib/activityEngine";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type OpportunityRow = OpportunityRecord;

function asOpportunityRow(value: unknown) {
  return value as OpportunityRow;
}

function asOpportunityRows(value: unknown) {
  return value as OpportunityRow[];
}

function isOpportunityType(value: string): value is OpportunityType {
  return (OPPORTUNITY_TYPES as readonly string[]).includes(value);
}

function isOpportunityStage(value: string): value is OpportunityStage {
  return (OPPORTUNITY_STAGES as readonly string[]).includes(value);
}

function isOpportunityUrgency(value: string): value is OpportunityUrgency {
  return (OPPORTUNITY_URGENCY as readonly string[]).includes(value);
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalText(value: unknown) {
  const normalized = normalizeText(value);
  return normalized ? normalized : null;
}

function parseOptionalDate(value: unknown) {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "invalid";
}

function parseOptionalNumber(value: unknown) {
  if (value === null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  if (value === undefined || value === "") {
    return undefined;
  }

  return NaN;
}

function parseChecklist(value: unknown) {
  if (value === null) {
    return [];
  }

  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return "invalid";
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return normalized;
}

const OPPORTUNITY_SELECT = [
  "id",
  "title",
  "opportunity_type",
  "stage",
  "contact_name",
  "location_summary",
  "description",
  "estimated_value",
  "estimated_commission",
  "urgency",
  "next_action",
  "follow_up_date",
  "qualification_notes",
  "checklist_completed",
  "converted_project_id",
  "created_at",
  "updated_at",
].join(", ");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const opportunityId = normalizeText(searchParams.get("id"));
  const type = normalizeText(searchParams.get("type"));
  const stage = normalizeText(searchParams.get("stage"));

  if (opportunityId) {
    const { data, error } = await supabaseAdmin
      .from("opportunities")
      .select(OPPORTUNITY_SELECT)
      .eq("id", opportunityId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({ opportunity: asOpportunityRow(data) });
  }

  let query = supabaseAdmin
    .from("opportunities")
    .select(OPPORTUNITY_SELECT)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (type) {
    if (!isOpportunityType(type)) {
      return NextResponse.json({ error: "invalid opportunity type" }, { status: 400 });
    }

    query = query.eq("opportunity_type", type);
  }

  if (stage) {
    if (!isOpportunityStage(stage)) {
      return NextResponse.json({ error: "invalid opportunity stage" }, { status: 400 });
    }

    query = query.eq("stage", stage);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ opportunities: asOpportunityRows(data ?? []) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = normalizeText(body?.title);
  const opportunityType = normalizeText(body?.opportunityType);
  const stageValue = normalizeText(body?.stage);
  const urgencyValue = normalizeText(body?.urgency);
  const followUpDate = parseOptionalDate(body?.followUpDate);
  const estimatedValue = parseOptionalNumber(body?.estimatedValue);
  const estimatedCommission = parseOptionalNumber(body?.estimatedCommission);
  const checklistCompleted = parseChecklist(body?.checklistCompleted);

  if (!title || !opportunityType) {
    return NextResponse.json({ error: "title and opportunityType are required" }, { status: 400 });
  }

  if (!isOpportunityType(opportunityType)) {
    return NextResponse.json({ error: "invalid opportunityType" }, { status: 400 });
  }

  const stage = stageValue || "new";
  const urgency = urgencyValue || "medium";

  if (!isOpportunityStage(stage)) {
    return NextResponse.json({ error: "invalid stage" }, { status: 400 });
  }

  if (!isOpportunityUrgency(urgency)) {
    return NextResponse.json({ error: "invalid urgency" }, { status: 400 });
  }

  if (followUpDate === "invalid") {
    return NextResponse.json({ error: "followUpDate must use YYYY-MM-DD format" }, { status: 400 });
  }

  if (Number.isNaN(estimatedValue) || Number.isNaN(estimatedCommission)) {
    return NextResponse.json({ error: "estimatedValue and estimatedCommission must be numeric" }, { status: 400 });
  }

  if (checklistCompleted === "invalid") {
    return NextResponse.json({ error: "checklistCompleted must be an array of strings" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .insert({
      title,
      opportunity_type: opportunityType,
      stage,
      contact_name: parseOptionalText(body?.contactName),
      location_summary: parseOptionalText(body?.locationSummary),
      description: parseOptionalText(body?.description),
      estimated_value: estimatedValue ?? null,
      estimated_commission: estimatedCommission ?? null,
      urgency,
      next_action: parseOptionalText(body?.nextAction),
      follow_up_date: followUpDate ?? null,
      qualification_notes: parseOptionalText(body?.qualificationNotes),
      checklist_completed: checklistCompleted ?? [],
    })
    .select(OPPORTUNITY_SELECT)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "failed to create opportunity" }, { status: 500 });
  }

  const createdOpportunity = asOpportunityRow(data);

  await createActivity({
    activityType: "opportunity_created",
    title: "Opportunity created",
    summary: `${createdOpportunity.title} created as ${createdOpportunity.stage}`,
    opportunityId: createdOpportunity.id,
    sourceTable: "opportunities",
    sourceId: createdOpportunity.id,
    metadata: {
      opportunityType: createdOpportunity.opportunity_type,
      stage: createdOpportunity.stage,
    },
  });

  return NextResponse.json({ opportunity: createdOpportunity });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const opportunityId = normalizeText(body?.opportunityId);

  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId required" }, { status: 400 });
  }

  const { data: existingOpportunity, error: existingOpportunityError } = await supabaseAdmin
    .from("opportunities")
    .select(OPPORTUNITY_SELECT)
    .eq("id", opportunityId)
    .single();

  if (existingOpportunityError || !existingOpportunity) {
    return NextResponse.json(
      { error: existingOpportunityError?.message ?? "opportunity not found" },
      { status: 404 },
    );
  }

  const currentOpportunity = asOpportunityRow(existingOpportunity);

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body?.title !== undefined) {
    const title = normalizeText(body.title);

    if (!title) {
      return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
    }

    updates.title = title;
  }

  if (body?.opportunityType !== undefined) {
    const opportunityType = normalizeText(body.opportunityType);

    if (!isOpportunityType(opportunityType)) {
      return NextResponse.json({ error: "invalid opportunityType" }, { status: 400 });
    }

    updates.opportunity_type = opportunityType;
  }

  if (body?.stage !== undefined) {
    const stage = normalizeText(body.stage);

    if (!isOpportunityStage(stage)) {
      return NextResponse.json({ error: "invalid stage" }, { status: 400 });
    }

    updates.stage = stage;
  }

  if (body?.urgency !== undefined) {
    const urgency = normalizeText(body.urgency);

    if (!isOpportunityUrgency(urgency)) {
      return NextResponse.json({ error: "invalid urgency" }, { status: 400 });
    }

    updates.urgency = urgency;
  }

  if (body?.contactName !== undefined) {
    updates.contact_name = parseOptionalText(body.contactName);
  }

  if (body?.locationSummary !== undefined) {
    updates.location_summary = parseOptionalText(body.locationSummary);
  }

  if (body?.description !== undefined) {
    updates.description = parseOptionalText(body.description);
  }

  if (body?.nextAction !== undefined) {
    updates.next_action = parseOptionalText(body.nextAction);
  }

  if (body?.qualificationNotes !== undefined) {
    updates.qualification_notes = parseOptionalText(body.qualificationNotes);
  }

  if (body?.followUpDate !== undefined) {
    const followUpDate = parseOptionalDate(body.followUpDate);

    if (followUpDate === "invalid") {
      return NextResponse.json({ error: "followUpDate must use YYYY-MM-DD format" }, { status: 400 });
    }

    updates.follow_up_date = followUpDate;
  }

  if (body?.estimatedValue !== undefined) {
    const estimatedValue = parseOptionalNumber(body.estimatedValue);

    if (Number.isNaN(estimatedValue)) {
      return NextResponse.json({ error: "estimatedValue must be numeric" }, { status: 400 });
    }

    updates.estimated_value = estimatedValue;
  }

  if (body?.estimatedCommission !== undefined) {
    const estimatedCommission = parseOptionalNumber(body.estimatedCommission);

    if (Number.isNaN(estimatedCommission)) {
      return NextResponse.json({ error: "estimatedCommission must be numeric" }, { status: 400 });
    }

    updates.estimated_commission = estimatedCommission;
  }

  if (body?.checklistCompleted !== undefined) {
    const checklistCompleted = parseChecklist(body.checklistCompleted);

    if (checklistCompleted === "invalid") {
      return NextResponse.json({ error: "checklistCompleted must be an array of strings" }, { status: 400 });
    }

    updates.checklist_completed = checklistCompleted;
  }

  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .update(updates)
    .eq("id", opportunityId)
    .select(OPPORTUNITY_SELECT)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "failed to update opportunity" }, { status: 500 });
  }

  const updatedOpportunity = asOpportunityRow(data);

  const changedFields = getMeaningfulOpportunityChangedFields(currentOpportunity, updatedOpportunity);

  if (changedFields.length > 0) {
    await createActivity({
      activityType: "opportunity_updated",
      title: "Opportunity updated",
      summary: changedFields.map((field) => field.replace(/_/g, " ")).join(", "),
      opportunityId: updatedOpportunity.id,
      sourceTable: "opportunities",
      sourceId: updatedOpportunity.id,
      metadata: {
        changedFields,
      },
    });
  }

  return NextResponse.json({ opportunity: updatedOpportunity });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const opportunityId = normalizeText(body?.opportunityId);

  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("opportunities").delete().eq("id", opportunityId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}