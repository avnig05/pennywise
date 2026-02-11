'use client';

import { useEffect, useState } from "react";
import ChatButton from "@/components/ChatButton";
import ArticleCard from "@/components/ArticleCard";
import { useBookmarks } from "@/lib/bookmarks";
import { getArticle, fullArticleToArticle } from "@/lib/api/articles";
import type { Article } from "@/types";

export default function SavedPage() {
  const { list, loading: bookmarksLoading } = useBookmarks();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!list.length) {
      setArticles([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(
      list.map((id) =>
        getArticle(id).then((full) => fullArticleToArticle(full)).catch(() => null)
      )
    ).then((results) => {
      if (!cancelled) {
        setArticles(results.filter((a): a is Article => a !== null));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [list.join(",")]);

  const showEmpty = !bookmarksLoading && list.length === 0;
  const showLoading = bookmarksLoading || (list.length > 0 && loading);
  const showGrid = list.length > 0 && !loading;

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Saved Articles</h1>
        <p className="mt-2 text-sm text-gray-700">Your bookmarked content</p>

        <div className="mt-6">
          {showLoading && (
            <div className="rounded-2xl border bg-white p-6 text-gray-700">
              Loading saved articles...
            </div>
          )}
          {showEmpty && (
            <div className="rounded-2xl border bg-white p-6 text-gray-700">
              You have no saved articles yet.
            </div>
          )}
          {showGrid && (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </section>
      <ChatButton />
    </main>
  );
}
