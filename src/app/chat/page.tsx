"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  PenSquare,
  Map,
  FileText,
  FolderOpen,
  MessageSquare,
  Brain,
  ChevronRight,
  Sparkles,
  Star,
  MoreHorizontal,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import ConversationList from "@/components/ConversationList";


type Message = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: number;
  title: string;
  created_at: string;
  pinned?: boolean;
};

function ChatPageContent() {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-5-mini");

  
  const [conversationPanelOpen, setConversationPanelOpen] = useState(true);
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

  // Handle lightweight URL triggers: ?new=1 to create a chat, ?conversation=<id> to open
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const newFlag = searchParams?.get("new");
    const conv = searchParams?.get("conversation");
    const projectIdParam = searchParams?.get("projectId");
    const parsedProjectId = projectIdParam?.trim() || null;

    setActiveProjectId(parsedProjectId);

    const baseChatUrl = !parsedProjectId
      ? "/chat"
      : `/chat?projectId=${parsedProjectId}`;

    if (newFlag) {
      createNewChat().then(() => router.replace(baseChatUrl));
      return;
    }

    if (conv) {
      const id = Number(conv);
      if (!Number.isNaN(id)) {
        setActiveConversationId(id);
        loadMessages(id);
      }
      // remove param from URL
      router.replace(baseChatUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    async function loadActiveProjectName(projectId: string) {
      const { data, error } = await supabase
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single();

      if (error) {
        console.error(error);
        setActiveProjectName(null);
        return;
      }

      setActiveProjectName(data?.name || null);
    }

    if (!activeProjectId) {
      setActiveProjectName(null);
      return;
    }

    loadActiveProjectName(activeProjectId);
  }, [activeProjectId]);

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

  const pinnedConversations = conversations.filter((c) => Boolean((c as any).pinned));
  const recentConversations = conversations.filter((c) => !Boolean((c as any).pinned));

  

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
        projectId: activeProjectId,
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
    <main className="flex h-full min-h-0 w-full overflow-hidden bg-slate-950 text-white">
  <aside
    className={`
      hidden md:block relative z-20
      h-full w-[280px] max-w-[85vw] md:w-auto shrink-0
      bg-slate-900 border-r border-slate-800 p-0 overflow-hidden
      transform transition-all duration-300
      ${conversationPanelOpen ? "md:w-72" : "md:w-14"}
      md:translate-x-0
    `}
  >
    <div className="p-3 h-full flex flex-col">
      <div className="mb-3">
        <h2 className="text-sm font-semibold">Conversations</h2>
      </div>

      <div className="flex-1 overflow-auto px-0 pt-0 pb-4">
        <ConversationList
          activeConversationId={activeConversationId || undefined}
          onSelect={async (id) => {
            setActiveConversationId(id);
            await loadMessages(id);
          }}
        />
      </div>
    </div>
  </aside>

<section className="relative z-10 flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-950">
  <div className="hidden shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur md:flex">
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Gatekeeper AI</p>
      <h1 className="text-sm font-semibold text-slate-200">Chat</h1>
      {activeProjectId && (
        <>
          <p className="mt-1 text-xs text-yellow-400">Project-scoped retrieval active</p>
          <p className="mt-1 text-xs text-slate-300">Project: {activeProjectName || `#${activeProjectId}`}</p>
        </>
      )}
    </div>

    <button
      onClick={() => setConversationPanelOpen(!conversationPanelOpen)}
      className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-400 hover:text-white"
    >
      {conversationPanelOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
    </button>
  </div>

  <div className="flex-1 min-h-0 overflow-y-auto">
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-5 md:px-6 md:py-6">
  {messages.length === 0 && (
    <div className="mb-6 md:mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs text-green-400">
            <span>🧠</span>
            <span>Knowledge Vault Connected</span>
          </div>

          <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
            Good afternoon, Almond
          </p>

          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            What would you like to work on today?
          </h1>

          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Ask, analyze, compare, summarize, or create content using Gatekeeper AI.
          </p>
          {activeProjectId && (
            <p className="mt-3 text-sm text-yellow-400">Project: {activeProjectName || `#${activeProjectId}`}</p>
          )}
        </div>

        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="gpt-5-mini">
            GPT-5 Mini
          </option>
        </select>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-left transition hover:border-yellow-500/40 hover:bg-slate-800/50">
          <BarChart3 size={18} className="mb-2 text-yellow-400" />
          <p className="text-sm font-semibold">Compare Models</p>
          <p className="mt-1 text-xs text-slate-400">
            Models, costs & options
          </p>
        </button>

        <button className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-left transition hover:border-yellow-500/40 hover:bg-slate-800/50">
          <PenSquare size={18} className="mb-2 text-yellow-400" />
          <p className="text-sm font-semibold">Create Content</p>
          <p className="mt-1 text-xs text-slate-400">
            Posts, captions & scripts
          </p>
        </button>

        <button className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-left transition hover:border-yellow-500/40 hover:bg-slate-800/50">
          <Map size={18} className="mb-2 text-yellow-400" />
          <p className="text-sm font-semibold">Analyze Land</p>
          <p className="mt-1 text-xs text-slate-400">
            Property & site insights
          </p>
        </button>

        <button className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-left transition hover:border-yellow-500/40 hover:bg-slate-800/50">
          <FileText size={18} className="mb-2 text-yellow-400" />
          <p className="text-sm font-semibold">Summarize</p>
          <p className="mt-1 text-xs text-slate-400">
            Documents & notes
          </p>
        </button>
      </div>
    </div>
  )}

    <div className="space-y-4 pb-24 md:pb-28">
      {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-3xl rounded-2xl border p-4 text-sm shadow-sm md:p-5 md:text-[15px] ${
              msg.role === "user"
  ? "ml-auto max-w-lg bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-950 border-yellow-400/30"
                : "border-slate-800 bg-slate-900/80 text-slate-200"
            }`}
          >
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-inherit/80">
              {msg.role === "user" ? "Almond" : "Gatekeeper AI"}
            </p>

            <div className="prose prose-sm prose-invert max-w-none prose-p:mb-3 prose-p:leading-6 prose-li:mb-1 prose-headings:text-white prose-headings:font-semibold prose-strong:text-yellow-300 prose-table:block prose-table:w-full prose-table:overflow-hidden prose-table:rounded-xl prose-table:border prose-table:border-slate-700 prose-thead:bg-slate-800 prose-th:border prose-th:border-slate-700 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-th:text-slate-200 prose-td:border prose-td:border-slate-800 prose-td:px-3 prose-td:py-2 prose-td:text-sm prose-td:text-slate-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  </div>
  </div>

  <div className="sticky bottom-0 z-20 shrink-0 border-t border-slate-800 bg-[#020617]/95 px-4 py-3 backdrop-blur">
    <div className="mx-auto w-full max-w-3xl">
      {loading && (
        <div className="mb-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-400">
          Gatekeeper AI is thinking...
        </div>
      )}

    <div className="flex items-end gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-3">
      <textarea
        className="min-h-[40px] max-h-36 flex-1 resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
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
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500 font-bold text-slate-950 hover:bg-yellow-400"
      >
        ↑
      </button>
    </div>
    </div>
  </div>
</section>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<main className="flex h-full min-h-0 w-full items-center justify-center bg-slate-950 text-sm text-slate-400">Loading chat...</main>}>
      <ChatPageContent />
    </Suspense>
  );
}