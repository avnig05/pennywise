"""
Personalized article recommendations using profile + article keywords and an LLM.
We send only id, title, category, difficulty, and keywords per article (no full content)
so the prompt is small and the LLM responds faster.
Results are cached per user so the dashboard loads instantly after the first computation.
"""

import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, Optional

log = logging.getLogger(__name__)

from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import GEMINI_API_KEY, RECOMMENDATIONS_CACHE_TTL_SECONDS, require_env
from app.core.supabase_client import supabase


# Fallback when an article has no keywords: use short summary slice
KEYWORDS_FALLBACK_SUMMARY_CHARS = 120
CANDIDATE_ARTICLE_LIMIT = 15
TOP_N = 5

RECOMMENDATION_PROMPT_TEMPLATE = """You are a financial education advisor. Given a user's profile and a list of articles (each with id, title, category, difficulty, and keywords), choose the top {top_n} articles that are most relevant and helpful for this user. Consider:
- Their stated interests and priority (saving, credit, debt, etc.)
- Their situation (income range, rent status, debt status, emergency buffer, etc.)
- Article category and difficulty vs. their likely level
- Match between article keywords and what they care about

User profile (JSON):
{profile_json}

Articles (each has id, title, category, difficulty, keywords):
{articles_json}

Respond with ONLY a JSON array of exactly {top_n} article IDs in order of recommendation (best first). No other text. Example format:
["uuid-1", "uuid-2", "uuid-3", "uuid-4", "uuid-5"]
"""


def _create_llm(temperature: float = 0.2) -> ChatGoogleGenerativeAI:
    api_key = require_env("GEMINI_API_KEY", GEMINI_API_KEY)
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=temperature,
    )


def get_profile(user_id: str) -> Optional[dict]:
    """Fetch the user's profile from Supabase."""
    resp = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
    rows = resp.data or []
    return rows[0] if rows else None


def _normalize_keywords(raw: Any) -> list[str]:
    """Parse keywords from DB: null, JSON string, or array."""
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(x).strip() for x in raw if x]
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            return [str(x).strip() for x in parsed] if isinstance(parsed, list) else []
        except json.JSONDecodeError:
            return [x.strip() for x in raw.split(",") if x.strip()]
    return []


def get_articles_for_recommendation(limit: int = CANDIDATE_ARTICLE_LIMIT) -> list[dict]:
    """
    Fetch articles with id, title, category, difficulty, and keywords.
    If keywords is missing or empty, use a short summary slice so the LLM still has something.
    """
    try:
        rows = (
            supabase.table("articles")
            .select("id, title, summary, category, difficulty, keywords")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        ).data or []
    except Exception:
        rows = (
            supabase.table("articles")
            .select("id, title, summary, category, difficulty")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        ).data or []

    result = []
    for a in rows:
        keywords = _normalize_keywords(a.get("keywords"))
        summary = (a.get("summary") or "")[:KEYWORDS_FALLBACK_SUMMARY_CHARS]
        result.append({
            "id": a["id"],
            "title": (a.get("title") or "")[:150],
            "category": a.get("category") or "",
            "difficulty": a.get("difficulty") or "beginner",
            "keywords": keywords if keywords else ([summary] if summary else []),
        })
    return result


