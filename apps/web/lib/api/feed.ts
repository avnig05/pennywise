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

const CACHE_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = "pennywise_feed_cache";

let cached: FeedResponse | null = null;
let cachedAt = 0;
let cachedTopN = 0;

function readSessionCache(): { data: FeedResponse; at: number; topN: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: FeedResponse; at: number; topN: number };
    if (!parsed?.data?.articles) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(data: FeedResponse, topN: number): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ data, at: Date.now(), topN })
    );
  } catch {
    // ignore
  }
}

/** Returns cached feed if still valid (memory or sessionStorage). Instant when returning to dashboard. */
export function getCachedFeed(topN = 5): FeedResponse | null {
  const n = Math.min(20, Math.max(1, topN));
  if (cached && cachedTopN === n && Date.now() - cachedAt < CACHE_MS) {
    return cached;
  }
  const session = readSessionCache();
  if (session && session.topN === n && Date.now() - session.at < CACHE_MS) {
    cached = session.data;
    cachedAt = session.at;
    cachedTopN = n;
    return session.data;
  }
  return null;
}

export async function getFeed(topN = 5): Promise<FeedResponse> {
  const n = Math.min(20, Math.max(1, topN));
  if (cached && cachedTopN === n && Date.now() - cachedAt < CACHE_MS) {
    return cached;
  }
  const session = readSessionCache();
  if (session && session.topN === n && Date.now() - session.at < CACHE_MS) {
    cached = session.data;
    cachedAt = session.at;
    cachedTopN = n;
    return session.data;
  }
  const result = await apiFetch<FeedResponse>(`/me/feed?top_n=${n}`, {
    method: "GET",
  });
  cached = result;
  cachedAt = Date.now();
  cachedTopN = n;
  writeSessionCache(result, n);
  return result;
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
