'use client';
import React from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Article } from "@/types";
import { useBookmarks } from "@/lib/bookmarks";

type Props = {
  article: Article;
};

export default function ArticleCard({ article }: Props) {
  const { isSaved, toggle } = useBookmarks();
  const saved = isSaved(article.id);

  return (
    <div className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="rounded-full border px-3 py-1 text-xs text-gray-700">{article.category}</span>
        <button
          aria-label="Toggle bookmark"
          onClick={() => toggle(article.id)}
          className="text-gray-700 hover:text-[var(--color-sage)] transition"
        >
          {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{article.title}</h3>
      <p className="mt-2 text-sm text-gray-700">{article.description}</p>
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <span>{article.readTimeMin} min read</span>
        <span className="rounded-full border px-2 py-1 text-xs">{article.difficulty}</span>
      </div>
    </div>
  );
}
