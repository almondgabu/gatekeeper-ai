import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectIdValue = searchParams.get("projectId");
  const projectId = typeof projectIdValue === "string" && projectIdValue.trim() ? projectIdValue.trim() : null;

  const query = projectId
    ? supabase.from("conversations").select("*").eq("project_id", projectId)
    : supabase.from("conversations").select("*").is("project_id", null);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const conversations = data ?? [];
  const conversationIds = conversations.map((conversation) => conversation.id).filter(Boolean);

  if (conversationIds.length === 0) {
    return Response.json([]);
  }

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", conversationIds);

  if (messagesError) {
    return Response.json(
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

  return Response.json(
    conversations.map((conversation) => ({
      ...conversation,
      messageCount: messageCountByConversationId.get(Number(conversation.id)) ?? 0,
    }))
  );
}