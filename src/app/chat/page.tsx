"use client";

import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import {
  BarChart3,
  PenSquare,
  Map,
  FileText,
} from "lucide-react";

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
        <div className="mb-8">
  <div className="mb-8">
  <div className="flex items-start justify-between gap-4">
  <div>
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-3">
  <span>🧠</span>
  <span>Knowledge Vault Connected</span>
</div>

    <p className="text-sm text-slate-400 mb-2">
      Good afternoon, Almond
    </p>

    <h1 className="text-4xl font-bold tracking-tight">
      What would you like to work on today?
    </h1>

    <p className="text-slate-400 mt-3 text-sm">
      Ask, analyze, compare, summarize, or create content using Gatekeeper AI.
    </p>
  </div>

  <select
    value={selectedModel}
    onChange={(e) => setSelectedModel(e.target.value)}
    className="bg-slate-900 text-white px-4 py-2 rounded-xl border border-slate-700 text-sm"
  >
    <option value="gpt-5-mini">
      GPT-5 Mini
    </option>
  </select>
</div>


<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">

  <button className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left hover:border-yellow-500/40 hover:bg-slate-800/50 transition">
    <BarChart3 size={22} className="text-yellow-400 mb-3" />
    <p className="font-semibold">Compare Models</p>
    <p className="text-xs text-slate-400 mt-1">
      Models, costs & options
    </p>
  </button>

  <button className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left hover:border-yellow-500/40 hover:bg-slate-800/50 transition">
    <PenSquare size={22} className="text-yellow-400 mb-3" />
    <p className="font-semibold">Create Content</p>
    <p className="text-xs text-slate-400 mt-1">
      Posts, captions & scripts
    </p>
  </button>

  <button className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left hover:border-yellow-500/40 hover:bg-slate-800/50 transition">
    <Map size={22} className="text-yellow-400 mb-3" />
    <p className="font-semibold">Analyze Land</p>
    <p className="text-xs text-slate-400 mt-1">
      Property & site insights
    </p>
  </button>

  <button className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left hover:border-yellow-500/40 hover:bg-slate-800/50 transition">
    <FileText size={22} className="text-yellow-400 mb-3" />
    <p className="font-semibold">Summarize</p>
    <p className="text-xs text-slate-400 mt-1">
      Documents & notes
    </p>
  </button>

</div>  
</div>
</div>
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10 space-y-8">
          {messages.length === 0 ? (
            <div className="bg-slate-900 rounded-2xl p-6 text-slate-300">
              Hello Almond. How can I help you today?
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`rounded-2xl p-6 max-w-4xl border shadow-lg ${
                  msg.role === "user"
  ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-950 ml-auto border-yellow-400/30"
  : "bg-slate-900/80 text-slate-200 border-slate-800"
                }`}
              >
                <p className="text-sm font-bold mb-2">
                  {msg.role === "user" ? "Almond" : "Gatekeeper AI"}
                </p>

                <div className="prose prose-invert max-w-none prose-p:leading-7 prose-p:mb-4 prose-li:mb-2 prose-headings:text-white prose-headings:font-bold prose-strong:text-yellow-300">
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

        <div className="border-t border-slate-800 bg-slate-950 p-4">
  <div className="flex items-end gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-3">
    <textarea
      className="flex-1 resize-none bg-transparent text-white outline-none min-h-[48px] max-h-40"
      placeholder="Ask Gatekeeper AI anything..."
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      }}
    />

    <button
      onClick={handleSend}
      className="h-11 w-11 rounded-xl bg-yellow-500 text-slate-950 font-bold flex items-center justify-center hover:bg-yellow-400"
    >
      ↑
    </button>
  </div>
</div>
      </section>
    </main>
  );
}