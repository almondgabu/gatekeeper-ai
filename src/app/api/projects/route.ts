import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const TEMP_CONFIRMATION_PASSWORD = "782185";

type ProjectRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string | null;
};

type DocumentRow = {
  id: string;
  filename: string | null;
  storage_path: string;
  status: string | null;
  created_at?: string | null;
  file_size?: number | null;
  project_id?: string | null;
};

function countDocumentsByProject(documents: Array<{ project_id: string | null }>) {
  const counts = new Map<string, number>();

  for (const document of documents) {
    if (typeof document.project_id === "string" && document.project_id.trim()) {
      counts.set(document.project_id, (counts.get(document.project_id) ?? 0) + 1);
    }
  }

  return counts;
}

function countRowsByProject(rows: Array<{ project_id: string | null }>) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (typeof row.project_id === "string" && row.project_id.trim()) {
      counts.set(row.project_id, (counts.get(row.project_id) ?? 0) + 1);
    }
  }

  return counts;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id");
  const includeDocuments = searchParams.get("includeDocuments") === "1";
  const projectId = typeof idParam === "string" && idParam.trim() ? idParam.trim() : null;

  if (projectId) {
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, name, created_at")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: projectError?.message ?? "project not found" }, { status: 404 });
    }

    const { data: documents, error: documentError } = await supabaseAdmin
      .from("documents")
      .select("id, filename, storage_path, status, created_at, file_size, project_id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (documentError) {
      return NextResponse.json({ error: documentError.message }, { status: 500 });
    }

    return NextResponse.json({
      project: {
        ...(project as ProjectRow),
        documentCount: (documents ?? []).length,
      },
      documents: includeDocuments ? ((documents ?? []) as DocumentRow[]) : undefined,
    });
  }

  const [
    { data: projects, error: projectsError },
    { data: documents, error: documentsError },
    { data: conversations, error: conversationsError },
    { data: memories, error: memoriesError },
  ] =
    await Promise.all([
      supabaseAdmin.from("projects").select("id, name, created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("documents").select("project_id"),
      supabaseAdmin.from("conversations").select("project_id"),
      supabaseAdmin.from("project_memories").select("project_id"),
    ]);

  if (projectsError) {
    return NextResponse.json({ error: projectsError.message }, { status: 500 });
  }

  if (documentsError) {
    return NextResponse.json({ error: documentsError.message }, { status: 500 });
  }

  if (conversationsError) {
    return NextResponse.json({ error: conversationsError.message }, { status: 500 });
  }

  if (memoriesError) {
    return NextResponse.json({ error: memoriesError.message }, { status: 500 });
  }

  const documentCounts = countDocumentsByProject((documents ?? []) as Array<{ project_id: string | null }>);
  const conversationCounts = countRowsByProject((conversations ?? []) as Array<{ project_id: string | null }>);
  const memoryCounts = countRowsByProject((memories ?? []) as Array<{ project_id: string | null }>);

  return NextResponse.json({
    projects: (projects ?? []).map((project) => ({
      ...(project as ProjectRow),
      documentCount: documentCounts.get(project.id as string) ?? 0,
      conversationCount: conversationCounts.get(project.id as string) ?? 0,
      memoryCount: memoryCounts.get(project.id as string) ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("projects")
    .insert([{ name }])
    .select("id, name, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "failed to create project" }, { status: 500 });
  }

  return NextResponse.json({
    project: {
      ...(data as ProjectRow),
      documentCount: 0,
    },
  });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const password = typeof body?.password === "string" ? body.password.trim() : "";

  if (!projectId || !name) {
    return NextResponse.json({ error: "projectId and name required" }, { status: 400 });
  }

  if (password !== TEMP_CONFIRMATION_PASSWORD) {
    return NextResponse.json({ error: "Invalid confirmation password." }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("projects")
    .update({ name })
    .eq("id", projectId)
    .select("id, name, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "failed to rename project" }, { status: 500 });
  }

  const { count, error: countError } = await supabaseAdmin
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  return NextResponse.json({
    project: {
      ...(data as ProjectRow),
      documentCount: count ?? 0,
    },
  });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
  const password = typeof body?.password === "string" ? body.password.trim() : "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  if (password !== TEMP_CONFIRMATION_PASSWORD) {
    return NextResponse.json({ error: "Invalid confirmation password." }, { status: 403 });
  }

  const { data: documents, error: documentsError } = await supabaseAdmin
    .from("documents")
    .select("id")
    .eq("project_id", projectId);

  if (documentsError) {
    return NextResponse.json({ error: documentsError.message }, { status: 500 });
  }

  const { data: conversations, error: conversationsError } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("project_id", projectId);

  if (conversationsError) {
    return NextResponse.json({ error: conversationsError.message }, { status: 500 });
  }

  const documentIds = (documents ?? []).map((document) => document.id).filter(Boolean);
  const conversationIds = (conversations ?? []).map((conversation) => conversation.id).filter(Boolean);

  const { error: memoriesError } = await supabaseAdmin
    .from("project_memories")
    .delete()
    .eq("project_id", projectId);

  if (memoriesError) {
    return NextResponse.json({ error: memoriesError.message }, { status: 500 });
  }

  if (documentIds.length > 0) {
    const { error: indexingError } = await supabaseAdmin
      .from("indexing_status")
      .delete()
      .in("document_id", documentIds);

    if (indexingError) {
      return NextResponse.json({ error: indexingError.message }, { status: 500 });
    }

    const { error: chunkError } = await supabaseAdmin
      .from("document_chunks")
      .delete()
      .in("document_id", documentIds);

    if (chunkError) {
      return NextResponse.json({ error: chunkError.message }, { status: 500 });
    }

    const { error: projectDocumentsError } = await supabaseAdmin
      .from("documents")
      .delete()
      .eq("project_id", projectId);

    if (projectDocumentsError) {
      return NextResponse.json({ error: projectDocumentsError.message }, { status: 500 });
    }
  }

  if (conversationIds.length > 0) {
    const { error: messagesError } = await supabaseAdmin
      .from("messages")
      .delete()
      .in("conversation_id", conversationIds);

    if (messagesError) {
      return NextResponse.json({ error: messagesError.message }, { status: 500 });
    }

    const { error: projectConversationsError } = await supabaseAdmin
      .from("conversations")
      .delete()
      .eq("project_id", projectId);

    if (projectConversationsError) {
      return NextResponse.json({ error: projectConversationsError.message }, { status: 500 });
    }
  }

  const { error: projectError } = await supabaseAdmin
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}