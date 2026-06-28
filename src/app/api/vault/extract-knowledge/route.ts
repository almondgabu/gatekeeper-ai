import { NextResponse } from "next/server";
import {
  extractDocumentKnowledge,
  ExtractDocumentKnowledgeError,
} from "@/lib/extractDocumentKnowledge";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const documentId = typeof body?.documentId === "string" ? body.documentId.trim() : "";
    const force = body?.force === true;

    if (!documentId) {
      return NextResponse.json({ error: "documentId required" }, { status: 400 });
    }

    const result = await extractDocumentKnowledge(documentId, { force });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ExtractDocumentKnowledgeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}