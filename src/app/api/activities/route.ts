import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type ActivityRow = {
  id: string;
  activity_type: string;
  title: string;
  summary: string | null;
  opportunity_id: string | null;
  project_id: string | null;
  source_table: string | null;
  source_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

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

function parseLimit(value: string | null) {
  if (!value) {
    return 20;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return Math.min(parsed, 100);
}

function asActivityRows(value: unknown) {
  return value as ActivityRow[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const opportunityId = normalizeText(searchParams.get("opportunityId"));
  const projectId = normalizeText(searchParams.get("projectId"));
  const limit = parseLimit(searchParams.get("limit"));

  if (!opportunityId && !projectId) {
    return NextResponse.json(
      { error: "opportunityId or projectId is required" },
      { status: 400 },
    );
  }

  if (limit === null) {
    return NextResponse.json({ error: "limit must be a positive integer" }, { status: 400 });
  }

  let scopedQuery = supabaseAdmin.from("activities").select(ACTIVITY_SELECT);

  if (opportunityId && projectId) {
    scopedQuery = scopedQuery.or(`opportunity_id.eq.${opportunityId},project_id.eq.${projectId}`);
  } else if (opportunityId) {
    scopedQuery = scopedQuery.eq("opportunity_id", opportunityId);
  } else {
    scopedQuery = scopedQuery.eq("project_id", projectId);
  }

  const { data, error } = await scopedQuery
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activities: asActivityRows(data ?? []) });
}