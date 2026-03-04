"""Maintain the learning_metadata JSONB blob on the profiles table.

Called after quiz submissions to increment counters, compute streaks,
and award badges.  All dates are UTC.
"""

from datetime import date, timedelta
from typing import Any

from app.core.supabase_client import supabase

BADGE_RULES: list[tuple[str, str, int]] = [
    ("first_article", "articles_read", 1),
    ("5_articles",    "articles_read", 5),
    ("10_articles",   "articles_read", 10),
    ("25_articles",   "articles_read", 25),
    ("first_quiz",    "quizzes_completed", 1),
    ("5_quizzes",     "quizzes_completed", 5),
    ("10_quizzes",    "quizzes_completed", 10),
    ("25_quizzes",    "quizzes_completed", 25),
    ("streak_3",      "current_streak", 3),
    ("streak_7",      "current_streak", 7),
    ("streak_14",     "current_streak", 14),
    ("streak_30",     "current_streak", 30),
]


def _empty_metadata() -> dict[str, Any]:
    return {
        "articles_read": 0,
        "quizzes_completed": 0,
        "current_streak": 0,
        "longest_streak": 0,
        "last_active_date": None,
        "badges": {},
    }


def _update_streak(meta: dict[str, Any], today: date) -> None:
    last_raw = meta.get("last_active_date")
    if last_raw:
        last = date.fromisoformat(last_raw)
        if last == today:
            return
        elif last == today - timedelta(days=1):
            meta["current_streak"] += 1
        else:
            meta["current_streak"] = 1
    else:
        meta["current_streak"] = 1

    meta["longest_streak"] = max(
        meta.get("longest_streak", 0), meta["current_streak"]
    )
    meta["last_active_date"] = today.isoformat()


def _award_badges(meta: dict[str, Any], today: date) -> None:
    badges: dict[str, str] = meta.setdefault("badges", {})
    today_str = today.isoformat()
    for badge_id, field, threshold in BADGE_RULES:
        if badge_id not in badges and meta.get(field, 0) >= threshold:
            badges[badge_id] = today_str


def checkin(user_id: str) -> dict[str, Any]:
    """Update streak for today's visit without touching counters.

    Returns the updated metadata dict.
    """
    row = (
        supabase.table("profiles")
        .select("learning_metadata")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    meta: dict[str, Any] = dict(row.data.get("learning_metadata") or _empty_metadata())

    for key in _empty_metadata():
        meta.setdefault(key, _empty_metadata()[key])

    today = date.today()

    _update_streak(meta, today)
    _award_badges(meta, today)

    supabase.table("profiles").update(
        {"learning_metadata": meta}
    ).eq("user_id", user_id).execute()

    return meta


def _load_meta(user_id: str) -> dict[str, Any]:
    row = (
        supabase.table("profiles")
        .select("learning_metadata")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    meta: dict[str, Any] = dict(row.data.get("learning_metadata") or _empty_metadata())
    for key in _empty_metadata():
        meta.setdefault(key, _empty_metadata()[key])
    meta.setdefault("read_article_ids", [])
    return meta


def _save_meta(user_id: str, meta: dict[str, Any]) -> None:
    supabase.table("profiles").update(
        {"learning_metadata": meta}
    ).eq("user_id", user_id).execute()


def record_article_read(user_id: str, article_id: str) -> dict[str, Any]:
    """Mark an article as read. Idempotent — duplicate calls are ignored.

    Increments articles_read, updates streak & badges.
    Returns the updated metadata dict.
    """
    meta = _load_meta(user_id)
    today = date.today()

    read_ids: list[str] = meta.get("read_article_ids", [])
    if article_id not in read_ids:
        read_ids.append(article_id)
        meta["read_article_ids"] = read_ids
        meta["articles_read"] = len(read_ids)

    _update_streak(meta, today)
    _award_badges(meta, today)
    _save_meta(user_id, meta)
    return meta


def record_quiz_completion(user_id: str, article_id: str) -> dict[str, Any]:
    """Record a quiz completion. Also marks the article as read if not already.

    Returns the updated metadata dict.
    """
    meta = _load_meta(user_id)
    today = date.today()

    read_ids: list[str] = meta.get("read_article_ids", [])
    if article_id not in read_ids:
        read_ids.append(article_id)
        meta["read_article_ids"] = read_ids
        meta["articles_read"] = len(read_ids)

    meta["quizzes_completed"] = meta.get("quizzes_completed", 0) + 1
    _update_streak(meta, today)
    _award_badges(meta, today)
    _save_meta(user_id, meta)
    return meta
