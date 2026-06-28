import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isMissingMetadataColumnError } from "@/lib/vaultDocumentMetadata";

export const runtime = "nodejs";

type VaultDocumentRow = {
  id: string;
  filename: string | null;
  storage_path: string;
  status: string | null;
  mime_type: string | null;
  metadata?: Record<string, unknown> | null;
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
    metadata: document.metadata ?? null,
    projectName: document.project_id ? projectNameById.get(document.project_id) ?? null : null,
  };
}

const baseDocumentSelect =
  "id, filename, storage_path, status, mime_type, created_at, file_size, project_id";
const documentSelectWithMetadata = `${baseDocumentSelect}, metadata`;

async function loadDocumentsWithOptionalMetadata() {
  const documentQueryWithMetadata = supabaseAdmin
    .from("documents")
    .select(documentSelectWithMetadata)
    .order("created_at", { ascending: false });

  const [{ data: documents, error: documentsError }, { data: projects, error: projectsError }] =
    await Promise.all([documentQueryWithMetadata, supabaseAdmin.from("projects").select("id, name")]);

  if (!documentsError) {
    return {
      documents: (documents ?? []) as VaultDocumentRow[],
      projects: (projects ?? []) as ProjectRow[],
      metadataColumnAvailable: true,
      projectsError,
    };
  }

  if (!isMissingMetadataColumnError(documentsError.message)) {
    return {
      documents: null,
      projects: (projects ?? []) as ProjectRow[],
      metadataColumnAvailable: false,
      documentsError,
      projectsError,
    };
  }

  const [{ data: fallbackDocuments, error: fallbackDocumentsError }, fallbackProjectsResult] =
    await Promise.all([
      supabaseAdmin.from("documents").select(baseDocumentSelect).order("created_at", { ascending: false }),
      projectsError ? supabaseAdmin.from("projects").select("id, name") : Promise.resolve({ data: projects, error: null }),
    ]);

  return {
    documents: ((fallbackDocuments ?? []) as VaultDocumentRow[]).map((document) => ({
      ...document,
      metadata: null,
    })),
    projects: ((fallbackProjectsResult.data ?? []) as ProjectRow[]),
    metadataColumnAvailable: false,
    documentsError: fallbackDocumentsError,
    projectsError: fallbackProjectsResult.error,
  };
}

async function loadUpdatedDocumentWithOptionalMetadata(documentId: string) {
  const { data: updatedDocument, error: updateError } = await supabaseAdmin
    .from("documents")
    .select(documentSelectWithMetadata)
    .eq("id", documentId)
    .single();

  if (!updateError) {
    return {
      document: updatedDocument as VaultDocumentRow,
      metadataColumnAvailable: true,
      error: null,
    };
  }

  if (!isMissingMetadataColumnError(updateError.message)) {
    return {
      document: null,
      metadataColumnAvailable: false,
      error: updateError,
    };
  }

  const { data: fallbackDocument, error: fallbackError } = await supabaseAdmin
    .from("documents")
    .select(baseDocumentSelect)
    .eq("id", documentId)
    .single();

  return {
    document: fallbackDocument
      ? ({ ...(fallbackDocument as VaultDocumentRow), metadata: null } as VaultDocumentRow)
      : null,
    metadataColumnAvailable: false,
    error: fallbackError,
  };
}

export async function GET() {
  const { documents, projects, metadataColumnAvailable, documentsError, projectsError } =
    await loadDocumentsWithOptionalMetadata();

  if (documentsError) {
    return NextResponse.json({ error: documentsError.message }, { status: 500 });
  }

  if (projectsError) {
    return NextResponse.json({ error: projectsError.message }, { status: 500 });
  }

  return NextResponse.json({
    documents: ((documents ?? []) as VaultDocumentRow[]).map((document) => withProjectName(document, projects)),
    metadataColumnAvailable,
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

  const { error: projectUpdateError } = await supabaseAdmin
    .from("documents")
    .update({ project_id: projectId })
    .eq("id", documentId)
    .select("id")
    .single();

  if (projectUpdateError) {
    return NextResponse.json(
      { error: projectUpdateError.message ?? "failed to update document" },
      { status: 500 }
    );
  }

  const {
    document: updatedDocument,
    metadataColumnAvailable,
    error: updatedDocumentError,
  } = await loadUpdatedDocumentWithOptionalMetadata(documentId);

  if (updatedDocumentError || !updatedDocument) {
    return NextResponse.json(
      { error: updatedDocumentError?.message ?? "failed to load updated document" },
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
    metadataColumnAvailable,
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