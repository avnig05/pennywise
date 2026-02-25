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

STRUCTURED_PROMPT_TEMPLATE = """You are Pennywise, a friendly financial education assistant for young adults. Transform this article into structured sections with a short commentary after each section.

Rules:
- Split the article into 4-7 logical sections. Each section has a heading and body text.
- For each section, write a SHORT commentary (1-2 sentences) in Pennywise's voice: warm, encouraging, slightly playful, with occasional emojis. The commentary should add a tip, insight, or "did you know?" relevant to that section.
- Use the article summary and original content to create the structure. Preserve the key information.
- Section headings should be clear and descriptive (e.g. "Introduction: Why This Matters", "What Are Federal Student Loans?").
- Commentaries should feel like a friend explaining things, not formal or preachy.

Article Title: {title}
Article Summary: {summary}

Article Content (excerpt): {content_preview}

Respond with ONLY a JSON object in this exact format:
{{
  "intro_commentary": "Hey there! 👋 I'm Pennywise, and I'll be guiding you through this article. [One sentence intro to the topic]",
  "sections": [
    {{
      "heading": "Section heading here",
      "content": "Paragraph(s) of main content for this section. Can be multiple sentences.",
      "commentary": "Short Pennywise tip or insight for this section. Friendly tone, 1-2 sentences, optional emoji."
    }}
  ]
}}

No other text. Valid JSON only."""


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


def _parse_structured_response(text: str) -> Optional[dict]:
    """Parse structured article from LLM JSON response."""
    if not text:
        return None
    text = text.strip()
    if "```" in text:
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```\s*$", "", text, flags=re.MULTILINE)
        text = text.strip()
    try:
        data = json.loads(text)
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


def get_structured_article(article_id: str) -> Optional[dict]:
    """
    Return cached structured content if present; otherwise generate via LLM,
    save to the articles table, and return. Keeps recommended article and
    Pennywise comments static after first generation.
    """
    resp = (
        supabase.table("articles")
        .select("id, title, summary, original_content, structured_content")
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
    if _is_valid_cached(cached):
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

    title = (article.get("title") or "").strip()
    summary = (article.get("summary") or "").strip()
    content = article.get("original_content") or ""
    content_preview = (content or "")[:4000]

    if not title:
        return None

    prompt = STRUCTURED_PROMPT_TEMPLATE.format(
        title=title[:200],
        summary=summary[:1500] if summary else "No summary available",
        content_preview=content_preview,
    )
    try:
        if RAG_LLM_BACKEND == "ollama":
            response_text = _invoke_ollama(prompt)
        else:
            response_text = _invoke_gemini(prompt)
        structured = _parse_structured_response(response_text or "")
        if not structured:
            return None
        supabase.table("articles").update(
            {"structured_content": structured}
        ).eq("id", article_id).execute()
        return structured
    except Exception:
        return None
