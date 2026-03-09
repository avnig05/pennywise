from typing import Optional, Literal, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.core.auth import get_current_user_id
from app.core.supabase_client import supabase
from app.services.recommendations import get_recommended_articles, invalidate_recommendations_cache
from app.services.tip_generator import get_or_generate_tip
from app.services.learning_metadata import checkin, record_article_read

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
@router.post("/checkin")
async def post_checkin(user_id: str = Depends(get_current_user_id)):
    """Record a daily visit — updates streak without touching article/quiz counters."""
    meta = checkin(user_id)
    return {"learning_metadata": meta}


class MarkReadBody(BaseModel):
    article_id: str


@router.post("/mark-read")
async def mark_article_read(
    body: MarkReadBody, user_id: str = Depends(get_current_user_id)
):
    """Mark an article as read. Inserts a row in user_article_completions with
    null quiz_score/user_answers. Idempotent — safe to call multiple times."""
    existing = (
        supabase.table("user_article_completions")
        .select("id")
        .eq("user_id", user_id)
        .eq("article_id", body.article_id)
        .execute()
    )
    if not existing.data:
        supabase.table("user_article_completions").insert({
            "user_id": user_id,
            "article_id": body.article_id,
            "quiz_score": None,
            "user_answers": None,
        }).execute()

    meta = record_article_read(user_id, body.article_id)
    return {"learning_metadata": meta}


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


@router.get("/article/{article_id}/quiz-results")
async def get_article_quiz_results(article_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Return per-question correct/wrong for the user's completed quiz.
    Never sends correct_answer_index to the client.
    """
    comp_resp = (
        supabase.table("user_article_completions")
        .select("user_answers")
        .eq("user_id", user_id)
        .eq("article_id", article_id)
        .execute()
    )
    if not comp_resp.data or not comp_resp.data[0].get("user_answers"):
        raise HTTPException(status_code=404, detail="No completion found for this article.")
    user_answers = comp_resp.data[0]["user_answers"] or []

    quiz_resp = (
        supabase.table("article_quizzes").select("id").eq("article_id", article_id).execute()
    )
    if not quiz_resp.data:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    quiz_id = quiz_resp.data[0]["id"]
    questions_resp = (
        supabase.table("quiz_questions")
        .select("correct_answer_index, question_order")
        .eq("quiz_id", quiz_id)
        .order("question_order")
        .execute()
    )
    questions = questions_resp.data or []
    if len(user_answers) != len(questions):
        raise HTTPException(status_code=400, detail="Completion does not match current quiz.")
    results = [
        i < len(user_answers) and user_answers[i] == q.get("correct_answer_index")
        for i, q in enumerate(questions)
    ]
    correct_answer_indices = [q.get("correct_answer_index") for q in questions]
    return {"results": results, "correct_answer_indices": correct_answer_indices}


# Learning progress: categories that have articles (key = DB category, label = display)
LEARNING_PROGRESS_CATEGORIES = [
    ("savings", "Savings"),
    ("budgeting", "Budgeting"),
    ("taxes", "Taxes"),
    ("investing", "Investing"),
    ("debt_management", "Debt Management"),
    ("banking", "Banking"),
    ("student_loans", "Student Loans"),
    ("credit_cards", "Credit Cards"),
    ("credit_score", "Credit Score"),
]


@router.get("/progress")
async def get_my_progress(user_id: str = Depends(get_current_user_id)):
    """
    Get learning progress per category. Each category has a 0–100% based on
    quiz completions: (sum of quiz scores for that category) / (total articles in category).
    """
    result = []
    for category_key, label in LEARNING_PROGRESS_CATEGORIES:
        # Articles in this category (support snake_case and space form in DB)
        categories_match = [category_key, category_key.replace("_", " ")]
        art_resp = (
            supabase.table("articles")
            .select("id")
            .in_("category", categories_match)
            .execute()
        )
        article_ids = [r["id"] for r in (art_resp.data or [])]
        total = len(article_ids)
        if total == 0:
            result.append({"category": category_key, "label": label, "percent": 0})
            continue
        # User completions for these articles
        if not article_ids:
            result.append({"category": category_key, "label": label, "percent": 0})
            continue
        comp_resp = (
            supabase.table("user_article_completions")
            .select("article_id, quiz_score")
            .eq("user_id", user_id)
            .in_("article_id", article_ids)
            .execute()
        )
        completions = comp_resp.data or []
        score_sum = sum(c.get("quiz_score", 0) for c in completions)
        percent = min(100, round((score_sum / total)))
        result.append({"category": category_key, "label": label, "percent": percent})
    return {"progress": result}
