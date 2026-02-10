"""
Text embedder using Google Gemini.
Converts text chunks into vector embeddings for RAG.
"""

from google import genai
from app.core.config import GEMINI_API_KEY, require_env


# Configure Gemini client
client = genai.Client(api_key=require_env("GEMINI_API_KEY", GEMINI_API_KEY))

# Gemini embedding model
# Note: The new google-genai SDK uses "gemini-embedding-001" instead of "text-embedding-004"
EMBEDDING_MODEL = "gemini-embedding-001"
# Output 768 dimensions to match database schema (default is 3072)
EMBEDDING_DIMENSIONS = 768


def get_embedding(text: str) -> list[float]:
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config={"output_dimensionality": EMBEDDING_DIMENSIONS}
    )
    return result.embeddings[0].values


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
