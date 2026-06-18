import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectIdValue = searchParams.get("projectId");
  const projectId = typeof projectIdValue === "string" && projectIdValue.trim() ? projectIdValue.trim() : null;

  const query = projectId
    ? supabaseAdmin.from("conversations").select("*").eq("project_id", projectId)
    : supabaseAdmin.from("conversations").select("*").is("project_id", null);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const conversations = data ?? [];
  const conversationIds = conversations.map((conversation) => conversation.id).filter(Boolean);

  if (conversationIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", conversationIds);

  if (messagesError) {
    return NextResponse.json(
      { error: messagesError.message },
      { status: 500 }
    );
  }

  const messageCountByConversationId = new Map<number, number>();

  for (const message of messages ?? []) {
    const conversationId = Number(message.conversation_id);
    if (!Number.isNaN(conversationId)) {
      messageCountByConversationId.set(
        conversationId,
        (messageCountByConversationId.get(conversationId) ?? 0) + 1
      );
    }
  }

  return NextResponse.json(
    conversations.map((conversation) => ({
      ...conversation,
      messageCount: messageCountByConversationId.get(Number(conversation.id)) ?? 0,
    }))
  );
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const conversationId = Number(body?.conversationId);
  const projectIdValue = body?.projectId;
  const projectId = typeof projectIdValue === "string"
    ? projectIdValue.trim() || null
    : null;

  if (!Number.isFinite(conversationId)) {
    return NextResponse.json({ error: "conversationId must be a number" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("conversations")
    .update({ project_id: projectId })
    .eq("id", conversationId)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "failed to update conversation" },
      { status: 500 }
    );
  }

  return NextResponse.json({ conversation: data });
}