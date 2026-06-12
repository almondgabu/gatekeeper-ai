"use client";

import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: number;
  title: string;
  created_at: string;
};

export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-5-mini");

  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  async function loadMessages(conversationId: number) {
    const { data, error } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setMessages((data || []) as Message[]);
  }

  async function createNewChat() {
    const { data, error } = await supabase
      .from("conversations")
      .insert([{ title: "New Chat" }])
      .select()
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setActiveConversationId(data.id);
    setMessages([]);
    await loadConversations();
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

  async function deleteChat(conversationId: number) {
    const confirmDelete = confirm("Delete this chat?");
    if (!confirmDelete) return;

    await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", conversationId);

    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    if (error) {
      console.error(error);
      return;
    }

    const remaining = conversations.filter(
      (conversation) => conversation.id !== conversationId
    );

    if (remaining.length > 0) {
      setActiveConversationId(remaining[0].id);
      await loadMessages(remaining[0].id);
    } else {
      setActiveConversationId(null);
      setMessages([]);
    }

    await loadConversations();
  }

  async function autoRenameConversation(userMessage: string) {
    if (!activeConversationId) return;

    const activeConversation = conversations.find(
      (conversation) => conversation.id === activeConversationId
    );

    if (activeConversation?.title !== "New Chat") return;

    const newTitle =
      userMessage.length > 40 ? userMessage.slice(0, 40) + "..." : userMessage;

    const { error } = await supabase
      .from("conversations")
      .update({ title: newTitle })
      .eq("id", activeConversationId);

    if (error) {
      console.error(error);
      return;
    }

    await loadConversations();
  }

  useEffect(() => {
    async function initializeChat() {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      if (data && data.length > 0) {
        setConversations(data);
        setActiveConversationId(data[0].id);
        return;
      }

      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert([{ title: "New Chat" }])
        .select()
        .single();

      if (createError) {
        console.error(createError);
        return;
      }

      setConversations([newConversation]);
      setActiveConversationId(newConversation.id);
    }

    initializeChat();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function handleSend() {
    if (!message.trim() || !activeConversationId) return;

    const userMessage: Message = {
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    await supabase.from("messages").insert([
      {
        ...userMessage,
        conversation_id: activeConversationId,
      },
    ]);

    await autoRenameConversation(userMessage.content);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessage.content,
        model: selectedModel,
      }),
    });

    if (!response.ok) {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
      return;
    }

    const data = await response.json();

    const assistantMessage: Message = {
      role: "assistant",
      content: data.reply,
    };

    await supabase.from("messages").insert([
      {
        ...assistantMessage,
        conversation_id: activeConversationId,
      },
    ]);

    setLoading(false);
    setMessages((prev) => [...prev, assistantMessage]);
  }

  return (
    <main className="h-screen bg-slate-950 text-white flex overflow-hidden">
      <button
  onClick={() => setSidebarOpen(true)}
  className="md:hidden fixed top-4 left-4 z-40 bg-slate-800 p-2 rounded-lg"
>
  <Menu size={24} />
</button>
      <aside
  className={`
    fixed md:relative z-50
    h-screen w-72
    bg-slate-900 border-r border-slate-800 p-4
    transform transition-transform duration-300
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0
  `}
  
>
  <div className="flex justify-end md:hidden mb-4">
  <button onClick={() => setSidebarOpen(false)}>
    <X size={24} />
  </button>
</div>

        <button
          onClick={createNewChat}
          className="w-full bg-yellow-500 text-slate-950 py-3 rounded-xl font-semibold mb-4"
        >
          + New Chat
        </button>

        <h2 className="text-sm text-slate-400 mb-3">Conversations</h2>

        <div className="space-y-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 rounded-xl ${
                activeConversationId === conversation.id
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              <button
                onClick={() => setActiveConversationId(conversation.id)}
                className="w-full text-left mb-2"
              >
                {conversation.title}
              </button>

              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => renameChat(conversation.id, conversation.title)}
                  className="text-slate-400 hover:text-white"
                >
                  Rename
                </button>

                <button
                  onClick={() => deleteChat(conversation.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <h1 className="text-4xl font-bold mb-6">Gatekeeper AI Chat</h1>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-4">
          {messages.length === 0 ? (
            <div className="bg-slate-900 rounded-2xl p-6 text-slate-300">
              Hello Almond. How can I help you today?
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`rounded-2xl p-5 max-w-3xl ${
                  msg.role === "user"
                    ? "bg-yellow-500 text-slate-950 ml-auto"
                    : "bg-slate-900 text-slate-200"
                }`}
              >
                <p className="text-sm font-bold mb-2">
                  {msg.role === "user" ? "Almond" : "Gatekeeper AI"}
                </p>

                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        {loading && (
          <div className="bg-slate-800 rounded-2xl p-4 mb-4 text-slate-400">
            Gatekeeper AI is thinking...
          </div>
        )}

        

<div className="mb-4 flex items-center gap-3">
  <label className="text-sm text-slate-400">
    AI Model
  </label>

  <select
    value={selectedModel}
    onChange={(e) => setSelectedModel(e.target.value)}
    className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700"
  >
    <option value="gpt-5-mini">
      GPT-5 Mini - Fast & Affordable
    </option>
  </select>
</div>

        <textarea
          className="w-full h-32 bg-slate-900 rounded-2xl p-4 text-white outline-none relative z-20"
          placeholder="Ask Gatekeeper AI anything..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          onClick={handleSend}
          className="mt-4 bg-yellow-500 text-slate-950 px-6 py-3 rounded-xl font-semibold relative z-20"
        >
          Send
        </button>
      </section>
    </main>
  );
}