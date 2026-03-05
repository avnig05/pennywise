"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CheckCircle, BookOpen, Loader2 } from "lucide-react";
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
  const [status, setStatus] = useState<"unread" | "read" | "completed">("unread");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getArticleCompletion(articleId).then((c) => {
      if (c) {
        setStatus(c.quiz_score !== null ? "completed" : "read");
      }
    });
  }, [articleId]);

  const handleClick = async () => {
    if (status !== "unread") return;
    try {
      setLoading(true);
      await markArticleRead(articleId);
      setStatus("read");
      quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      console.error("Failed to mark article as read:", e);
    } finally {
      setLoading(false);
    }
  };

  const isRead = status === "read";
  const isCompleted = status === "completed";
  const isDone = isRead || isCompleted;

  return (
    <div
      className="mt-12 rounded-2xl p-8"
      style={{
        background: isDone
          ? "linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.1) 100%)"
          : "linear-gradient(135deg, rgba(107, 144, 128, 0.05) 0%, rgba(107, 144, 128, 0.1) 100%)",
        border: isDone
          ? "2px solid #22c55e4D"
          : "2px solid #6B90804D",
        boxShadow: "0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A",
      }}
    >
      <div className="flex flex-col items-center text-center">
        {isCompleted ? (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={32} className="text-green-600" />
          </div>
        ) : isRead ? (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-green-100">
            <BookOpen size={32} className="text-green-600" />
          </div>
        ) : (
          <PennywiseIcon />
        )}
        <h3
          className="mt-5 text-xl font-semibold"
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            color: isDone ? "#166534" : "#3D4451",
          }}
        >
          {isCompleted
            ? "Article Completed!"
            : isRead
            ? "Article Read!"
            : "Finished Reading?"}
        </h3>
        <p
          className="mt-3 text-[15px] leading-relaxed"
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontWeight: 400,
            color: isDone ? "#15803d" : "#6B7280",
          }}
        >
          {isCompleted
            ? "Great job! You've completed the quiz for this article."
            : isRead
            ? "Now test your knowledge with the quiz below."
            : "Click below to mark this article as complete and take the quiz!"}
        </p>
        <button
          onClick={handleClick}
          disabled={isDone || loading}
          className="mt-8 inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-70 disabled:cursor-default"
          style={{
            backgroundColor: isDone ? "#22c55e" : "#6B9080",
            fontFamily: "var(--font-inter), Inter, sans-serif",
          }}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Marking...
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle size={20} strokeWidth={2} />
              Completed
            </>
          ) : isRead ? (
            <>
              <BookOpen size={20} strokeWidth={2} />
              Read
            </>
          ) : (
            <>
              <CheckCircle size={20} strokeWidth={2} />
              Mark as Complete
            </>
          )}
        </button>
      </div>
    </div>
  );
}
