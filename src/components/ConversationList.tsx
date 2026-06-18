"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MoreHorizontal } from "lucide-react";

type Conversation = {
  id: number;
  title: string;
  created_at: string;
  pinned?: boolean;
};

export default function ConversationList({
  activeConversationId,
  onSelect,
  showSearch = true,
}: {
  activeConversationId?: number | null;
  onSelect?: (id: number) => void;
  showSearch?: boolean;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  async function loadConversations() {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setConversations(data || []);
  }

  useEffect(() => {
    loadConversations();
  }, []);

  async function togglePin(conversation: Conversation) {
    const newPinned = !Boolean(conversation.pinned);
    const { error } = await supabase
      .from("conversations")
      .update({ pinned: newPinned })
      .eq("id", conversation.id);

    if (error) {
      console.error(error);
      return;
    }

    setConversations((prev) =>
      prev.map((c) => (c.id === conversation.id ? { ...c, pinned: newPinned } : c))
    );
    setOpenMenuId(null);
  }

  async function renameChat(conversationId: number, currentTitle: string) {
    const newTitle = prompt("Rename chat:", currentTitle);
    if (!newTitle || !newTitle.trim()) return;

    const { error } = await supabase
      .from("conversations")
      .update({ title: newTitle.trim() })
      .eq("id", conversationId);

    if (error) {
      console.error(error);
      return;
    }

    await loadConversations();
  }

  async function deleteConversation(conversationId: number) {
    const confirmDelete = confirm("Delete this conversation permanently?");
    if (!confirmDelete) return;

    await supabase.from("messages").delete().eq("conversation_id", conversationId);
    const { error } = await supabase.from("conversations").delete().eq("id", conversationId);
    if (error) {
      console.error(error);
      return;
    }

    await loadConversations();
  }

  const pinned = conversations.filter((c) => Boolean(c.pinned));
  const recent = conversations.filter((c) => !Boolean(c.pinned));

  return (
    <div>
      {showSearch && (
        <div className="mb-2.5">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-400"
          />
        </div>
      )}

      {pinned.length > 0 && (
        <>
          <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">📌 Pinned</h3>
          <div className="space-y-1.5 mb-4">
            {pinned.map((conversation) => (
              <div
                key={conversation.id}
                className={`relative p-2.5 rounded-xl text-sm ${
                  activeConversationId === conversation.id
                    ? "bg-yellow-500/20 text-yellow-300"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {onSelect ? (
                    <button onClick={() => onSelect(conversation.id)} className="flex-1 text-left">
                      <div className="font-medium truncate">{conversation.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(conversation.created_at).toLocaleString()}</div>
                    </button>
                  ) : (
                    <Link href={`/chat?conversation=${conversation.id}`} className="flex-1 text-left">
                      <div className="font-medium truncate">{conversation.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(conversation.created_at).toLocaleString()}</div>
                    </Link>
                  )}

                  <button
                    onClick={() => setOpenMenuId(openMenuId === conversation.id ? null : conversation.id)}
                    className="text-slate-400 hover:text-white"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {openMenuId === conversation.id && (
                    <div className="absolute right-2 top-10 bg-slate-900 border border-slate-700 rounded-xl shadow-xl w-48 z-50">
                      <button onClick={() => togglePin(conversation)} className="w-full text-left px-4 py-2 hover:bg-slate-800">
                        {conversation.pinned ? "📌 Unpin" : "📌 Pin"}
                      </button>
                      <button onClick={() => { renameChat(conversation.id, conversation.title); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-800">✏️ Rename</button>
                      <button className="w-full text-left px-4 py-2 hover:bg-slate-800">📂 Move to Project</button>
                      <button className="w-full text-left px-4 py-2 hover:bg-slate-800">📦 Archive</button>
                      <button onClick={() => { deleteConversation(conversation.id); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 hover:bg-red-900 text-red-300">🗑 Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="text-sm text-slate-400 mb-2.5 mt-4">Recent</h2>

      <div className="space-y-1.5">
        {recent.map((conversation) => (
          <div key={conversation.id} className={`relative p-2.5 rounded-xl text-sm ${activeConversationId === conversation.id ? "bg-yellow-500/20 text-yellow-300" : "bg-slate-800 text-slate-300"}`}>
            <div className="flex items-start justify-between gap-2">
              {onSelect ? (
                <button onClick={() => onSelect(conversation.id)} className="flex-1 text-left">
                  <div className="font-medium truncate">{conversation.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{new Date(conversation.created_at).toLocaleString()}</div>
                </button>
              ) : (
                <Link href={`/chat?conversation=${conversation.id}`} className="flex-1 text-left">
                  <div className="font-medium truncate">{conversation.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{new Date(conversation.created_at).toLocaleString()}</div>
                </Link>
              )}

              <button onClick={() => setOpenMenuId(openMenuId === conversation.id ? null : conversation.id)} className="text-slate-400 hover:text-white">
                <MoreHorizontal size={16} />
              </button>

              {openMenuId === conversation.id && (
                <div className="absolute right-2 top-10 bg-slate-900 border border-slate-700 rounded-xl shadow-xl w-48 z-50">
                  <button onClick={() => togglePin(conversation)} className="w-full text-left px-4 py-2 hover:bg-slate-800">
                    {conversation.pinned ? "📌 Unpin" : "📌 Pin"}
                  </button>
                  <button onClick={() => { renameChat(conversation.id, conversation.title); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-800">✏️ Rename</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-800">📂 Move to Project</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-800">📦 Archive</button>
                  <button onClick={() => { deleteConversation(conversation.id); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 hover:bg-red-900 text-red-300">🗑 Delete</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
