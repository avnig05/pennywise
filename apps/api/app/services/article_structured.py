"""
Generate structured article content with Pennywise-style commentary for each section.
Uses Ollama (default) or Gemini to split content into sections and add friendly commentary.
"""

import json
import re
from typing import Optional

import httpx
from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import (
    GEMINI_API_KEY,
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    RAG_LLM_BACKEND,
    require_env,
)
from app.core.supabase_client import supabase

STRUCTURED_PROMPT_TEMPLATE = """Output ONLY a valid JSON object. No explanation, no markdown, no text before or after the JSON.

Use this exact structure. Replace the placeholder values with content from the article below.

{{
  "intro_commentary": "[One short intro about the topic — see variety rules below]",
  "sections": [
    {{
      "heading": "Clear section title (e.g. Introduction: Why This Matters)",
      "content": "2-4 paragraphs explaining this part of the article. Define terms, include examples or numbers from the article.",
      "commentary": "[One short Pennywise comment — vary the style; see rules below]"
    }}
  ]
}}

Requirements:
- Create 4-7 sections. Each section needs a distinct "heading", "content", and "commentary".
- Headings must be descriptive (e.g. "Simple vs Compound Interest", "Understanding APR and APY").
- Content = the main explanation (multiple sentences per section). Commentary = one short Pennywise line (1-2 sentences).

VARIETY FOR INTRO_COMMENTARY (pick ONE style per article; do not repeat the same opener every time):
- Greeting + hook: "Hey there! This one's worth a quick read." / "Hi! Here's the lowdown on [topic]." / "Glad you're here — this topic comes up a lot."
- Direct: "Quick heads-up: [one sentence about why this matters]." / "Let's break this down so it actually sticks."
- Warm: "Welcome. This article covers [topic] in plain language." / "You're in the right place. Here's what you need to know."
- Casual: "So, [topic]. Here's the short version." / "Ever wondered about [topic]? Here we go."
Use 0-1 emoji in the intro. Do not always say "I'm Pennywise" — sometimes just start with the hook.

VARIETY FOR EACH SECTION'S COMMENTARY (use a MIX of these across sections; do not make every commentary the same type):
- Practical tip: "Pro tip: start with a small amount and bump it up each month."
- Real-world analogy: "Think of it like [simple comparison]."
- Question: "Why does this matter? Because [one line]."
- Caution: "Watch out for [common mistake] — it's easy to miss."
- Encouragement: "This part's simpler than it looks once you see the pattern."
- Key takeaway: "The big idea: [one sentence in plain language]."
- Relatable: "Lots of people skip this step; don't be one of them."
- Why it matters: "Getting this right can save you [time/money/hassle] down the road."
Vary tone and length (some punchy, some a bit longer). Use emoji sparingly (0-1 per commentary, or none). Never repeat the same commentary formula for two sections in a row.

Article title: {title}

Summary:
{summary}

Full text (excerpt):
{content_preview}

Output ONLY the JSON object, nothing else."""


def _invoke_ollama(prompt: str, timeout: float = 90.0) -> Optional[str]:
    """Call Ollama /api/generate. Returns generated text or None on error."""
    url = f"{OLLAMA_BASE_URL}/api/generate"
    payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
    try:
        with httpx.Client(timeout=timeout) as client:
            r = client.post(url, json=payload)
            r.raise_for_status()
            data = r.json()
            return (data.get("response") or "").strip() or None
    except (httpx.ConnectError, httpx.TimeoutException) as e:
        raise RuntimeError(
            "Ollama is not running or unreachable. Start it with: ollama serve"
        ) from e
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise RuntimeError(
                f"Ollama model '{OLLAMA_MODEL}' not found. Pull it with: ollama pull {OLLAMA_MODEL}"
            ) from e
        raise


def _invoke_gemini(prompt: str) -> Optional[str]:
    """Invoke Gemini for structured article generation."""
    api_key = require_env("GEMINI_API_KEY", GEMINI_API_KEY)
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.4,
    )
    response = llm.invoke(prompt)
    text = response.content if hasattr(response, "content") else str(response)
    return (text or "").strip() or None


def _extract_json_object(text: str) -> Optional[str]:
    """Extract the first complete JSON object from text (handles leading/trailing prose)."""
    if not text:
        return None
    text = text.strip()
    # Remove markdown code fence if present
    if "```" in text:
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```\s*$", "", text, flags=re.MULTILINE)
        text = text.strip()
    start = text.find("{")
    if start < 0:
        return None
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    return None


def _parse_structured_response(text: str) -> Optional[dict]:
    """Parse structured article from LLM JSON response."""
    if not text:
        return None
    json_str = _extract_json_object(text)
    if not json_str:
        return None
    try:
        data = json.loads(json_str)
        if not isinstance(data, dict):
            return None
        sections = data.get("sections")
        if not isinstance(sections, list) or len(sections) < 1:
            return None
        intro = data.get("intro_commentary") or ""
        return {
            "intro_commentary": str(intro),
            "sections": [
                {
                    "heading": str(s.get("heading") or f"Section {i + 1}"),
                    "content": str(s.get("content") or ""),
                    "commentary": str(s.get("commentary") or ""),
                }
                for i, s in enumerate(sections)
                if isinstance(s, dict)
            ],
        }
    except json.JSONDecodeError:
        return None


def _is_valid_cached(structured: Optional[dict]) -> bool:
    """Return True if cached structured content has the expected shape."""
    if not structured or not isinstance(structured, dict):
        return False
    sections = structured.get("sections")
    return isinstance(sections, list) and len(sections) >= 1


def generate_structured_content(
    title: str,
    summary: str,
    content_preview: str,
) -> Optional[dict]:
    """
    Generate structured article (intro_commentary + sections) via LLM.
    Does not read or write the database. Used by the backfill script.
    """
    title = (title or "").strip()
    if not title:
        return None
    summary = (summary or "")[:2000] if summary else "No summary available"
    content_preview = (content_preview or "")[:5000]

    prompt = STRUCTURED_PROMPT_TEMPLATE.format(
        title=title[:200],
        summary=summary,
        content_preview=content_preview,
    )
    try:
        if RAG_LLM_BACKEND == "ollama":
            response_text = _invoke_ollama(prompt)
        else:
            response_text = _invoke_gemini(prompt)
        return _parse_structured_response(response_text or "")
    except Exception:
        return None


def get_structured_article(article_id: str) -> Optional[dict]:
    """
    Return structured content from the database only. No LLM call.
    Run the backfill script to pre-generate and save structured content.
    """
    resp = (
        supabase.table("articles")
        .select("id, structured_content")
        .eq("id", article_id)
        .execute()
    )
    if not resp.data:
        return None
    article = resp.data[0]
    cached = article.get("structured_content")
    if isinstance(cached, str):
        try:
            cached = json.loads(cached)
        except (json.JSONDecodeError, TypeError):
            cached = None
    if isinstance(cached, dict):
        cached = dict(cached)
    if not _is_valid_cached(cached):
        return None
    return {
        "intro_commentary": str(cached.get("intro_commentary") or ""),
        "sections": [
            {
                "heading": str(s.get("heading") or f"Section {i + 1}"),
                "content": str(s.get("content") or ""),
                "commentary": str(s.get("commentary") or ""),
            }
            for i, s in enumerate(cached.get("sections") or [])
            if isinstance(s, dict)
        ],
    }
