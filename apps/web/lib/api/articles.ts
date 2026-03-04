import { apiFetch } from "./client";
import type { Article } from "@/types";

/** Structured section with Pennywise commentary (from GET /articles/{id}/structured). */
export interface ArticleSection {
  heading: string;
  content: string;
  commentary: string;
}

export interface StructuredArticle {
  intro_commentary: string;
  sections: ArticleSection[];
}

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

/** Article shape returned by GET /articles (list endpoint). */
export interface ListArticle {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  difficulty: string;
  source_name: string | null;
  source_url: string | null;
  scraped_at: string | null;
  created_at: string;
}

export async function getArticle(articleId: string): Promise<FullArticle> {
  return apiFetch<FullArticle>(`/articles/${articleId}`, { method: "GET" });
}

export async function getStructuredArticle(
  articleId: string
): Promise<StructuredArticle> {
  return apiFetch<StructuredArticle>(`/articles/${articleId}/structured`, {
    method: "GET",
  });
}

export async function listArticles(options?: {
  category?: string;
  difficulty?: string;
  limit?: number;
}): Promise<ListArticle[]> {
  const params = new URLSearchParams();
  if (options?.category) params.set("category", options.category);
  if (options?.difficulty) params.set("difficulty", options.difficulty);
  if (typeof options?.limit === "number") params.set("limit", String(options.limit));

  const qs = params.toString();
  return apiFetch<ListArticle[]>(`/articles${qs ? `?${qs}` : ""}`, { method: "GET" });
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
    difficulty: (difficulty || "Beginner") as Article["difficulty"],
  };
}

/** Map API list article to the Article type used by ArticleCard */
export function listArticleToArticle(a: ListArticle): Article {
  const difficulty = a.difficulty?.charAt(0).toUpperCase() + a.difficulty?.slice(1).toLowerCase();
  return {
    id: a.id,
    title: a.title,
    description: a.summary ?? "",
    category: a.category as Article["category"],
    readTimeMin: 5,
    difficulty: (difficulty || "Beginner") as Article["difficulty"],
  };
}
