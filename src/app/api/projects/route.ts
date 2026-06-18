import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type ProjectRow = {
  id: string;
  name: string;
  created_at: string;
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

  const [{ data: projects, error: projectsError }, { data: documents, error: documentsError }] =
    await Promise.all([
      supabaseAdmin.from("projects").select("id, name, created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("documents").select("project_id"),
    ]);

  if (projectsError) {
    return NextResponse.json({ error: projectsError.message }, { status: 500 });
  }

  if (documentsError) {
    return NextResponse.json({ error: documentsError.message }, { status: 500 });
  }

  const counts = countDocumentsByProject((documents ?? []) as Array<{ project_id: string | null }>);

  return NextResponse.json({
    projects: (projects ?? []).map((project) => ({
      ...(project as ProjectRow),
      documentCount: counts.get(project.id as string) ?? 0,
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