import { NextResponse } from "next/server";
import { storeAndIngestDocument } from "@/lib/storeDocument";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const projectIdValue = formData.get("projectId");
    const projectId = typeof projectIdValue === "string" && projectIdValue.trim() ? projectIdValue.trim() : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
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