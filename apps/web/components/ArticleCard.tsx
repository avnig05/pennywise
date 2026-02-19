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

  return (
    <div
      className={`group rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
        isCompleted
          ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50"
          : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full border px-3 py-1 text-xs text-gray-700">{article.category}</span>
          {isCompleted && (
            <div className="flex items-center gap-1.5 rounded-full border-2 border-green-300 bg-green-50 px-2.5 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-semibold text-green-700">Completed</span>
            </div>
          )}
        </div>
        <button
          aria-label="Toggle bookmark"
          onClick={() => toggle(article.id)}
          className="text-gray-700 hover:text-[var(--color-sage)] transition"
        >
          {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{article.title}</h3>
      <p className="mt-2 text-sm text-gray-700 line-clamp-4">{description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
        <span>{article.readTimeMin} min read</span>
        <span className="rounded-full border px-2 py-1 text-xs">{article.difficulty}</span>
        {isCompleted && completionScore !== null && (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            Score: {completionScore}%
          </span>
        )}
        <Link
          href={`/article/${article.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-sage)] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <BookOpen size={16} />
          {isCompleted ? "Review article" : "Read"}
        </Link>
      </div>
    </div>
  );
}
