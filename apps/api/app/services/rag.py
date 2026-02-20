"""
RAG (Retrieval-Augmented Generation) for the financial-education chatbot.
Embeds the user query, finds relevant article chunks by similarity, then generates
an answer using those chunks as context.
"""

import json
import math
import re
import time
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
from app.services.embedder import get_embedding


# How many chunks to retrieve and pass to the LLM
TOP_K_CHUNKS = 8
# Max content length per chunk to keep prompt size reasonable
CHUNK_SNIPPET_CHARS = 800


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def retrieve_chunks(query: str, top_k: int = TOP_K_CHUNKS) -> list[dict]:
    """
    Embed the query and return the top-k most similar chunks, with article info.
    Each item: { "content", "article_id", "title", "source_url", "chunk_index" }.
    Uses in-memory similarity (no DB vector index required). For large corpora,
    add a Supabase pgvector RPC and call it here instead.
    """
    query_embedding = get_embedding(query)
    # Fetch chunks that have embeddings (and join article for title/url)
    chunks_resp = (
        supabase.table("article_chunks")
        .select("id, article_id, chunk_index, content, embedding")
        .not_.is_("embedding", "null")
        .execute()
    )
    rows = chunks_resp.data or []
    if not rows:
        return []

    # Score each chunk by cosine similarity to query
    scored = []
    for r in rows:
        emb = r.get("embedding")
        if emb is None:
            continue
        # Supabase may return embedding as list or as JSON string (e.g. real[] / pgvector)
        if isinstance(emb, str):
            try:
                emb = json.loads(emb)
            except (json.JSONDecodeError, TypeError):
                continue
        if not isinstance(emb, list) or len(emb) == 0:
            continue
        sim = _cosine_similarity(query_embedding, emb)
        scored.append((sim, r))

    scored.sort(key=lambda x: -x[0])
    top = [r for _, r in scored[:top_k]]

    # Enrich with article title and source_url
    article_ids = list({r["article_id"] for r in top})
    articles_resp = (
        supabase.table("articles")
        .select("id, title, source_url")
        .in_("id", article_ids)
        .execute()
    )
    articles = {a["id"]: a for a in (articles_resp.data or [])}

    return [
        {
            "content": (r.get("content") or "")[:CHUNK_SNIPPET_CHARS],
            "article_id": r["article_id"],
            "title": articles.get(r["article_id"], {}).get("title") or "Unknown",
            "source_url": articles.get(r["article_id"], {}).get("source_url") or "",
            "chunk_index": r.get("chunk_index", 0),
        }
        for r in top
    ]


RAG_PROMPT_TEMPLATE = """You are a friendly financial education assistant for Pennywise. Answer the user's question using ONLY the following excerpts from our article library.

FORMAT:
- For how-to or process questions (e.g. "How do I build an emergency fund?", "What are the steps to improve my credit?"): Use numbered steps. Format as: 1. First... 2. Then... 3. Finally... Include a brief source citation at the end (e.g. "According to the CFPB..." or "As [Source Title] explains...").
- For simple factual questions: Use ONE short paragraph (2–4 sentences). Be direct and accurate. Briefly cite the source(s) you used.

Be accurate. Do not make up facts or use outside knowledge. If the excerpts don't have enough info, say so in one sentence and suggest they explore the topic in the app.

Article excerpts (source title and snippet):
{context}

User question: {question}

Answer:"""


def _parse_steps_from_response(text: str) -> Optional[list[str]]:
    """
    Parse numbered steps from LLM response.
    Handles patterns like "1. First...", "2. Then...", or "Step 1:", "Step 2:".
    Returns list of step strings, or None if no clear steps found.
    """
    if not text or not text.strip():
        return None
    text = text.strip()

    # Try "1. ", "2. " pattern (numbered list)
    step_pattern = re.compile(r"(\d+)\.\s+(.+?)(?=\s*\d+\.\s+|\s*$)", re.DOTALL)
    matches = step_pattern.findall(text)
    if matches:
        steps = [m[1].strip() for m in matches if m[1].strip()]
        if len(steps) >= 2:
            return steps

    # Try "Step 1:", "Step 2:" pattern
    step_label_pattern = re.compile(
        r"Step\s+(\d+)\s*[:\-]\s*(.+?)(?=Step\s+\d+\s*[:\-]|\s*$)", re.DOTALL | re.IGNORECASE
    )
    matches = step_label_pattern.findall(text)
    if matches:
        steps = [m[1].strip() for m in matches if m[1].strip()]
        if len(steps) >= 2:
            return steps

    return None


