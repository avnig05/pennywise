"""Quiz API routes for article quizzes (get quiz, submit answers, completion status)."""

from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends

from app.core.auth import get_current_user_id
from app.core.supabase_client import supabase
from app.models.quiz import QuizSubmissionRequest
from app.services.quiz_generator import (
    generate_quiz_for_article,
    is_quiz_generation_in_progress,
    mark_quiz_generation_started,
    run_quiz_generation_and_clear,
)
from app.services.learning_metadata import record_quiz_completion

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


def _quiz_response(article_id: str, quiz_id: Optional[str], questions: list) -> dict:
    """Build response dict; include status for client polling."""
    return {
        "status": "ready" if (quiz_id and questions) else "generating",
        "quiz_id": quiz_id,
        "article_id": article_id,
        "questions": questions,
    }

#Get article quiz
@router.get("/article/{article_id}")
def get_article_quiz(article_id: str, background_tasks: BackgroundTasks):
    """
    Get quiz for an article. If one exists, return it immediately.
    If not, return status 'generating' and empty questions, and generate the quiz in the background.
    Client should poll until status is 'ready' and questions are present.
    """
    quiz_resp = (
        #Check if there´s a generated quiz for a specific article
        supabase.table("article_quizzes").select("id").eq("article_id", article_id).execute()
    )
    if quiz_resp.data:
        quiz_id = quiz_resp.data[0]["id"]
        questions_resp = (
            supabase.table("quiz_questions")
            .select("*")
            .eq("quiz_id", quiz_id)
            .order("question_order")
            .execute()
        )
        questions = questions_resp.data or []
        return _quiz_response(article_id, quiz_id, questions)

    # No quiz yet: return immediately and generate in background (or already generating)
    if is_quiz_generation_in_progress(article_id):
        return _quiz_response(article_id, None, [])

    mark_quiz_generation_started(article_id)
    background_tasks.add_task(run_quiz_generation_and_clear, article_id, False)
    return _quiz_response(article_id, None, [])


@router.post("/article/{article_id}/submit")
async def submit_quiz(
    article_id: str,
    submission: QuizSubmissionRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Submit quiz answers and mark article as completed for the user."""
    quiz_resp = (
        supabase.table("article_quizzes").select("id").eq("article_id", article_id).execute()
    )
    if not quiz_resp.data:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz_id = quiz_resp.data[0]["id"]
    questions_resp = (
        supabase.table("quiz_questions")
        .select("id, correct_answer_index, question_order")
        .eq("quiz_id", quiz_id)
        .order("question_order")
        .execute()
    )
    questions = questions_resp.data or []
    if not questions:
        raise HTTPException(status_code=404, detail="Quiz questions not found")
    if len(submission.answers) != len(questions):
        raise HTTPException(
            status_code=400,
            detail=f"Expected {len(questions)} answers, got {len(submission.answers)}",
        )
    correct = sum(
        1
        for i, q in enumerate(questions)
        if i < len(submission.answers) and submission.answers[i] == q["correct_answer_index"]
    )
    total = len(questions)
    score = int((correct / total) * 100) if total else 0

    existing = (
        supabase.table("user_article_completions")
        .select("id, quiz_score")
        .eq("user_id", user_id)
        .eq("article_id", article_id)
        .execute()
    )
    already_has_quiz = existing.data and existing.data[0].get("quiz_score") is not None

    completion_data = {
        "user_id": user_id,
        "article_id": article_id,
        "quiz_score": score,
        "user_answers": submission.answers,
    }
    supabase.table("user_article_completions").upsert(
        completion_data,
        on_conflict="user_id,article_id",
    ).execute()

    if not already_has_quiz:
        record_quiz_completion(user_id, article_id)

    return {
        "score": score,
        "total_questions": total,
        "correct_answers": correct,
        "completed": True,
    }


@router.post("/article/{article_id}/regenerate")
async def regenerate_article_quiz(
    article_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete the current quiz and the user's completion, then generate a new quiz
    with different questions. Returns the new quiz.
    """

    # Delete user completion so they can take the new quiz
    supabase.table("user_article_completions").delete().eq(
        "user_id", user_id
    ).eq("article_id", article_id).execute()

    # Get existing quiz id to delete questions and quiz
    quiz_resp = (
        supabase.table("article_quizzes").select("id").eq("article_id", article_id).execute()
    )
    if quiz_resp.data:
        quiz_id = quiz_resp.data[0]["id"]
        supabase.table("quiz_questions").delete().eq("quiz_id", quiz_id).execute()
        supabase.table("article_quizzes").delete().eq("id", quiz_id).execute()

    # Generate new quiz with prompt tuned for different questions
    new_quiz_id = generate_quiz_for_article(article_id, for_regenerate=True)
    if not new_quiz_id:
        raise HTTPException(status_code=500, detail="Failed to generate new quiz")
    #Get the quiz questions
    questions_resp = (
        supabase.table("quiz_questions")
        .select("*")
        .eq("quiz_id", new_quiz_id)
        .order("question_order")
        .execute()
    )
    questions = questions_resp.data or []
    return {"quiz_id": new_quiz_id, "article_id": article_id, "questions": questions}


@router.get("/article/{article_id}/completion")
async def get_article_completion(
    article_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Return completion record if the user has completed this article's quiz; else null (JSON)."""
    resp = (
        supabase.table("user_article_completions")
        .select("*")
        .eq("user_id", user_id)
        .eq("article_id", article_id)
        .execute()
    )
    if resp.data:
        return resp.data[0]
    return None  # FastAPI serializes as JSON null
