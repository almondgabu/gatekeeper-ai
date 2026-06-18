import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type ProjectMemoryRow = {
  id: string;
  project_id: string;
  memory_type: string;
  title: string;
  content: string;
  source_conversation_id: number | null;
  importance: number;
  created_at: string;
  updated_at: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectIdValue = searchParams.get("projectId");
  const memoryTypeValue = searchParams.get("memoryType");
  const projectId = typeof projectIdValue === "string" ? projectIdValue.trim() : "";
  const memoryType = typeof memoryTypeValue === "string" ? memoryTypeValue.trim() : "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  let query = supabaseAdmin
    .from("project_memories")
    .select("id, project_id, memory_type, title, content, source_conversation_id, importance, created_at, updated_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (memoryType) {
    query = query.eq("memory_type", memoryType);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ memories: (data ?? []) as ProjectMemoryRow[] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
  const memoryType = typeof body?.memoryType === "string" ? body.memoryType.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const sourceConversationId =
    typeof body?.sourceConversationId === "number"
      ? body.sourceConversationId
      : typeof body?.sourceConversationId === "string" && body.sourceConversationId.trim()
        ? Number(body.sourceConversationId)
        : null;
  const importance =
    typeof body?.importance === "number"
      ? body.importance
      : typeof body?.importance === "string" && body.importance.trim()
        ? Number(body.importance)
        : 1;

  if (!projectId || !memoryType || !title || !content) {
    return NextResponse.json(
      { error: "projectId, memoryType, title, and content are required" },
      { status: 400 }
    );
  }

  if (sourceConversationId !== null && Number.isNaN(sourceConversationId)) {
    return NextResponse.json({ error: "sourceConversationId must be a number" }, { status: 400 });
  }

  if (!Number.isInteger(importance)) {
    return NextResponse.json({ error: "importance must be an integer" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("project_memories")
    .insert({
      project_id: projectId,
      memory_type: memoryType,
      title,
      content,
      source_conversation_id: sourceConversationId,
      importance,
    })
    .select("id, project_id, memory_type, title, content, source_conversation_id, importance, created_at, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "failed to create project memory" },
      { status: 500 }
    );
  }

  return NextResponse.json({ memory: data as ProjectMemoryRow });
}