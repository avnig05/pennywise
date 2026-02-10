import { apiFetch } from "./client";

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
