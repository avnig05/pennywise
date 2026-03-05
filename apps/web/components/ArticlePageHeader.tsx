"use client";

import Link from "next/link";
import { ArrowLeft, Bookmark, BookmarkCheck, BookOpen, CheckCircle2, Share2 } from "lucide-react";
import { useBookmarks } from "@/lib/bookmarks";
import { getArticleCompletion } from "@/lib/api/quizzes";
import { useState, useEffect } from "react";

type Props = {
  articleId: string;
  category: string;
  readTimeMin: number;
  difficulty: string;
  title: string;
  sourceName: string | null;
  sourceUrl: string | null;
};

export default function ArticlePageHeader({
  articleId,
  category,
  readTimeMin,
  difficulty,
  title,
  sourceName,
  sourceUrl,
}: Props) {
  const { isSaved, toggle } = useBookmarks();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<"unread" | "read" | "completed">("unread");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    getArticleCompletion(articleId).then((c) => {
      if (c) {
        setStatus(c.quiz_score !== null ? "completed" : "read");
      }
    });
  }, [articleId, mounted]);

  const saved = mounted ? isSaved(articleId) : false;

  const handleShare = async () => {
    if (typeof navigator.share !== "undefined") {
      try {
        await navigator.share({
          title,
          url: typeof window !== "undefined" ? window.location.href : "",
        });
      } catch {
        // User cancelled or share failed - copy to clipboard as fallback
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-nav)]"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3 text-[var(--text-nav)]">
          <button
            aria-label="Toggle bookmark"
            onClick={() => toggle(articleId)}
            className="hover:opacity-80"
          >
            {saved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
          </button>
          <button
            aria-label="Share"
            onClick={handleShare}
            className="hover:opacity-80"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-[var(--tag-category-bg)] px-2.5 py-1 text-xs font-medium text-[var(--tag-category-text)]">
          {category}
        </span>
        <span className="text-xs text-[var(--text-meta)]">
          {readTimeMin} min read
        </span>
        <span className="text-xs capitalize text-[var(--text-meta)]">
          {difficulty}
        </span>
        {mounted && status === "read" && (
          <span className="flex items-center gap-1 rounded-lg bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
            <BookOpen className="h-3.5 w-3.5" />
            Read
          </span>
        )}
        {mounted && status === "completed" && (
          <span className="flex items-center gap-1 rounded-lg bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed
          </span>
        )}
      </div>

      <h1 className="mt-4 text-2xl font-bold leading-tight text-[var(--text-title)] sm:text-3xl">
        {title}
      </h1>

      {(sourceName || sourceUrl) && (
        <div className="mt-2 text-sm text-[var(--text-meta)]">
          {sourceName}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-[var(--text-nav)] underline hover:no-underline"
            >
              View original
            </a>
          )}
        </div>
      )}
    </>
  );
}
