import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type ProjectTaskRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  source_conversation_id: number | null;
  created_at: string;
  updated_at: string;
};

const TASK_STATUSES = new Set(["open", "completed"]);

function parseOptionalConversationId(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }

  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }

  return null;
}

function parseOptionalDueDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "invalid";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectIdValue = searchParams.get("projectId");
  const statusValue = searchParams.get("status");
  const projectId = typeof projectIdValue === "string" ? projectIdValue.trim() : "";
  const status = typeof statusValue === "string" ? statusValue.trim().toLowerCase() : "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  let query = supabaseAdmin
    .from("project_tasks")
    .select("id, project_id, title, description, status, due_date, source_conversation_id, created_at, updated_at")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: (data ?? []) as ProjectTaskRow[] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const dueDate = parseOptionalDueDate(body?.dueDate);
  const sourceConversationId = parseOptionalConversationId(body?.sourceConversationId);

  if (!projectId || !title) {
    return NextResponse.json({ error: "projectId and title are required" }, { status: 400 });
  }

  if (dueDate === "invalid") {
    return NextResponse.json({ error: "dueDate must use YYYY-MM-DD format" }, { status: 400 });
  }

  if (sourceConversationId !== null && Number.isNaN(sourceConversationId)) {
    return NextResponse.json({ error: "sourceConversationId must be a number" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("project_tasks")
    .insert({
      project_id: projectId,
      title,
      description: description || null,
      due_date: dueDate,
      source_conversation_id: sourceConversationId,
    })
    .select("id, project_id, title, description, status, due_date, source_conversation_id, created_at, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "failed to create project task" },
      { status: 500 }
    );
  }

  return NextResponse.json({ task: data as ProjectTaskRow });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const taskId = typeof body?.taskId === "string" ? body.taskId.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : undefined;
  const description = typeof body?.description === "string" ? body.description.trim() : undefined;
  const status = typeof body?.status === "string" ? body.status.trim().toLowerCase() : undefined;
  const dueDate = body?.dueDate === null ? null : parseOptionalDueDate(body?.dueDate);
  const sourceConversationId = body?.sourceConversationId === null
    ? null
    : parseOptionalConversationId(body?.sourceConversationId);

  if (!taskId) {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
  }

  if (status !== undefined && !TASK_STATUSES.has(status)) {
    return NextResponse.json({ error: "status must be open or completed" }, { status: 400 });
  }

  if (dueDate === "invalid") {
    return NextResponse.json({ error: "dueDate must use YYYY-MM-DD format" }, { status: 400 });
  }

  if (sourceConversationId !== null && sourceConversationId !== undefined && Number.isNaN(sourceConversationId)) {
    return NextResponse.json({ error: "sourceConversationId must be a number" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) {
    if (!title) {
      return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
    }

    updates.title = title;
  }

  if (description !== undefined) {
    updates.description = description || null;
  }

  if (status !== undefined) {
    updates.status = status;
  }

  if (dueDate !== undefined) {
    updates.due_date = dueDate;
  }

  if (sourceConversationId !== undefined) {
    updates.source_conversation_id = sourceConversationId;
  }

  const { data, error } = await supabaseAdmin
    .from("project_tasks")
    .update(updates)
    .eq("id", taskId)
    .select("id, project_id, title, description, status, due_date, source_conversation_id, created_at, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "failed to update project task" },
      { status: 500 }
    );
  }

  return NextResponse.json({ task: data as ProjectTaskRow });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const taskId = typeof body?.taskId === "string" ? body.taskId.trim() : "";

  if (!taskId) {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("project_tasks").delete().eq("id", taskId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}