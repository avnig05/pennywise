import { apiFetch } from "./client";
import type { Article } from "@/types";

/** Article shape returned by GET /me/feed */
export interface FeedArticle {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  difficulty: string;
  source_name: string | null;
  source_url: string | null;
  created_at: string;
}

export interface FeedResponse {
  articles: FeedArticle[];
}

export async function getFeed(topN = 5): Promise<FeedResponse> {
  return apiFetch<FeedResponse>(`/me/feed?top_n=${Math.min(20, Math.max(1, topN))}`, {
    method: "GET",
  });
}

/** Map API feed article to the Article type used by ArticleCard */
export function feedArticleToArticle(a: FeedArticle): Article {
  return {
    id: a.id,
    title: a.title,
    description: a.summary ?? "",
    category: a.category as Article["category"],
    readTimeMin: 5,
    difficulty: (a.difficulty?.charAt(0).toUpperCase() + a.difficulty?.slice(1).toLowerCase()) as Article["difficulty"],
  };
}