def _create_llm(model: str = "gemini-2.5-flash") -> ChatGoogleGenerativeAI:
    api_key = require_env("GEMINI_API_KEY", GEMINI_API_KEY)
    return ChatGoogleGenerativeAI(
        model=model,
        google_api_key=api_key,
        temperature=0.2,
    )


def _is_429(e: Exception) -> bool:
    msg = str(e)
    return "429" in msg or "RESOURCE_EXHAUSTED" in msg


def _invoke_llm_with_retry_and_fallback(prompt: str):
    """
    Use gemini-2.5-flash with one retry on 429. Returns LLM response, or None if quota exhausted.
    """
    llm = _create_llm("gemini-2.5-flash")
    for attempt in range(2):
        try:
            return llm.invoke(prompt)
        except Exception as e:
            if not _is_429(e):
                raise
            if attempt == 0:
                m = re.search(r"retry in ([\d.]+)\s*s", str(e), re.I)
                wait = int(float(m.group(1)) + 0.5) if m else 60
                wait = min(120, max(1, wait))
                time.sleep(wait)
                continue
            return None
    return None


def _invoke_ollama(prompt: str, timeout: float = 60.0) -> Optional[str]:
    """
    Call Ollama /api/generate with the given prompt. Returns generated text or None on error.
    """
    url = f"{OLLAMA_BASE_URL}/api/generate"
    payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
    try:
        with httpx.Client(timeout=timeout) as client:
            r = client.post(url, json=payload)
            r.raise_for_status()
            data = r.json()
            return (data.get("response") or "").strip() or None
    except (httpx.ConnectError, httpx.TimeoutException) as e:
        # Ollama not running or unreachable
        raise RuntimeError(
            "Ollama is not running or unreachable. Start it with: ollama serve (and run e.g. ollama run llama3.2)"
        ) from e
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise RuntimeError(
                f"Ollama model '{OLLAMA_MODEL}' not found. Pull it with: ollama pull {OLLAMA_MODEL}"
            ) from e
        raise


def answer_with_rag(
    question: str,
    top_k: int = TOP_K_CHUNKS,
) -> tuple[str, list[dict], Optional[list[str]]]:
    """
    Retrieve relevant chunks, then generate an answer using the RAG prompt.
    Returns (answer_text, sources, steps) where sources is a list of
    { "title", "source_url", "snippet" } for citations, and steps is an optional
    list of parsed step strings when the answer uses numbered format.
    """
    chunks = retrieve_chunks(question, top_k=top_k)
    if not chunks:
        return (
            "I don't have any article content to reference yet. Try again after more articles are added.",
            [],
            None,
        )

    context_parts = []
    for c in chunks:
        title = c.get("title") or "Unknown"
        content = (c.get("content") or "").strip()
        if not content:
            continue
        context_parts.append(f"[{title}]\n{content}")

    context = "\n\n---\n\n".join(context_parts)
    prompt = RAG_PROMPT_TEMPLATE.format(context=context, question=question.strip())

    if RAG_LLM_BACKEND == "ollama":
        try:
            answer = _invoke_ollama(prompt)
        except RuntimeError:
            raise  # Re-raise Ollama setup errors so the API can return 503 + message
        if not answer:
            return (
                "Ollama returned an empty response. Try a different model (OLLAMA_MODEL) or check the Ollama logs.",
                [],
                None,
            )
    else:
        response = _invoke_llm_with_retry_and_fallback(prompt)
        if response is None:
            return (
                "We're out of AI capacity for the moment (daily free-tier limit). Try again tomorrow, or enable billing in Google AI Studio for more requests.",
                [],
                None,
            )
        answer = response.content if hasattr(response, "content") else str(response)
        answer = (answer or "").strip()

    # Build sources list (unique by title+url)
    added = set()
    sources = []
    for c in chunks:
        title = c.get("title") or "Unknown"
        url = c.get("source_url") or ""
        key = (title, url)
        if key in added:
            continue
        added.add(key)
        sources.append({
            "title": title,
            "source_url": url,
            "snippet": (c.get("content") or "")[:200] + ("..." if len(c.get("content") or "") > 200 else ""),
        })

    steps = _parse_steps_from_response(answer)
    return answer, sources, steps
