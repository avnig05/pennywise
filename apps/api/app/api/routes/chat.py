"""
RAG chatbot: ask a question, get an answer grounded in article chunks.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.rag import answer_with_rag

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str


class Source(BaseModel):
    title: str
    source_url: str
    snippet: str


class ChatResponse(BaseModel):
    reply: str
    sources: list[Source]


@router.post("/ask", response_model=ChatResponse)
def ask(request: ChatRequest):
    """
    Ask a question. Returns an answer based on retrieved article chunks and optional sources.
    """
    message = (request.message or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    try:
        reply, sources = answer_with_rag(message)
        return ChatResponse(
            reply=reply,
            sources=[Source(title=s["title"], source_url=s["source_url"], snippet=s["snippet"]) for s in sources],
        )
    except RuntimeError as e:
        # Ollama not running / model not found
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG failed: {e}")
