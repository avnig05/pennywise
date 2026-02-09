"""Quiz models for article quizzes (5-7 questions, 4 options each)."""

from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class QuizQuestion(BaseModel):
    """A single quiz question with 4 options."""

    id: str
    quiz_id: str
    question_text: str
    options: List[str]  # Exactly 4 options
    correct_answer_index: int  # 0-3
    question_order: int
    created_at: Optional[datetime] = None


class Quiz(BaseModel):
    """A quiz for an article."""

    id: str
    article_id: str
    created_at: Optional[datetime] = None


class QuizWithQuestions(BaseModel):
    """Quiz with its questions included."""

    id: str
    article_id: str
    questions: List[QuizQuestion] = []
    created_at: Optional[datetime] = None


class QuizSubmissionRequest(BaseModel):
    """Request body for submitting quiz answers."""

    answers: List[int]  # List of answer indices (0-3) for each question


class QuizResult(BaseModel):
    """Result after submitting quiz."""

    score: int  # Percentage (0-100)
    total_questions: int
    correct_answers: int
    completed: bool
