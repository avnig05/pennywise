"""
Personalized article recommendations using profile + article/chunk content and an LLM.
Fetches user profile and article metadata + chunk content from Supabase, then asks
Gemini to return the top N most relevant article IDs for that user.
Results are cached per user so the dashboard loads instantly after the first computation.
"""

import json
import re
from datetime import datetime, timezone
from typing import Optional

from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import GEMINI_API_KEY, RECOMMENDATIONS_CACHE_TTL_SECONDS, require_env
from app.core.supabase_client import supabase


# Max characters of chunk content to include per article (to control token usage)
CHUNK_PREVIEW_MAX_CHARS = 800

# Default number of articles to consider and to recommend
CANDIDATE_ARTICLE_LIMIT = 30
TOP_N = 5


RECOMMENDATION_PROMPT_TEMPLATE = """You are a financial education advisor. Given a user's profile and a list of articles (with titles, summaries, categories, and content previews from the articles), choose the top {top_n} articles that are most relevant and helpful for this user. Consider:
- Their stated interests and priority (saving, credit, debt, etc.)
- Their situation (income range, rent status, debt status, emergency buffer, etc.)
- Article category and difficulty vs. their likely level
- How well the article content matches what they care about

User profile (JSON):
{profile_json}

Articles (each has id, title, summary, category, difficulty, and a content_preview from the article):
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


def get_articles_with_chunk_previews(limit: int = CANDIDATE_ARTICLE_LIMIT) -> list[dict]:
    """
    Fetch articles with metadata and a content preview from their first chunk.
    Returns list of dicts: id, title, summary, category, difficulty, content_preview.
    """
    articles_resp = (
        supabase.table("articles")
        .select("id, title, summary, category, difficulty")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    articles = articles_resp.data or []
    if not articles:
        return []

    # For each article, get first chunk's content (truncated)
    article_ids = [a["id"] for a in articles]
    chunks_resp = (
        supabase.table("article_chunks")
        .select("article_id, content, chunk_index")
        .in_("article_id", article_ids)
        .order("chunk_index")
        .execute()
    )
    chunks_by_article: dict[str, list[dict]] = {}
    for row in (chunks_resp.data or []):
        aid = row["article_id"]
        if aid not in chunks_by_article:
            chunks_by_article[aid] = []
        chunks_by_article[aid].append(row)

    # Build content_preview from first chunk(s) per article
    result = []
    for a in articles:
        aid = a["id"]
        chunks = chunks_by_article.get(aid, [])
        preview = ""
        if chunks:
            first_content = chunks[0].get("content") or ""
            preview = first_content[:CHUNK_PREVIEW_MAX_CHARS]
            if len(first_content) > CHUNK_PREVIEW_MAX_CHARS:
                preview += "..."
        result.append({
            "id": a["id"],
            "title": a.get("title") or "",
            "summary": (a.get("summary") or "")[:500],
            "category": a.get("category") or "",
            "difficulty": a.get("difficulty") or "beginner",
            "content_preview": preview,
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
    Use profile + articles (with chunk previews) to ask the LLM for the top N recommended article IDs.
    Returns list of article IDs in order (best first).
    """
    profile = get_profile(user_id)
    if not profile:
        return []

    articles_with_previews = get_articles_with_chunk_previews(limit=candidate_limit)
    if not articles_with_previews:
        return []

    if len(articles_with_previews) <= top_n:
        # Fewer articles than requested; return all in current order
        return [a["id"] for a in articles_with_previews[:top_n]]

    profile_json = json.dumps(profile, indent=2)
    articles_json = json.dumps(articles_with_previews, indent=2)

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
        # Ensure we only return IDs that exist in our candidate set
        valid_ids = {a["id"] for a in articles_with_previews}
        return [i for i in top_ids if i in valid_ids][:top_n]
    except Exception:
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

    # 2. Compute via LLM (slow path)
    top_ids = get_recommended_article_ids(user_id, top_n=top_n)
    if not top_ids:
        return []

    # 3. Save to cache for next time
    _set_cached_recommendation_ids(user_id, top_ids)

    # 4. Fetch and return full article rows in order
    return _articles_by_ids(top_ids)