def _parse_top_ids_from_response(response_text: str, expected_count: int) -> list[str]:
    """Parse a JSON array of article IDs from the LLM response. Tolerates markdown code blocks."""
    text = response_text.strip()
    # Remove optional markdown code block
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```\s*$", "", text)
    try:
        ids = json.loads(text)
        if isinstance(ids, list):
            return [str(x) for x in ids[:expected_count] if x]
        return []
    except json.JSONDecodeError:
        return []


def get_recommended_article_ids(
    user_id: str,
    top_n: int = TOP_N,
    candidate_limit: int = CANDIDATE_ARTICLE_LIMIT,
) -> list[str]:
    """
    Use profile + articles (id, title, category, difficulty, keywords) to ask the LLM
    for the top N recommended article IDs. Small payload = fewer tokens = lower latency.
    """
    profile = get_profile(user_id)
    if not profile:
        log.warning("Recommendations: no profile for user_id=%s (user needs to complete onboarding)", user_id)
        return []

    articles_payload = get_articles_for_recommendation(limit=candidate_limit)
    if not articles_payload:
        log.warning("Recommendations: no candidate articles (ingest articles first)")
        return []

    if len(articles_payload) <= TOP_N:
        return [a["id"] for a in articles_payload[:top_n]]

    profile_json = json.dumps(profile, separators=(",", ":"))
    articles_json = json.dumps(articles_payload, separators=(",", ":"))
    log.info("Recommendations: calling LLM for user_id=%s with %s candidates (profile keys: %s)", user_id, len(articles_payload), list(profile.keys()))

    prompt = RECOMMENDATION_PROMPT_TEMPLATE.format(
        top_n=top_n,
        profile_json=profile_json,
        articles_json=articles_json,
    )

    llm = _create_llm()
    try:
        response = llm.invoke(prompt)
        response_text = response.content if hasattr(response, "content") else str(response)
        top_ids = _parse_top_ids_from_response(response_text, top_n)
        valid_ids = {a["id"] for a in articles_payload}
        return [i for i in top_ids if i in valid_ids][:top_n]
    except Exception as e:
        log.warning("Recommendations: LLM failed for user_id=%s: %s", user_id, e)
        return []


def _get_cached_recommendation_ids(user_id: str) -> Optional[list[str]]:
    """
    Return cached article IDs for the user if present and not expired.
    Otherwise return None.
    """
    try:
        resp = (
            supabase.table("user_recommendations")
            .select("article_ids, updated_at")
            .eq("user_id", user_id)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            return None
        row = rows[0]
        updated_at_str = row.get("updated_at")
        if not updated_at_str:
            return None
        # Parse ISO timestamp (Supabase returns UTC)
        updated_at = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        if (now - updated_at).total_seconds() > RECOMMENDATIONS_CACHE_TTL_SECONDS:
            return None
        raw = row.get("article_ids")
        if raw is None:
            return None
        ids = json.loads(raw) if isinstance(raw, str) else raw
        return [str(x) for x in ids] if isinstance(ids, list) else None
    except Exception:
        return None


def _set_cached_recommendation_ids(user_id: str, article_ids: list[str]) -> None:
    """Store recommended article IDs for the user (upsert)."""
    try:
        payload = {
            "user_id": user_id,
            "article_ids": json.dumps(article_ids),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        supabase.table("user_recommendations").upsert(
            payload,
            on_conflict="user_id",
        ).execute()
    except Exception:
        pass  # Don't fail the request if cache write fails


def invalidate_recommendations_cache(user_id: str) -> None:
    """Clear cached recommendations for the user (e.g. after profile update). Next feed request will recompute."""
    try:
        supabase.table("user_recommendations").delete().eq("user_id", user_id).execute()
    except Exception:
        pass


def _articles_by_ids(article_ids: list[str]) -> list[dict]:
    """Fetch full article rows for the given IDs, in the same order."""
    if not article_ids:
        return []
    resp = supabase.table("articles").select(
        "id, title, summary, category, difficulty, source_name, source_url, created_at"
    ).in_("id", article_ids).execute()
    rows = resp.data or []
    id_to_row = {r["id"]: r for r in rows}
    return [id_to_row[i] for i in article_ids if i in id_to_row]


# Same columns as _articles_by_ids for consistent feed response shape
_FEED_SELECT = "id, title, summary, category, difficulty, source_name, source_url, created_at"


def get_recent_feed_articles(top_n: int) -> list[dict]:
    """Return the latest N articles for instant fallback feed (no LLM). Same shape as cached feed."""
    resp = (
        supabase.table("articles")
        .select(_FEED_SELECT)
        .order("created_at", desc=True)
        .limit(max(1, top_n))
        .execute()
    )
    return resp.data or []


def get_cached_feed(user_id: str, top_n: int) -> Optional[list[dict]]:
    """Return cached recommended articles if available and valid; otherwise None."""
    cached_ids = _get_cached_recommendation_ids(user_id)
    if not cached_ids:
        return None
    ordered = _articles_by_ids(cached_ids[:top_n])
    return ordered if ordered else None


def get_recommended_articles(
    user_id: str,
    top_n: int = TOP_N,
) -> list[dict]:
    """
    Get the top N recommended articles for the user as full article rows.
    Uses cached recommendations when available (instant); otherwise computes once via LLM and caches.
    Returns list of article dicts in recommendation order.
    """
    # 1. Try cache first (instant path)
    cached_ids = _get_cached_recommendation_ids(user_id)
    if cached_ids:
        ordered = _articles_by_ids(cached_ids[:top_n])
        if ordered:
            return ordered
        # Cache had stale/invalid IDs; fall through to recompute

    # 2. Compute via LLM (slow path); siempre pedimos y cacheamos solo TOP_N (5) para el feed
    requested = min(top_n, TOP_N) if top_n else TOP_N
    top_ids = get_recommended_article_ids(user_id, top_n=requested)
    if not top_ids:
        return []

    # 3. Guardar en caché solo los 5 (igual que antes), para que no se guarden 16/20
    ids_to_cache = top_ids[:TOP_N]
    _set_cached_recommendation_ids(user_id, ids_to_cache)

    # 4. Fetch and return full article rows in order
    return _articles_by_ids(top_ids)
