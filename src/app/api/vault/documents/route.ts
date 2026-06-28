import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type VaultDocumentRow = {
  id: string;
  filename: string | null;
  storage_path: string;
  status: string | null;
  mime_type: string | null;
  created_at: string | null;
  file_size: number | null;
  project_id: string | null;
};

type ProjectRow = {
  id: string;
  name: string;
};

function withProjectName(document: VaultDocumentRow, projects: ProjectRow[]) {
  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));

  return {
    ...document,
    projectName: document.project_id ? projectNameById.get(document.project_id) ?? null : null,
  };
}

export async function GET() {
  const [{ data: documents, error: documentsError }, { data: projects, error: projectsError }] =
    await Promise.all([
      supabaseAdmin
        .from("documents")
        .select("id, filename, storage_path, status, mime_type, created_at, file_size, project_id")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("projects").select("id, name"),
    ]);

  if (documentsError) {
    return NextResponse.json({ error: documentsError.message }, { status: 500 });
  }

  if (projectsError) {
    return NextResponse.json({ error: projectsError.message }, { status: 500 });
  }

  return NextResponse.json({
    documents: ((documents ?? []) as VaultDocumentRow[]).map((document) =>
      withProjectName(document, (projects ?? []) as ProjectRow[])
    ),
  });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const documentId = typeof body?.documentId === "string" ? body.documentId.trim() : "";
  const projectIdValue = typeof body?.projectId === "string" ? body.projectId.trim() : "";
  const projectId = projectIdValue ? projectIdValue : null;

  if (!documentId) {
    return NextResponse.json({ error: "documentId required" }, { status: 400 });
  }

  const { data: updatedDocument, error: updateError } = await supabaseAdmin
    .from("documents")
    .update({ project_id: projectId })
    .eq("id", documentId)
    .select("id, filename, storage_path, status, mime_type, created_at, file_size, project_id")
    .single();

  if (updateError || !updatedDocument) {
    return NextResponse.json(
      { error: updateError?.message ?? "failed to update document" },
      { status: 500 }
    );
  }

  const projects = projectId
    ? await supabaseAdmin.from("projects").select("id, name").eq("id", projectId)
    : { data: [], error: null };

  if (projects.error) {
    return NextResponse.json({ error: projects.error.message }, { status: 500 });
  }

  return NextResponse.json({
    document: withProjectName(
      updatedDocument as VaultDocumentRow,
      (projects.data ?? []) as ProjectRow[]
    ),
  });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const documentId = typeof body?.documentId === "string" ? body.documentId.trim() : "";
  const storagePath = typeof body?.storagePath === "string" ? body.storagePath.trim() : "";

  if (!documentId || !storagePath) {
    return NextResponse.json({ error: "documentId and storagePath required" }, { status: 400 });
  }

  const { error: storageError } = await supabaseAdmin.storage.from("knowledge-vault").remove([storagePath]);

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  const { error: documentError } = await supabaseAdmin.from("documents").delete().eq("id", documentId);

  if (documentError) {
    return NextResponse.json({ error: documentError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}