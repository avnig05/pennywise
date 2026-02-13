from typing import Optional, Literal, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.core.auth import get_current_user_id
from app.core.supabase_client import supabase
from app.services.recommendations import get_recommended_articles, invalidate_recommendations_cache
from app.services.tip_generator import get_or_generate_tip

router = APIRouter()

# matches your SQL checks
class ProfileUpdate(BaseModel):
    age_range: Optional[
        Literal[
            "lt_18",
            "18_24",
            "25_34",
            "35_44",
            "45_54",
            "55_64",
            "65_plus",
            "unknown",
        ]
    ] = None
    job_type: Optional[Literal["w2", "1099", "unknown"]] = None
    state: Optional[str] = None  # expects "CA" etc. (we won't over-validate yet)
    pay_frequency: Optional[Literal["weekly", "biweekly", "semi-monthly", "monthly", "unknown"]] = None
    net_income_range: Optional[Literal["lt_1500", "1500_2500", "2500_4000", "gt_4000", "unknown"]] = None
    rent_status: Optional[Literal["rent", "parents", "dorm", "other", "unknown"]] = None
    debt_status: Optional[Literal["none", "student_loans", "credit_card", "both"]] = None
    credit_card_status: Optional[Literal["no_card", "have_not_used", "use_sometimes", "use_often"]] = None
    emergency_buffer_range: Optional[Literal["zero", "lt_500", "500_2000", "gt_2000"]] = None
    priority: Optional[Literal["save", "credit", "debt", "unsure"]] = None
    interests: Optional[List[str]] = None
    saved_articles: Optional[List[str]] = None


class ToggleSavedBody(BaseModel):
    article_id: str


@router.get("")
async def get_me(user_id: str = Depends(get_current_user_id)):
    resp = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
    rows = resp.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Profile not found. Complete onboarding.")
    return rows[0]

@router.put("")
async def put_me(update: ProfileUpdate, user_id: str = Depends(get_current_user_id)):
    payload = update.model_dump(exclude_none=True)
    payload["user_id"] = user_id

    try:
        resp = supabase.table("profiles").upsert(payload, on_conflict="user_id").execute()
        rows = resp.data or []
        invalidate_recommendations_cache(user_id)
        return rows[0] if rows else payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {e}")


@router.get("/feed")
async def get_my_feed(top_n: int = 5, user_id: str = Depends(get_current_user_id)):
    """Get a personalized feed of recommended articles for the current user."""
    articles = get_recommended_articles(user_id, top_n=min(max(1, top_n), 20))
    return {"articles": articles}


@router.get("/tip")
async def get_my_tip(user_id: str = Depends(get_current_user_id)):
    """
    Get the personalized tip of the day for the current user.
    Returns the existing tip if it's less than 24 hours old, otherwise generates a new one.
    """
    tip = get_or_generate_tip(user_id)
    if not tip:
        raise HTTPException(status_code=404, detail="Unable to generate tip. Complete your profile.")
    return tip
@router.post("/saved/toggle")
async def toggle_saved_article(
    body: ToggleSavedBody, user_id: str = Depends(get_current_user_id)
):
    """Add or remove an article from the user's saved list. Returns the updated list."""
    resp = supabase.table("profiles").select("saved_articles").eq("user_id", user_id).execute()
    rows = resp.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Profile not found. Complete onboarding.")
    current = list(rows[0].get("saved_articles") or [])
    if body.article_id in current:
        current = [a for a in current if a != body.article_id]
    else:
        current = current + [body.article_id]
    try:
        supabase.table("profiles").update({"saved_articles": current}).eq("user_id", user_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update saved articles: {e}")
    return {"saved_articles": current}
