"use client";

import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { askChat, type ChatSource } from "@/lib/api/chat";

export default function ChatButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [sources, setSources] = useState<ChatSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setReply(null);
    setSources([]);
    try {
      const res = await askChat(trimmed);
      setReply(res.reply);
      setSources(res.sources ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
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
          <div
            className="absolute inset-0 bg-black/20"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-[85vh] w-full max-w-lg flex-col rounded-2xl border bg-white shadow-xl sm:max-w-md">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-semibold text-gray-900">Ask Pennywise</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {error && (
                <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>
              )}
              {reply && (
                <div className="space-y-2">
                  <p className="whitespace-pre-wrap text-sm text-gray-800">{reply}</p>
                  {sources.length > 0 && (
                    <div className="mt-4 border-t pt-3">
                      <p className="mb-2 text-xs font-medium text-gray-500">Sources</p>
                      <ul className="space-y-1 text-xs">
                        {sources.map((s, i) => (
                          <li key={i}>
                            <a
                              href={s.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--color-sage)] underline hover:no-underline"
                            >
                              {s.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {!reply && !loading && !error && (
                <p className="text-sm text-gray-500">
                  Ask a question about personal finance. Answers are based on our article library.
                </p>
              )}
            </div>
            <form onSubmit={handleSubmit} className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. How do I build an emergency fund?"
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
      )}
    </>
  );
}
