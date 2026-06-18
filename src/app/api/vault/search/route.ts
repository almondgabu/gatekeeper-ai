import { NextResponse } from "next/server";
import { retrieveKnowledgeContext } from "@/lib/retrieveKnowledgeContext";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.query;
    const matchCount = body.matchCount || 5;

    if (!query) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }

    const data = await retrieveKnowledgeContext(query, matchCount);

    return NextResponse.json({ results: data ?? [] });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
