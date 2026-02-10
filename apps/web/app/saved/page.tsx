'use client';

import { useEffect, useState } from "react";
import ChatButton from "@/components/ChatButton";
import ArticleCard from "@/components/ArticleCard";
import { useBookmarks } from "@/lib/bookmarks";
import { getArticle, type FullArticle } from "@/lib/api/articles";
import type { Article } from "@/types";

export default function SavedPage() {
  const { list } = useBookmarks();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!list.length) {
        setArticles([]);
        return;
      }

      setLoading(true);
      try {
        const results = await Promise.all(
          list.map(async (id) => {
            try {
              return await getArticle(id);
            } catch {
              // Ignore individual article load errors
              return null;
            }
          })
        );

        if (cancelled) return;

        const mapped: Article[] = results
          .filter((a): a is FullArticle => a !== null)
          .map((a) => ({
            id: a.id,
            title: a.title,
            description: a.summary ?? "",
            category: a.category as Article["category"],
            readTimeMin: 5,
            difficulty: (a.difficulty?.charAt(0).toUpperCase() + a.difficulty?.slice(1).toLowerCase()) as Article["difficulty"],
          }));

        setArticles(mapped);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [list]);

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Saved Articles</h1>
        <p className="mt-2 text-sm text-gray-700">Your bookmarked content</p>

        <div className="mt-6">
          {!list.length && (
            <div className="rounded-2xl border bg-white p-6 text-gray-700">
              You have no saved articles yet.
            </div>
          )}

          {list.length > 0 && loading && (
            <div className="rounded-2xl border bg-white p-6 text-gray-700">
              Loading your saved articles...
            </div>
          )}

          {list.length > 0 && !loading && (
            <div className="mt-4 grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
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
