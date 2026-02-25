"use client";

import Link from "next/link";
import { ArrowLeft, Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import { useBookmarks } from "@/lib/bookmarks";
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
  useEffect(() => setMounted(true), []);

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
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle bookmark"
            onClick={() => toggle(articleId)}
            className="text-gray-600 hover:text-gray-900"
          >
            {saved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
          </button>
          <button
            aria-label="Share"
            onClick={handleShare}
            className="text-gray-600 hover:text-gray-900"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="rounded-full border px-3 py-1 text-xs text-gray-700">
          {category}
        </span>
        <span className="rounded-full border px-3 py-1 text-xs text-gray-700">
          {readTimeMin} min read
        </span>
        <span className="rounded-full border px-3 py-1 text-xs capitalize text-gray-700">
          {difficulty}
        </span>
      </div>

      <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
        {title}
      </h1>

      {(sourceName || sourceUrl) && (
        <div className="mt-2 text-sm text-gray-600">
          {sourceName}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-[var(--color-sage)] underline hover:no-underline"
            >
              View original
            </a>
          )}
        </div>
      )}
    </>
  );
}
