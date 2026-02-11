import { apiFetch } from "./client";
import type { Article } from "@/types";

/** Full article as returned by GET /articles/{id} (includes original_content). */
export interface FullArticle {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  difficulty: string;
  source_name: string | null;
  source_url: string | null;
  original_content: string | null;
  scraped_at: string | null;
  created_at: string;
}

export async function getArticle(articleId: string): Promise<FullArticle> {
  return apiFetch<FullArticle>(`/articles/${articleId}`, { method: "GET" });
}

/** Map API full article to the Article type used by ArticleCard */
export function fullArticleToArticle(a: FullArticle): Article {
  const difficulty = a.difficulty?.charAt(0).toUpperCase() + a.difficulty?.slice(1).toLowerCase();
  return {
    id: a.id,
    title: a.title,
    description: a.summary ?? "",
    category: a.category as Article["category"],
    readTimeMin: 5,
    difficulty: difficulty as Article["difficulty"],
  };
}
