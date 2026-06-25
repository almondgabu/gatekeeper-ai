"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  X,
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


type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedMemory?: SuggestedMemory | null;
};

type SuggestedMemory = {
  memoryType: string;
  title: string;
  content: string;
  importance: number;
  status: "idle" | "saving" | "saved";
  errorMessage?: string | null;
};

type MemoryDraft = {
  memoryType: string;
  title: string;
  content: string;
  importance: number;
};

type Conversation = {
  id: number;
  title: string;
  created_at: string;
  project_id?: string | null;
  pinned?: boolean;
  messageCount?: number;
};

type Project = {
  id: string;
  name: string;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createMessageId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function clampImportance(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(5, Math.max(1, Math.round(value)));
}

function formatMemoryTypeLabel(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ChatPageContent() {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef(0);
  const previousLoadingRef = useRef(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-5-mini");

  
  const [conversationPanelOpen, setConversationPanelOpen] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [movingConversationId, setMovingConversationId] = useState<number | null>(null);
  const [conversationNotice, setConversationNotice] = useState<Notice | null>(null);
  const [conversationProjectSelections, setConversationProjectSelections] = useState<Record<number, string>>({});
  const [memoryDraft, setMemoryDraft] = useState<MemoryDraft | null>(null);
  const [savingMemory, setSavingMemory] = useState(false);
  const [memoryNotice, setMemoryNotice] = useState<Notice | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedProjectId = searchParams?.get("projectId")?.trim() || null;

  function updateMessageById(
    messageId: string,
    updater: (message: Message) => Message
  ) {
    setMessages((currentMessages) =>
      currentMessages.map((currentMessage) =>
        currentMessage.id === messageId ? updater(currentMessage) : currentMessage
      )
    );
  }

  async function createProjectMemory(input: MemoryDraft) {
    if (!scopedProjectId) {
      throw new Error("project scope required");
    }

    const response = await fetch("/api/project-memories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: scopedProjectId,
        memoryType: input.memoryType,
        title: input.title,
        content: input.content,
        sourceConversationId: activeConversationId,
        importance: clampImportance(input.importance),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to save memory.");
    }

    return result;
  }

  async function requestSuggestedMemory(messageId: string, assistantMessage: string, conversationId: number) {
    if (!scopedProjectId) {
      return;
    }

    const response = await fetch("/api/suggest-memory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: scopedProjectId,
        assistantMessage,
        conversationId,
      }),
    });

    if (!response.ok) {
      return;
    }

    const result = await response.json();

    if (!result?.shouldSuggest) {
      return;
    }

    updateMessageById(messageId, (currentMessage) => {
      if (currentMessage.role !== "assistant" || currentMessage.content !== assistantMessage) {
        return currentMessage;
      }

      return {
        ...currentMessage,
        suggestedMemory: {
          memoryType: result.memoryType,
          title: result.title,
          content: result.content,
          importance: clampImportance(result.importance),
          status: "idle",
          errorMessage: null,
        },
      };
    });
  }

  async function saveSuggestedMemory(messageId: string) {
    const currentMessage = messages.find((messageItem) => messageItem.id === messageId);

    if (!currentMessage?.suggestedMemory) {
      return;
    }

    updateMessageById(messageId, (messageItem) => ({
      ...messageItem,
      suggestedMemory: messageItem.suggestedMemory
        ? { ...messageItem.suggestedMemory, status: "saving", errorMessage: null }
        : messageItem.suggestedMemory,
    }));

    try {
      await createProjectMemory({
        memoryType: currentMessage.suggestedMemory.memoryType,
        title: currentMessage.suggestedMemory.title,
        content: currentMessage.suggestedMemory.content,
        importance: currentMessage.suggestedMemory.importance,
      });

      updateMessageById(messageId, (messageItem) => ({
        ...messageItem,
        suggestedMemory: messageItem.suggestedMemory
          ? { ...messageItem.suggestedMemory, status: "saved", errorMessage: null }
          : messageItem.suggestedMemory,
      }));
    } catch (error: any) {
      updateMessageById(messageId, (messageItem) => ({
        ...messageItem,
        suggestedMemory: messageItem.suggestedMemory
          ? {
              ...messageItem.suggestedMemory,
              status: "idle",
              errorMessage: error?.message ?? "Failed to save memory.",
            }
          : messageItem.suggestedMemory,
      }));
    }
  }

  function dismissSuggestedMemory(messageId: string) {
    updateMessageById(messageId, (currentMessage) => ({
      ...currentMessage,
      suggestedMemory: null,
    }));
  }

  function syncConversationProjectSelections(nextConversations: Conversation[]) {
    setConversationProjectSelections((current) => {
      const nextSelections: Record<number, string> = {};

      for (const conversation of nextConversations) {
        nextSelections[conversation.id] = current[conversation.id] ?? conversation.project_id ?? "";
      }

      return nextSelections;
    });
  }

  async function loadConversations(projectId: string | null = scopedProjectId) {
    const params = new URLSearchParams();

    if (projectId) {
      params.set("projectId", projectId);
    }

    const response = await fetch(`/api/conversations${params.size > 0 ? `?${params.toString()}` : ""}`, {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok) {
      console.error(result.error || "failed to load conversations");
      return;
    }

    const nextConversations = (result ?? []) as Conversation[];
    setConversations(nextConversations);
    syncConversationProjectSelections(nextConversations);
  }

  async function loadProjects() {
    const response = await fetch("/api/projects", {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok) {
      console.error(result.error || "failed to load projects");
      return;
    }

    setProjects((result.projects ?? []) as Project[]);
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

    setMessages(
      ((data || []) as Array<Pick<Message, "role" | "content">>).map((messageItem, index) => ({
        id: `loaded-${conversationId}-${index}`,
        role: messageItem.role,
        content: messageItem.content,
      }))
    );
  }

  async function createNewChat(projectId: string | null = scopedProjectId) {
    const { data, error } = await supabase
      .from("conversations")
      .insert([{ title: "New Chat", project_id: projectId }])
      .select()
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setActiveConversationId(data.id);
    setMessages([]);
    setConversationNotice(null);
    await loadConversations(projectId);
  }

  async function togglePin(conversation: Conversation) {
    const newPinned = !Boolean(conversation.pinned);
    const { error } = await supabase
      .from("conversations")
      .update({ pinned: newPinned })
      .eq("id", conversation.id);

    if (error) {
      console.error(error);
      setConversationNotice({ type: "error", message: error.message });
      return;
    }

    setConversations((prev) =>
      prev.map((currentConversation) =>
        currentConversation.id === conversation.id
          ? { ...currentConversation, pinned: newPinned }
          : currentConversation
      )
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
      setConversationNotice({ type: "error", message: error.message });
      return;
    }

    setConversationNotice({ type: "success", message: "Conversation renamed" });
    await loadConversations(scopedProjectId);
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
      setConversationNotice({ type: "error", message: error.message });
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

    setConversationNotice({ type: "success", message: "Conversation deleted" });
    await loadConversations(scopedProjectId);
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

    await loadConversations(scopedProjectId);
  }

  async function updateConversationProject(conversation: Conversation) {
    const selectedProjectId = conversationProjectSelections[conversation.id] ?? conversation.project_id ?? "";
    const nextProjectId = selectedProjectId.trim() ? selectedProjectId.trim() : null;
    const currentProjectId = conversation.project_id ?? null;

    if (nextProjectId === currentProjectId) {
      setConversationNotice({ type: "success", message: "Conversation scope unchanged" });
      return;
    }

    setMovingConversationId(conversation.id);
    setConversationNotice(null);

    const response = await fetch("/api/conversations", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: conversation.id,
        projectId: nextProjectId,
      }),
    });
    const result = await response.json();

    if (!response.ok) {
      setMovingConversationId(null);
      setConversationNotice({
        type: "error",
        message: result.error || "Failed to move conversation.",
      });
      return;
    }

    const updatedConversation = result.conversation as Conversation;
    const remainsInCurrentScope = scopedProjectId
      ? updatedConversation.project_id === scopedProjectId
      : !updatedConversation.project_id;

    setMovingConversationId(null);
    setOpenMenuId(null);
    setConversationNotice({
      type: "success",
      message: updatedConversation.project_id ? "Conversation moved to project" : "Conversation moved to Global Chat",
    });

    if (remainsInCurrentScope) {
      setConversations((prev) =>
        prev.map((currentConversation) =>
          currentConversation.id === updatedConversation.id
            ? { ...currentConversation, ...updatedConversation }
            : currentConversation
        )
      );
      setConversationProjectSelections((prev) => ({
        ...prev,
        [updatedConversation.id]: updatedConversation.project_id ?? "",
      }));
      return;
    }

    const remainingConversations = conversations.filter(
      (currentConversation) => currentConversation.id !== updatedConversation.id
    );

    setConversations(remainingConversations);
    syncConversationProjectSelections(remainingConversations);

    if (activeConversationId === updatedConversation.id) {
      const nextConversation = remainingConversations[0];

      if (nextConversation) {
        setActiveConversationId(nextConversation.id);
        setMessages([]);
        await loadMessages(nextConversation.id);
      } else {
        setActiveConversationId(null);
        setMessages([]);
        await createNewChat(scopedProjectId);
      }
    }
  }

  function getConversationScopeLabel(conversation: Conversation) {
    if (!conversation.project_id) {
      return "Global Chat";
    }

    if (conversation.project_id === scopedProjectId && activeProjectName) {
      return activeProjectName;
    }

    return projects.find((project) => project.id === conversation.project_id)?.name || "Project Chat";
  }

  useEffect(() => {
    async function initializeChat() {
      const params = new URLSearchParams();

      if (scopedProjectId) {
        params.set("projectId", scopedProjectId);
      }

      const response = await fetch(`/api/conversations${params.size > 0 ? `?${params.toString()}` : ""}`, {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        console.error(result.error || "failed to load conversations");
        return;
      }

      const data = (result ?? []) as Conversation[];

      if (data && data.length > 0) {
        setConversations(data);
        syncConversationProjectSelections(data);
        setActiveConversationId(data[0].id);
        return;
      }

      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert([{ title: "New Chat", project_id: scopedProjectId }])
        .select()
        .single();

      if (createError) {
        console.error(createError);
        return;
      }

      setConversations([newConversation]);
      syncConversationProjectSelections([newConversation]);
      setActiveConversationId(newConversation.id);
    }

    initializeChat();
  }, [scopedProjectId]);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const newFlag = searchParams?.get("new");
    const conv = searchParams?.get("conversationId") || searchParams?.get("conversation");
    setActiveProjectId(scopedProjectId);

    const baseChatUrl = !scopedProjectId
      ? "/chat"
      : `/chat?projectId=${scopedProjectId}`;

    if (newFlag) {
      createNewChat(scopedProjectId).then(() => router.replace(baseChatUrl));
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
  }, [searchParams, scopedProjectId]);

  useEffect(() => {
    async function loadActiveProjectName(projectId: string) {
      if (!projectId.trim() || !UUID_PATTERN.test(projectId)) {
        setActiveProjectName(null);
        return;
      }

      const response = await fetch(`/api/projects?id=${encodeURIComponent(projectId)}`, {
        cache: "no-store",
      });

      if (response.status === 404) {
        setActiveProjectName(null);
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        setActiveProjectName(null);

        if (process.env.NODE_ENV === "development") {
          console.warn("Failed to load active project name", result.error || result);
        }

        return;
      }

      setActiveProjectName(result.project?.name || null);
    }

    if (!scopedProjectId) {
      setActiveProjectName(null);
      return;
    }

    loadActiveProjectName(scopedProjectId);
  }, [scopedProjectId]);

  useEffect(() => {
    if (activeConversationId) {
      setAutoScrollEnabled(true);
      setShowJumpToLatest(false);
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    const hasNewMessage = messages.length > previousMessageCountRef.current;
    const assistantMessageStarted = loading && !previousLoadingRef.current;

    if (autoScrollEnabled && (hasNewMessage || assistantMessageStarted)) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }

    previousMessageCountRef.current = messages.length;
    previousLoadingRef.current = loading;
  }, [messages.length, loading, autoScrollEnabled]);

  function handleMessagesScroll() {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 80;

    setAutoScrollEnabled(isNearBottom);
    setShowJumpToLatest(!isNearBottom);
  }

  function buildMemoryTitle(content: string) {
    const normalizedContent = content.replace(/\s+/g, " ").trim();

    if (!normalizedContent) {
      return "Saved Assistant Memory";
    }

    return normalizedContent.length > 60
      ? `${normalizedContent.slice(0, 60).trimEnd()}...`
      : normalizedContent;
  }

  function openSaveMemoryDialog(content: string) {
    setMemoryNotice(null);
    setMemoryDraft({
      memoryType: "technical",
      title: buildMemoryTitle(content),
      content,
      importance: 1,
    });
  }

  async function saveMemory() {
    if (!memoryDraft || !scopedProjectId) {
      return;
    }

    setSavingMemory(true);

    try {
      await createProjectMemory(memoryDraft);
      setMemoryDraft(null);
      setMemoryNotice({ type: "success", message: "Memory saved" });
    } catch (error: any) {
      setMemoryNotice({
        type: "error",
        message: error?.message ?? "Failed to save memory.",
      });
    } finally {
      setSavingMemory(false);
    }
  }

  const pinnedConversations = conversations.filter((conversation) => Boolean(conversation.pinned));
  const recentConversations = conversations.filter((conversation) => !Boolean(conversation.pinned));

  

  async function handleSend() {
    if (!message.trim() || !activeConversationId) return;

    const userMessage: Message = {
      id: createMessageId("user"),
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    await supabase.from("messages").insert([
      {
        role: userMessage.role,
        content: userMessage.content,
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
        conversationId: activeConversationId,
        projectId: scopedProjectId,
      }),
    });

    if (!response.ok) {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId("assistant-error"),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
      return;
    }

    const data = await response.json();

    const assistantMessage: Message = {
      id: createMessageId("assistant"),
      role: "assistant",
      content: data.reply,
    };

    await supabase.from("messages").insert([
      {
        role: assistantMessage.role,
        content: assistantMessage.content,
        conversation_id: activeConversationId,
      },
    ]);

    setLoading(false);
    setMessages((prev) => [...prev, assistantMessage]);

    if (scopedProjectId) {
      void requestSuggestedMemory(
        assistantMessage.id,
        assistantMessage.content,
        activeConversationId
      );
    }
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

      {conversationNotice && (
        <div className={`mb-3 rounded-xl border px-3 py-2 text-xs ${conversationNotice.type === "success" ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
          {conversationNotice.message}
        </div>
      )}

      <div className="flex-1 overflow-auto px-0 pt-0 pb-4">
        {pinnedConversations.length > 0 && (
          <>
            <h3 className="mb-2 text-xs uppercase tracking-wider text-slate-500">Pinned</h3>
            <div className="mb-4 space-y-2">
              {pinnedConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`rounded-xl border p-3 text-sm ${activeConversationId === conversation.id ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-200" : "border-slate-800 bg-slate-800/70 text-slate-200"}`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={async () => {
                        setActiveConversationId(conversation.id);
                        await loadMessages(conversation.id);
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="truncate font-medium">{conversation.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{new Date(conversation.created_at).toLocaleString()}</div>
                    </button>

                    <button
                      onClick={() => setOpenMenuId(openMenuId === conversation.id ? null : conversation.id)}
                      className="rounded-lg border border-slate-700 p-1.5 text-slate-400 transition hover:text-white"
                      aria-label="Conversation actions"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="mb-2 inline-flex rounded-full border border-slate-700 px-2.5 py-1 text-[11px] uppercase tracking-wide text-slate-300">
                      {getConversationScopeLabel(conversation)}
                    </div>

                    <div className="flex flex-col gap-2">
                      <select
                        value={conversationProjectSelections[conversation.id] ?? conversation.project_id ?? ""}
                        onChange={(e) => setConversationProjectSelections((prev) => ({
                          ...prev,
                          [conversation.id]: e.target.value,
                        }))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      >
                        <option value="">Global Chat</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => updateConversationProject(conversation)}
                        disabled={movingConversationId === conversation.id}
                        className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {movingConversationId === conversation.id ? "Saving..." : "Save / Move"}
                      </button>
                    </div>
                  </div>

                  {openMenuId === conversation.id && (
                    <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900/90 p-2 shadow-xl">
                      <button onClick={() => togglePin(conversation)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800">
                        {conversation.pinned ? "Unpin" : "Pin"}
                      </button>
                      <button onClick={() => { renameChat(conversation.id, conversation.title); setOpenMenuId(null); }} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800">Rename</button>
                      <button onClick={() => { deleteChat(conversation.id); setOpenMenuId(null); }} className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-950/40">Delete</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <h3 className="mb-2 text-sm text-slate-400">Recent Chats</h3>

        <div className="space-y-2">
          {recentConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`rounded-xl border p-3 text-sm ${activeConversationId === conversation.id ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-200" : "border-slate-800 bg-slate-800/70 text-slate-200"}`}
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={async () => {
                    setActiveConversationId(conversation.id);
                    await loadMessages(conversation.id);
                  }}
                  className="flex-1 text-left"
                >
                  <div className="truncate font-medium">{conversation.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{new Date(conversation.created_at).toLocaleString()}</div>
                </button>

                <button
                  onClick={() => setOpenMenuId(openMenuId === conversation.id ? null : conversation.id)}
                  className="rounded-lg border border-slate-700 p-1.5 text-slate-400 transition hover:text-white"
                  aria-label="Conversation actions"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>

              <div className="mt-3">
                <div className="mb-2 inline-flex rounded-full border border-slate-700 px-2.5 py-1 text-[11px] uppercase tracking-wide text-slate-300">
                  {getConversationScopeLabel(conversation)}
                </div>

                <div className="flex flex-col gap-2">
                  <select
                    value={conversationProjectSelections[conversation.id] ?? conversation.project_id ?? ""}
                    onChange={(e) => setConversationProjectSelections((prev) => ({
                      ...prev,
                      [conversation.id]: e.target.value,
                    }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  >
                    <option value="">Global Chat</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => updateConversationProject(conversation)}
                    disabled={movingConversationId === conversation.id}
                    className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {movingConversationId === conversation.id ? "Saving..." : "Save / Move"}
                  </button>
                </div>
              </div>

              {openMenuId === conversation.id && (
                <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900/90 p-2 shadow-xl">
                  <button onClick={() => togglePin(conversation)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800">
                    {conversation.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button onClick={() => { renameChat(conversation.id, conversation.title); setOpenMenuId(null); }} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800">Rename</button>
                  <button onClick={() => { deleteChat(conversation.id); setOpenMenuId(null); }} className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-950/40">Delete</button>
                </div>
              )}
            </div>
          ))}

          {recentConversations.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-4 text-sm text-slate-400">
              No recent conversations in this scope.
            </div>
          )}
        </div>
      </div>
    </div>
  </aside>

<section className="relative z-10 flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-950">
  {memoryDraft && (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Save To Memory</h2>
            <p className="mt-1 text-sm text-slate-400">Save this assistant response into project memories.</p>
          </div>

          <button
            onClick={() => {
              setMemoryDraft(null);
              setMemoryNotice(null);
            }}
            className="rounded-lg border border-slate-700 p-2 text-slate-400 transition hover:text-white"
            aria-label="Close save memory dialog"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Memory Type</span>
            <input
              value={memoryDraft.memoryType}
              onChange={(e) => setMemoryDraft((current) => current ? { ...current, memoryType: e.target.value } : current)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Title</span>
            <input
              value={memoryDraft.title}
              onChange={(e) => setMemoryDraft((current) => current ? { ...current, title: e.target.value } : current)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Content</span>
            <textarea
              value={memoryDraft.content}
              onChange={(e) => setMemoryDraft((current) => current ? { ...current, content: e.target.value } : current)}
              className="min-h-[160px] w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Importance</span>
            <input
              type="number"
              min={1}
              value={memoryDraft.importance}
              onChange={(e) => setMemoryDraft((current) => current ? { ...current, importance: Number(e.target.value) || 1 } : current)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            />
          </label>

          {memoryNotice && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${memoryNotice.type === "success" ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
              {memoryNotice.message}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={() => {
                setMemoryDraft(null);
                setMemoryNotice(null);
              }}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500"
            >
              Cancel
            </button>

            <button
              onClick={saveMemory}
              disabled={savingMemory}
              className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingMemory ? "Saving..." : "Save To Memory"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

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

  <div
    ref={messagesContainerRef}
    onScroll={handleMessagesScroll}
    className="flex-1 min-h-0 overflow-y-auto"
  >
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

    <div className="mx-auto w-full max-w-4xl space-y-5 pb-24 md:pb-28">
      {messages.map((msg) => (
          <div
        key={msg.id}
            className={`w-full rounded-[1.6rem] border px-5 py-4 shadow-sm md:px-6 md:py-5 ${
              msg.role === "user"
  ? "ml-auto max-w-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-950 border-yellow-400/30"
                : "max-w-4xl border-slate-800 bg-slate-900/85 text-slate-200"
            }`}
          >
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-inherit/80">
              {msg.role === "user" ? "Almond" : "Gatekeeper AI"}
            </p>

            <div className="chat-markdown max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>

            {scopedProjectId && msg.role === "assistant" && msg.suggestedMemory && (
              <div className="mt-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-slate-100">
                <div className="mb-3 flex items-center gap-2 text-sky-300">
                  <Sparkles size={16} />
                  <span className="font-semibold">Suggested Memory</span>
                </div>

                <div className="space-y-2">
                  <p>
                    <span className="text-slate-400">Type:</span>{" "}
                    <span className="font-medium text-white">{formatMemoryTypeLabel(msg.suggestedMemory.memoryType)}</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Importance:</span>{" "}
                    <span className="font-medium text-white">{msg.suggestedMemory.importance}</span>
                  </p>
                  <div>
                    <p className="mb-1 text-slate-400">Title:</p>
                    <p className="font-medium text-white">{msg.suggestedMemory.title}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-slate-400">Content:</p>
                    <p className="text-slate-200">{msg.suggestedMemory.content}</p>
                  </div>
                </div>

                {msg.suggestedMemory.status === "saved" ? (
                  <p className="mt-4 text-sm font-medium text-green-300">Saved to project memory.</p>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => saveSuggestedMemory(msg.id)}
                      disabled={msg.suggestedMemory.status === "saving"}
                      className="rounded-xl border border-sky-400/40 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-200 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {msg.suggestedMemory.status === "saving" ? "Saving..." : "Save Memory"}
                    </button>
                    <button
                      onClick={() => dismissSuggestedMemory(msg.id)}
                      disabled={msg.suggestedMemory.status === "saving"}
                      className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {msg.suggestedMemory.errorMessage && (
                  <p className="mt-3 text-sm text-red-300">{msg.suggestedMemory.errorMessage}</p>
                )}
              </div>
            )}

            {scopedProjectId && msg.role === "assistant" && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => openSaveMemoryDialog(msg.content)}
                  className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs font-semibold text-yellow-300 transition hover:bg-yellow-500/20"
                >
                  Save To Memory
                </button>
              </div>
            )}
          </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  </div>
  </div>

  <div className="sticky bottom-0 z-20 shrink-0 border-t border-slate-800 bg-[#020617]/95 px-4 py-3 backdrop-blur">
    <div className="mx-auto w-full max-w-4xl">
      {loading && (
        <div className="mb-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-400">
          Gatekeeper AI is thinking...
        </div>
      )}

      {!memoryDraft && memoryNotice && (
        <div className={`mb-3 rounded-xl border px-3 py-2 text-sm ${memoryNotice.type === "success" ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
          {memoryNotice.message}
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