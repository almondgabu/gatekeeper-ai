"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello Almond. How can I help you today?",
    },
  ]);

const [loading, setLoading] = useState(false);

  async function handleSend() {
  if (!message.trim()) return;

  const userMessage: Message = {
    role: "user",
    content: message,
  };

  setMessages((prev) => [...prev, userMessage]);
  setMessage("");
  setLoading(true);

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message,
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

setLoading(false);

const assistantMessage: Message = {
  role: "assistant",
  content: data.reply,
};

  setMessages((prev) => [...prev, assistantMessage]);
}

  return (
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <h1 className="text-4xl font-bold mb-6">Gatekeeper AI Chat</h1>

      <div className="space-y-4 mb-6">
        {messages.map((msg, index) => (
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
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      {loading && (
  <div className="bg-slate-800 rounded-2xl p-4 mb-4 text-slate-400">
    Gatekeeper AI is thinking...
  </div>
)}

      <textarea
        className="w-full h-32 bg-slate-900 rounded-2xl p-4 text-white outline-none"
        placeholder="Ask Gatekeeper AI anything..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        onClick={handleSend}
        className="mt-4 bg-yellow-500 text-slate-950 px-6 py-3 rounded-xl font-semibold"
      >
        Send
      </button>
    </main>
  );
}