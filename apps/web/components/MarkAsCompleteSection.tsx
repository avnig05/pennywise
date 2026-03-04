"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CheckCircle, Loader2 } from "lucide-react";
import { markArticleRead } from "@/lib/api/profile";
import { getArticleCompletion } from "@/lib/api/quizzes";

type Props = {
  articleId: string;
  quizRef: React.RefObject<HTMLDivElement | null>;
};

function PennywiseIcon() {
  return (
    <div
      className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border"
      style={{
        backgroundColor: "#fff",
        borderColor: "#6B908033",
      }}
      aria-hidden
    >
      <Image
        src="/pennywise-logo.png"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 brightness-0"
      />
    </div>
  );
}

export default function MarkAsCompleteSection({ articleId, quizRef }: Props) {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getArticleCompletion(articleId).then((c) => {
      if (c) setCompleted(true);
    });
  }, [articleId]);

  const handleClick = async () => {
    if (completed) return;
    try {
      setLoading(true);
      await markArticleRead(articleId);
      setCompleted(true);
      quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      console.error("Failed to mark article as read:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mt-12 rounded-2xl p-8"
      style={{
        background: completed
          ? "linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.1) 100%)"
          : "linear-gradient(135deg, rgba(107, 144, 128, 0.05) 0%, rgba(107, 144, 128, 0.1) 100%)",
        border: completed ? "2px solid #22c55e4D" : "2px solid #6B90804D",
        boxShadow: "0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A",
      }}
    >
      <div className="flex flex-col items-center text-center">
        {completed ? (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={32} className="text-green-600" />
          </div>
        ) : (
          <PennywiseIcon />
        )}
        <h3
          className="mt-5 text-xl font-semibold"
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            color: completed ? "#166534" : "#3D4451",
          }}
        >
          {completed ? "Article Completed!" : "Finished Reading?"}
        </h3>
        <p
          className="mt-3 text-[15px] leading-relaxed"
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontWeight: 400,
            color: completed ? "#15803d" : "#6B7280",
          }}
        >
          {completed
            ? "Great job! Now test your knowledge with the quiz below."
            : "Click below to mark this article as complete and take the quiz!"}
        </p>
        <button
          onClick={handleClick}
          disabled={completed || loading}
          className="mt-8 inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-70 disabled:cursor-default"
          style={{
            backgroundColor: completed ? "#22c55e" : "#6B9080",
            fontFamily: "var(--font-inter), Inter, sans-serif",
          }}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Marking...
            </>
          ) : (
            <>
              <CheckCircle size={20} strokeWidth={2} />
              {completed ? "Completed" : "Mark as Complete"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
