import { NextResponse } from "next/server";
import { ingestDocument } from "@/lib/ingestDocument";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    const storagePath = `${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("knowledge-vault")
      .upload(storagePath, buffer, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: document, error: insertError } = await supabaseAdmin
      .from("documents")
      .insert({
        filename: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !document) {
      await supabaseAdmin.storage.from("knowledge-vault").remove([storagePath]);

      return NextResponse.json(
        { error: insertError?.message ?? "failed to create document row" },
        { status: 500 }
      );
    }

    try {
      const ingestResult = await ingestDocument(document.id);

      return NextResponse.json({
        success: true,
        documentId: document.id,
        storagePath,
        indexed: true,
        chunks: ingestResult.chunks,
      });
    } catch (error: any) {
      return NextResponse.json({
        success: true,
        documentId: document.id,
        storagePath,
        indexed: false,
        indexingError: error?.message ?? String(error),
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}