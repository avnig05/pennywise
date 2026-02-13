"""
Text embedder using either Google Gemini or a local Ollama server.
Converts text chunks into vector embeddings for RAG.
"""

from __future__ import annotations

import httpx

from app.core.config import (
    AI_PROVIDER,
    EMBEDDING_DIMENSIONS,
    GEMINI_API_KEY,
    OLLAMA_BASE_URL,
    OLLAMA_EMBED_MODEL,
    require_env,
)


# Gemini embedding model
# Note: The new google-genai SDK uses "gemini-embedding-001" instead of "text-embedding-004"
EMBEDDING_MODEL = "gemini-embedding-001"

_gemini_client = None


def _effective_provider() -> str:
    """
    Choose provider:
    - if AI_PROVIDER set, use it
    - else: gemini if key present, otherwise ollama
    """
    if AI_PROVIDER:
        return AI_PROVIDER
    return "gemini" if GEMINI_API_KEY else "ollama"


def _get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        from google import genai

        _gemini_client = genai.Client(api_key=require_env("GEMINI_API_KEY", GEMINI_API_KEY))
    return _gemini_client


def _validate_dimensions(embedding: list[float]) -> list[float]:
    if EMBEDDING_DIMENSIONS and len(embedding) != EMBEDDING_DIMENSIONS:
        raise RuntimeError(
            f"Embedding has {len(embedding)} dims but expected {EMBEDDING_DIMENSIONS}. "
            f"Set OLLAMA_EMBED_MODEL to a {EMBEDDING_DIMENSIONS}-dim model (e.g. nomic-embed-text), "
            f"or update the DB schema / EMBEDDING_DIMENSIONS."
        )
    return embedding


def _ollama_embed(text: str) -> list[float]:
    """
    Get an embedding from Ollama.
    Prefers /api/embed (newer) and falls back to /api/embeddings (older).
    """
    with httpx.Client(timeout=60.0) as client:
        # Newer endpoint
        try:
            r = client.post(
                f"{OLLAMA_BASE_URL}/api/embed",
                json={"model": OLLAMA_EMBED_MODEL, "input": text},
            )
            if r.status_code == 200:
                data = r.json()
                emb = (data.get("embeddings") or [None])[0]
                if isinstance(emb, list):
                    return [float(x) for x in emb]
        except Exception:
            pass

        # Older endpoint
        r = client.post(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            json={"model": OLLAMA_EMBED_MODEL, "prompt": text},
        )
        r.raise_for_status()
        data = r.json()
        emb = data.get("embedding")
        if not isinstance(emb, list):
            raise RuntimeError("Ollama embeddings response missing 'embedding' list")
        return [float(x) for x in emb]


def get_embedding(text: str) -> list[float]:
    provider = _effective_provider()
    if provider == "ollama":
        return _validate_dimensions(_ollama_embed(text))
    if provider == "gemini":
        client = _get_gemini_client()
        result = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
            config={"output_dimensionality": EMBEDDING_DIMENSIONS},
        )
        return _validate_dimensions(result.embeddings[0].values)
    raise RuntimeError(f"Unsupported AI_PROVIDER: {provider} (expected 'ollama' or 'gemini')")


def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    embeddings = []
    for text in texts:
        embedding = get_embedding(text)
        embeddings.append(embedding)
    return embeddings


def embed_chunks(chunks: list[str]) -> list[dict]:
    results = []
    for i, chunk in enumerate(chunks):
        embedding = get_embedding(chunk)
        results.append({
            "chunk_index": i,
            "content": chunk,
            "embedding": embedding
        })
    return results
