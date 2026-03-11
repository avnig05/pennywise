"""
Extract keywords from each article using an LLM (Gemini).
Keywords are stored in the articles.keywords column for fast recommendation prompts.
"""

import json
import re
import time
from typing import Optional

from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import GEMINI_API_KEY, require_env
from app.core.supabase_client import supabase


KEYWORDS_PROMPT = """You are extracting topic keywords for a financial education article. Given the title and summary below, list 5–10 short keywords (1–2 words each, lowercase, no duplicates). Focus on main topics: concepts, products, situations (e.g. budgeting, emergency fund, credit score, student loans, saving, investing, taxes, paying off debt, side income...etc). Reply with ONLY a JSON array of strings. No other text.

Title: {title}

Summary: {summary}

Example format: ["budgeting", "savings", "emergency fund", "credit score"]"""


def _create_llm() -> ChatGoogleGenerativeAI:
    api_key = require_env("GEMINI_API_KEY", GEMINI_API_KEY)
    # Use 2.5-flash; if you hit quota, try "gemini-1.5-flash" (different quota bucket)
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite",
        google_api_key=api_key,
        temperature=0.1,
    )


def _parse_keywords_from_response(text: str, max_keywords: int) -> list[str]:
    """Parse a JSON array of keywords from LLM response. Tolerates extra text and markdown."""
    if not text:
        return []
    text = text.strip()
    # Remove markdown code block if present
    if "```" in text:
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```\s*$", "", text)
        text = text.strip()
    # Try direct parse first
    try:
        arr = json.loads(text)
        if isinstance(arr, list):
            keywords = [str(x).strip().lower() for x in arr if x][:max_keywords]
            return list(dict.fromkeys(keywords))
    except json.JSONDecodeError:
        pass
    # Try to find a JSON array somewhere in the response (LLM often adds extra text)
    match = re.search(r"\[[\s\S]*?\]", text)
    if match:
        try:
            arr = json.loads(match.group(0))
            if isinstance(arr, list):
                keywords = [str(x).strip().lower() for x in arr if x][:max_keywords]
                return list(dict.fromkeys(keywords))
        except json.JSONDecodeError:
            pass
    return []


def extract_keywords_llm(
    title: str,
    summary: str,
    max_keywords: int = 10,
    debug: bool = False,
) -> list[str]:
    """
    Use the LLM to extract topic keywords from an article's title and summary.
    Returns a list of short keyword strings (e.g. ["budgeting", "savings", "credit score"]).
    """
    title = (title or "").strip()
    summary = (summary or "").strip()
    if not title and not summary:
        return []

    prompt = KEYWORDS_PROMPT.format(
        title=title[:300],
        summary=summary[:800],
    )
    llm = _create_llm()
    last_error = None
    for attempt in range(2):
        try:
            response = llm.invoke(prompt)
            # LangChain can return AIMessage; content might be str or list of content blocks
            raw = response.content if hasattr(response, "content") else str(response)
            if isinstance(raw, list):
                text = " ".join(
                    (c.get("text", "") if isinstance(c, dict) else str(c) for c in raw)
                )
            else:
                text = str(raw).strip()
            keywords = _parse_keywords_from_response(text, max_keywords)
            if debug and not keywords:
                print(f"[debug] LLM raw response ({len(text)} chars): {text[:500]}...")
            return keywords
        except Exception as e:
            last_error = e
            err_str = str(e)
            # On quota (429), wait and retry once
            if ("429" in err_str or "RESOURCE_EXHAUSTED" in err_str) and attempt == 0:
                if debug:
                    print(f"[debug] Rate limited, waiting 35s then retry...")
                time.sleep(35)
                continue
            if debug:
                print(f"[debug] LLM error: {e}")
            return []
    if debug and last_error:
        print(f"[debug] LLM error: {last_error}")
    return []


def extract_keywords_for_article(article_id: str) -> Optional[list[str]]:
    """
    Fetch one article from the table by id, extract keywords with the LLM,
    update the article's keywords column, and return the list of keywords.
    Returns None if the article is not found or update fails.
    """
    resp = (
        supabase.table("articles")
        .select("id, title, summary")
        .eq("id", article_id)
        .execute()
    )
    rows = resp.data or []
    if not rows:
        return None
    row = rows[0]
    title = row.get("title") or ""
    summary = row.get("summary") or ""
    keywords = extract_keywords_llm(title, summary)
    try:
        supabase.table("articles").update({"keywords": keywords}).eq("id", article_id).execute()
        return keywords
    except Exception:
        return None


def extract_keywords_for_all_articles(
    limit: Optional[int] = None,
    debug: bool = False,
) -> dict:
    """
    For each article in the articles table: extract keywords with the LLM and update the row.
    Skips update when the LLM returns no keywords (so we don't overwrite with []).
    Returns a small summary: {"processed": int, "failed": int, "skipped": int, "errors": list}.
    """
    query = (
        supabase.table("articles")
        .select("id, title, summary")
        .order("created_at", desc=True)
    )
    if limit is not None:
        query = query.limit(limit)
    rows = query.execute().data or []
    processed = 0
    failed = 0
    skipped = 0
    errors = []
    for i, row in enumerate(rows):
        aid = row["id"]
        title = row.get("title") or ""
        summary = row.get("summary") or ""
        try:
            keywords = extract_keywords_llm(title, summary, debug=debug)
            if not keywords:
                skipped += 1
                if debug:
                    errors.append({"id": aid, "error": "LLM returned no keywords", "title": title[:50]})
                continue
            supabase.table("articles").update({"keywords": keywords}).eq("id", aid).execute()
            processed += 1
        except Exception as e:
            failed += 1
            errors.append({"id": aid, "error": str(e)})
    return {"processed": processed, "failed": failed, "skipped": skipped, "errors": errors}
