import ArticleCard from "@/components/ArticleCard";
import { getFeed, feedArticleToArticle } from "@/lib/api/feed";
import type { Article } from "@/types";

export default async function RecommendedArticles() {
  let recommended: Article[] = [];
  try {
    const { articles } = await getFeed(5);
    recommended = articles.map(feedArticleToArticle);
  } catch {
    // API unreachable or error — show empty state
  }

  if (recommended.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border bg-white p-6 text-gray-700">
        No recommendations available yet.
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
      {recommended.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
