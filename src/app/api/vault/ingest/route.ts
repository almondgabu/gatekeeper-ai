import { NextResponse } from "next/server";
import { ingestDocument, IngestDocumentError } from "@/lib/ingestDocument";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let documentId: string | undefined;

  try {
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    documentId = body.documentId;

    if (!documentId) {
      return NextResponse.json({ error: "documentId required" }, { status: 400 });
    }

    const result = await ingestDocument(documentId);

    return NextResponse.json({ success: true, chunks: result.chunks });
  } catch (err: any) {
    console.error(err);

    if (err instanceof IngestDocumentError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
