"use client";

import { MessageCircle, X, Send, Loader2, Plus, Trash2 } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import {
  askChat,
  listChats,
  getChat,
  deleteChat,
  type ChatListItem,
  type Message,
  type ChatSource,
} from "@/lib/api/chat";

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const min = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (min < 1) return "Now";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return d.toLocaleDateString();
}

function parseStepsFromContent(content: string): string[] | null {
  if (!content?.trim()) return null;
  const trimmed = content.trim();
  // Match "1. text" or "2. text" pattern
  const numberedMatches = [...trimmed.matchAll(/(\d+)\.\s+([\s\S]+?)(?=\s*\d+\.\s+|\s*$)/g)];
  if (numberedMatches.length >= 2) {
    const steps = numberedMatches.map((m) => m[2].trim()).filter(Boolean);
    if (steps.length >= 2) return steps;
  }
  // Match "Step 1:", "Step 2:" pattern
  const stepLabelMatches = [
    ...trimmed.matchAll(/Step\s+\d+\s*[:\-]\s*([\s\S]+?)(?=Step\s+\d+\s*[:\-]|\s*$)/gi),
  ];
  if (stepLabelMatches.length >= 2) {
    const steps = stepLabelMatches.map((m) => m[1].trim()).filter(Boolean);
    if (steps.length >= 2) return steps;
  }
  return null;
}

export default function ChatButton() {
  const [open, setOpen] = useState(false);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) loadChats();
  }, [open]);

  useEffect(() => {
    if (currentChatId) {
      getChat(currentChatId).then((c) => setMessages(c.messages)).catch(() => setMessages([]));
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadChats() {
    setLoadingChats(true);
    try {
      const list = await listChats();
      setChats(list);
      if (!currentChatId && list.length > 0) setCurrentChatId(list[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChats(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    const userMsg: Message = {
      id: `t-${Date.now()}`,
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((p) => [...p, userMsg]);
    setMessage("");
    try {
      const res = await askChat(trimmed, currentChatId ?? undefined);
      setMessages((p) => [
        ...p,
        {
          id: `t-a-${Date.now()}`,
          role: "assistant",
          content: res.reply,
          sources: res.sources ?? null,
          steps: res.steps ?? null,
          created_at: new Date().toISOString(),
        },
      ]);
      if (res.chat_id && res.chat_id !== currentChatId) setCurrentChatId(res.chat_id);
      await loadChats();
      if (res.chat_id) {
        const c = await getChat(res.chat_id);
        setMessages(c.messages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setMessages((p) => p.filter((m) => m.id !== userMsg.id));
    } finally {
      setLoading(false);
    }
  }

  function handleNewChat() {
    setCurrentChatId(null);
    setMessages([]);
    setMessage("");
    setError(null);
  }

  async function handleDelete(chatId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    try {
      await deleteChat(chatId);
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      await loadChats();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[var(--color-sage)] px-4 py-3 text-white shadow-lg transition hover:shadow-xl"
        aria-label="Ask Pennywise"
      >
        <MessageCircle size={18} />
        <span>Ask pennywise</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/20" aria-hidden onClick={() => setOpen(false)} />
          <div className="relative flex h-[85vh] w-full max-w-4xl flex-col rounded-2xl border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-semibold text-gray-900">Ask Pennywise</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="New conversation"
                  title="New conversation"
                >
                  <Plus size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden rounded-b-2xl">
              <div className="w-64 shrink-0 overflow-y-auto rounded-bl-2xl border-r bg-gray-50">
                <div className="p-3">
                  <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">Conversations</h3>
                  {loadingChats ? (
                    <p className="text-xs text-gray-500">Loading...</p>
                  ) : chats.length === 0 ? (
                    <p className="text-xs text-gray-500">No conversations yet</p>
                  ) : (
                    <div className="space-y-1">
                      {chats.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => setCurrentChatId(chat.id)}
                          className={`group flex cursor-pointer items-center justify-between rounded-lg p-2 text-sm transition ${
                            currentChatId === chat.id ? "bg-[var(--color-sage)]/10 text-gray-900" : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{chat.title || "New chat"}</p>
                            <p className="text-xs text-gray-500">{formatTime(chat.updated_at)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(chat.id, e)}
                            className="rounded p-1 text-gray-400 opacity-0 transition hover:text-red-600 group-hover:opacity-100"
                            aria-label="Delete chat"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col">
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  {error && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
                  {messages.length === 0 && !loading && (
                    <p className="text-sm text-gray-500">
                      {currentChatId ? "Type something to get started." : "Select a conversation or type to create a new one."}
                    </p>
                  )}
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const stepsToShow =
                        msg.role === "assistant" ? (msg.steps ?? parseStepsFromContent(msg.content)) : null;
                      return (
                      <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            msg.role === "user" ? "bg-[var(--color-sage)] text-white" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {stepsToShow && stepsToShow.length > 0 ? (
                            <ol className="list-none space-y-2 pl-0">
                              {stepsToShow.map((step, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-sage)]/20 text-xs font-semibold text-gray-700">
                                    {i + 1}
                                  </span>
                                  <span className="whitespace-pre-wrap">{step}</span>
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-2 border-t border-gray-300 pt-2">
                              <p className="mb-1 text-xs font-medium">Sources:</p>
                              <ul className="space-y-1 text-xs">
                                {msg.sources.map((s, i) => (
                                  <li key={i}>
                                    <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                                      {s.title}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      );
                    })}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="rounded-lg bg-gray-100 px-3 py-2">
                          <Loader2 size={16} className="animate-spin text-gray-500" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="border-t p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="e.g. How do I save for emergencies?"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-sage)] focus:outline-none focus:ring-1 focus:ring-[var(--color-sage)]"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading || !message.trim()}
                      className="rounded-lg bg-[var(--color-sage)] px-4 py-2 text-white disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
