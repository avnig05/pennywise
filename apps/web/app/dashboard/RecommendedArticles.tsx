'use client';

import { useEffect, useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import { getFeed, feedArticleToArticle } from "@/lib/api/feed";
import type { Article } from "@/types";
import RecommendedSkeleton from "./RecommendedSkeleton";

export default function RecommendedArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getFeed(5)
      .then(({ articles: feedArticles }) => {
        if (!cancelled) {
          setArticles(feedArticles.map(feedArticleToArticle));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setArticles([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <RecommendedSkeleton />;
  }

  if (articles.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border bg-white p-6 text-gray-700">
        No recommendations available yet.
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
