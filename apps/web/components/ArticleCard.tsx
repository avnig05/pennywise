'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, BookOpen, CheckCircle2 } from "lucide-react";
import { Article } from "@/types";
import { useBookmarks } from "@/lib/bookmarks";
import { getArticleCompletion } from "@/lib/api/quizzes";

const MAX_DESCRIPTION_CHARS = 400;

function truncateDescription(text: string, maxChars: number): string {
  if (!text || text.length <= maxChars) return text;
  return text.slice(0, maxChars).trim() + "...";
}

type Props = {
  article: Article;
};

export default function ArticleCard({ article }: Props) {
  const { isSaved, toggle } = useBookmarks();
  const [mounted, setMounted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionScore, setCompletionScore] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    async function checkCompletion() {
      try {
        const completion = await getArticleCompletion(article.id);
        if (!cancelled && completion) {
          setIsCompleted(true);
          setCompletionScore(completion.quiz_score);
        }
      } catch {
        // Ignore errors - article might not have a quiz yet
      }
    }
    checkCompletion();
    return () => {
      cancelled = true;
    };
  }, [article.id, mounted]);

  // During SSR and initial hydration, always show Bookmark (not saved state)
  // This prevents hydration mismatch. After mount, show actual saved state.
  const saved = mounted ? isSaved(article.id) : false;

  // Short excerpt for card (full summary is on the article page)
  const maxDescLen = 300;
  const description =
    article.description.length <= maxDescLen
      ? article.description
      : article.description.slice(0, maxDescLen).trim().replace(/\s+\S*$/, "") + "…";

  const categoryDisplay =
    typeof article.category === "string"
      ? article.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : String(article.category);

  return (
    <div
      className={`group rounded-2xl p-6 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)] ${
        isCompleted
          ? "border border-green-200 bg-gradient-to-br from-green-50/80 to-emerald-50/80"
          : "border border-[var(--border-color)] bg-[var(--bg-card)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-[var(--color-primary-light)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]">
            {categoryDisplay}
          </span>
          <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
            {article.readTimeMin} min read
          </span>
          <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs capitalize text-gray-700">
            {article.difficulty}
          </span>
          {isCompleted && (
            <span className="flex items-center gap-1 rounded-lg bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </span>
          )}
        </div>
        <button
          aria-label="Toggle bookmark"
          onClick={() => toggle(article.id)}
          className="shrink-0 text-gray-500 hover:text-[var(--color-sage)] transition"
        >
          {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-snug text-[var(--text-primary)]">
        {article.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-4">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {isCompleted && completionScore !== null && (
          <span className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
            Score: {completionScore}%
          </span>
        )}
        <Link
          href={`/article/${article.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-sage)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
        >
          <BookOpen size={16} />
          {isCompleted ? "Review article" : "Read"}
        </Link>
      </div>
    </div>
  );
}
