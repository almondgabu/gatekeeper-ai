import { NextResponse } from "next/server";
import { storeAndIngestDocument } from "@/lib/storeDocument";

export const runtime = "nodejs";

const supportedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const supportedExtensions = new Set(["pdf", "docx", "txt", "csv", "png", "jpg", "jpeg", "webp"]);

function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function isSupportedVaultFile(file: File) {
  const normalizedMimeType = (file.type || "").trim().toLowerCase();

  if (normalizedMimeType && supportedMimeTypes.has(normalizedMimeType)) {
    return true;
  }

  return supportedExtensions.has(getFileExtension(file.name));
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const projectIdValue = formData.get("projectId");
    const projectId = typeof projectIdValue === "string" && projectIdValue.trim() ? projectIdValue.trim() : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    if (!isSupportedVaultFile(file)) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: PDF, DOCX, TXT, CSV, PNG, JPG, JPEG, WEBP." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await storeAndIngestDocument({
      buffer,
      filename: file.name,
      mimeType: file.type || null,
      projectId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}