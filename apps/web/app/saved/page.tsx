'use client';
import { useEffect, useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import ChatButton from "@/components/ChatButton";
import { getArticle, fullArticleToArticle } from "@/lib/api/articles";
import { useBookmarks } from "@/lib/bookmarks";
import type { Article } from "@/types";

export default function SavedPage() {
  const { list } = useBookmarks();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (list.length === 0) {
      setArticles([]);
      setLoading(false);
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

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Saved Articles</h1>
        <p className="mt-2 text-sm text-gray-700">Your bookmarked content</p>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-2xl border bg-white p-6 text-gray-700">Loading saved articles...</div>
          ) : articles.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-gray-700">You have no saved articles yet.</div>
          ) : (
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
