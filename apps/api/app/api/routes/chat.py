"""
RAG chatbot: ask a question, get an answer. Chats are persisted per user.
"""

from typing import Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from pydantic import BaseModel

from app.core.auth import get_current_user_id
from app.core.supabase_client import supabase
from app.services.rag import answer_with_rag
from app.services.summarizer import summarize_chat

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    chat_id: Optional[str] = None


class Source(BaseModel):
    title: str
    source_url: str
    snippet: str


class ChatResponse(BaseModel):
    reply: str
    sources: list[Source]
    chat_id: Optional[str] = None
    steps: Optional[list[str]] = None


class ChatListItem(BaseModel):
    id: str
    title: Optional[str]
    updated_at: str
    message_count: int


class Message(BaseModel):
    id: str
    role: str
    content: str
    sources: Optional[list[Source]] = None
    created_at: str


class ChatDetail(BaseModel):
    id: str
    title: Optional[str]
    created_at: str
    updated_at: str
    messages: list[Message]


def _update_chat_title_background(chat_id: str) -> None:
    """Background task: set chat title once after first exchange; never update again."""
    try:
        mr = (
            supabase.table("chat_messages")
            .select("role, content")
            .eq("chat_id", chat_id)
            .order("created_at", desc=False)
            .execute()
        )
        messages = [{"role": m["role"], "content": m.get("content") or ""} for m in (mr.data or [])]
        # Only set title after the first exchange (2 messages); leave it constant after that
        if len(messages) != 2:
            return
        summary = summarize_chat(messages)
        supabase.table("chats").update({"title": summary}).eq("id", chat_id).execute()
    except Exception:
        pass  # Keep current title on failure


@router.post("/ask", response_model=ChatResponse)
def ask(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
):
    message = (request.message or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    chat_id = request.chat_id
    if chat_id:
        r = supabase.table("chats").select("id").eq("id", chat_id).eq("user_id", user_id).execute()
        if not r.data:
            raise HTTPException(status_code=404, detail="Chat not found")
    else:
        title = message[:50] + "..." if len(message) > 50 else message
        r = supabase.table("chats").insert({"user_id": user_id, "title": title}).execute()
        if not r.data:
            raise HTTPException(status_code=500, detail="Failed to create chat")
        chat_id = r.data[0]["id"]

    supabase.table("chat_messages").insert({
        "chat_id": chat_id,
        "role": "user",
        "content": message,
    }).execute()

    try:
        reply, sources, steps = answer_with_rag(message)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG failed: {e}")

    sources_json = [{"title": s["title"], "source_url": s["source_url"], "snippet": s["snippet"]} for s in sources]
    supabase.table("chat_messages").insert({
        "chat_id": chat_id,
        "role": "assistant",
        "content": reply,
        "sources": sources_json if sources_json else None,
    }).execute()

    background_tasks.add_task(_update_chat_title_background, chat_id)

    return ChatResponse(
        reply=reply,
        sources=[Source(title=s["title"], source_url=s["source_url"], snippet=s["snippet"]) for s in sources],
        chat_id=chat_id,
        steps=steps,
    )


@router.get("", response_model=list[ChatListItem])
def list_chats(user_id: str = Depends(get_current_user_id)):
    r = (
        supabase.table("chats")
        .select("id, title, updated_at")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    chats = r.data or []
    result = []
    for c in chats:
        mr = supabase.table("chat_messages").select("id").eq("chat_id", c["id"]).execute()
        count = len(mr.data or [])
        result.append(ChatListItem(id=c["id"], title=c.get("title"), updated_at=c["updated_at"], message_count=count))
    return result


@router.get("/{chat_id}", response_model=ChatDetail)
def get_chat(chat_id: str, user_id: str = Depends(get_current_user_id)):
    r = supabase.table("chats").select("id, title, created_at, updated_at").eq("id", chat_id).eq("user_id", user_id).execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Chat not found")
    chat = r.data[0]
    mr = (
        supabase.table("chat_messages")
        .select("id, role, content, sources, created_at")
        .eq("chat_id", chat_id)
        .order("created_at", desc=False)
        .execute()
    )
    messages = []
    for m in (mr.data or []):
        src = [Source(**s) for s in m["sources"]] if m.get("sources") else None
        messages.append(Message(id=m["id"], role=m["role"], content=m["content"], sources=src, created_at=m["created_at"]))
    return ChatDetail(
        id=chat["id"],
        title=chat.get("title"),
        created_at=chat["created_at"],
        updated_at=chat["updated_at"],
        messages=messages,
    )


@router.delete("/{chat_id}")
def delete_chat(chat_id: str, user_id: str = Depends(get_current_user_id)):
    r = supabase.table("chats").select("id").eq("id", chat_id).eq("user_id", user_id).execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Chat not found")
    supabase.table("chats").delete().eq("id", chat_id).execute()
    return {"success": True}
