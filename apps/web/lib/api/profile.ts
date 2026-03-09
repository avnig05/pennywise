import { apiFetch } from "./client";
import type { Profile, ProfileUpdate } from "../../types/profile";

export async function getProfile(): Promise<Profile> {
  return apiFetch<Profile>("/me", { method: "GET" });
}

export async function updateProfile(update: ProfileUpdate): Promise<Profile> {
  return apiFetch<Profile>("/me", {
    method: "PUT",
    body: JSON.stringify(update),
  });
}

/** Toggle one article in the user's saved list. Returns the updated list. */
export async function toggleSavedArticle(articleId: string): Promise<{ saved_articles: string[] }> {
  return apiFetch<{ saved_articles: string[] }>("/me/saved/toggle", {
    method: "POST",
    body: JSON.stringify({ article_id: articleId }),
  });
}

export interface ProgressItem {
  category: string;
  label: string;
  percent: number;
}

export interface LearningProgressResponse {
  progress: ProgressItem[];
}

/** Get learning progress per category (quiz completions). */
export async function getLearningProgress(): Promise<LearningProgressResponse> {
  return apiFetch<LearningProgressResponse>("/me/progress", { method: "GET" });
}

