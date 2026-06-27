import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function generateUniqueProjectName(baseName: string) {
  const normalizedBase = baseName.trim() || "Converted Opportunity";

  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("name")
    .ilike("name", `${normalizedBase}%`);

  if (error) {
    throw new Error(error.message);
  }

  const existingNames = new Set((data ?? []).map((row) => row.name));

  if (!existingNames.has(normalizedBase)) {
    return normalizedBase;
  }

  let suffix = 2;

  while (existingNames.has(`${normalizedBase} (${suffix})`)) {
    suffix += 1;
  }

  return `${normalizedBase} (${suffix})`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const opportunityId = normalizeText(body?.opportunityId);

  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId required" }, { status: 400 });
  }

  const { data: opportunity, error: opportunityError } = await supabaseAdmin
    .from("opportunities")
    .select("id, title, stage, converted_project_id")
    .eq("id", opportunityId)
    .single();

  if (opportunityError || !opportunity) {
    return NextResponse.json({ error: opportunityError?.message ?? "opportunity not found" }, { status: 404 });
  }

  if (opportunity.converted_project_id) {
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, name, created_at")
      .eq("id", opportunity.converted_project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: projectError?.message ?? "converted project not found" }, { status: 404 });
    }

    return NextResponse.json({ project, opportunityId: opportunity.id, alreadyConverted: true });
  }

  const projectName = await generateUniqueProjectName(opportunity.title);
  const { data: project, error: projectError } = await supabaseAdmin
    .from("projects")
    .insert([{ name: projectName }])
    .select("id, name, created_at")
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: projectError?.message ?? "failed to create project" }, { status: 500 });
  }

  const { data: updatedOpportunity, error: updateError } = await supabaseAdmin
    .from("opportunities")
    .update({
      stage: "converted",
      converted_project_id: project.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opportunityId)
    .select("id, title, stage, converted_project_id, updated_at")
    .single();

  if (updateError || !updatedOpportunity) {
    return NextResponse.json({ error: updateError?.message ?? "failed to convert opportunity" }, { status: 500 });
  }

  return NextResponse.json({
    project,
    opportunity: updatedOpportunity,
    alreadyConverted: false,
  });
}