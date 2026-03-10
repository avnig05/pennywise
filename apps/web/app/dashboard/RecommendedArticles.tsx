'use client';

import { useEffect, useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import { getFeed, feedArticleToArticle } from "@/lib/api/feed";
import type { Article } from "@/types";
import RecommendedSkeleton from "./RecommendedSkeleton";

// State must not depend on sessionStorage/cache so server and client render the same (skeleton) first.
const INITIAL_ARTICLES: Article[] = [];
export default function RecommendedArticles() {
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getFeed(6)
      .then(({ articles: feedArticles }) => {
        if (!cancelled) {
          setArticles(feedArticles.map(feedArticleToArticle));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setArticles((prev) => (prev.length > 0 ? prev : []));
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
      <div className="mt-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-[var(--text-secondary)] shadow-[var(--shadow-sm)]">
        No recommendations available yet.
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
