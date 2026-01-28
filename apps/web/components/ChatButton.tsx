import { MessageCircle } from "lucide-react";
import React from "react";

export default function ChatButton() {
  return (
    <button className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[var(--color-sage)] px-4 py-3 text-white shadow-lg transition hover:shadow-xl">
      <MessageCircle size={18} />
      <span>Ask pennywise</span>
    </button>
  );
}
