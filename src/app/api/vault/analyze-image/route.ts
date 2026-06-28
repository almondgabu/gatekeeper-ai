import { NextResponse } from "next/server";
import { analyzeImageDocument, AnalyzeImageDocumentError } from "@/lib/analyzeImageDocument";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const documentId = typeof body?.documentId === "string" ? body.documentId.trim() : "";
    const force = body?.force === true;

    if (!documentId) {
      return NextResponse.json({ error: "documentId required" }, { status: 400 });
    }

    const result = await analyzeImageDocument(documentId, {
      force,
      allowTransientWithoutStorage: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AnalyzeImageDocumentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}