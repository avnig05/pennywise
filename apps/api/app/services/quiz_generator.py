"""
Generate quiz questions for articles using LLM (Gemini).
Creates 5-7 questions with 4 options each based on article content.
"""

import json
import re
from typing import Optional

from langchain_google_genai import ChatGoogleGenerativeAI

# Article IDs currently being generated (to avoid duplicate background tasks)
_quiz_generation_in_progress: set[str] = set()

from app.core.config import GEMINI_API_KEY, require_env
from app.core.supabase_client import supabase


QUIZ_PROMPT_TEMPLATE = """You are creating a quiz for a financial education article. Generate 5-7 multiple-choice questions (exactly 4 options each) that test understanding of the key concepts from the article.

Requirements:
- Generate between 5-7 questions
- Each question must have exactly 4 options (A, B, C, D)
- Only one option should be correct
- Questions should test understanding, not just recall
- Make incorrect options plausible but clearly wrong
- Focus on the most important concepts from the article

Article Title: {title}
Article Summary: {summary}
Article Content (first 2500 chars): {content_preview}

Respond with ONLY a JSON object in this exact format:
{{
  "questions": [
    {{
      "question_text": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer_index": 0
    }}
  ]
}}

The correct_answer_index must be 0, 1, 2, or 3 corresponding to which option is correct. No other text."""


# When regenerating, we want clearly different questions (different angles, formats, and concepts)
QUIZ_REGENERATE_PROMPT_EXTRA = """

IMPORTANT - This is a SECOND quiz for the same article. The user already took a first quiz.
- Generate a COMPLETELY DIFFERENT set of questions: focus on different paragraphs, examples, or concepts from the article.
- Use different question STYLES: e.g. "Which of the following is NOT true?", "What would happen if...?", "How does X compare to Y?", scenario-based ("A person does Z. What is the best...?"), or application-style questions.
- Avoid repeating the same type of factual recall. Prefer application, comparison, or "which is the exception" style where appropriate.
- Pull from details or secondary points in the article, not just the main idea.
"""


def _create_llm(temperature: float = 0.3):
    api_key = require_env("GEMINI_API_KEY", GEMINI_API_KEY)
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=temperature,
    )


def _parse_quiz_from_response(text: str) -> Optional[list[dict]]:
    """Parse quiz questions from LLM JSON response."""
    if not text:
        return None
    text = text.strip()
    if "```" in text:
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```\s*$", "", text, flags=re.MULTILINE)
        text = text.strip()
    try:
        data = json.loads(text)
        if isinstance(data, dict) and "questions" in data:
            questions = data["questions"]
            if isinstance(questions, list) and len(questions) >= 5:
                valid = []
                for q in questions[:7]:
                    if (
                        isinstance(q, dict)
                        and "question_text" in q
                        and "options" in q
                        and "correct_answer_index" in q
                        and isinstance(q.get("options"), list)
                        and len(q["options"]) == 4
                        and isinstance(q["correct_answer_index"], int)
                        and 0 <= q["correct_answer_index"] <= 3
                    ):
                        valid.append(q)
                if len(valid) >= 5:
                    return valid
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            data = json.loads(match.group(0))
            if isinstance(data, dict) and "questions" in data:
                qs = data["questions"]
                if isinstance(qs, list) and len(qs) >= 5:
                    return qs[:7]
        except json.JSONDecodeError:
            pass
    return None


def generate_quiz_for_article(article_id: str, for_regenerate: bool = False) -> Optional[str]:
    """
    Generate quiz questions for an article using LLM.
    Creates quiz and questions in DB. Returns quiz_id if successful, None otherwise.
    If for_regenerate is True, uses a different prompt and higher temperature so the
    new questions are clearly different (different angles, formats, and concepts).
    """
    resp = (
        supabase.table("articles")
        .select("id, title, summary, original_content")
        .eq("id", article_id)
        .execute()
    )
    if not resp.data:
        return None
    article = resp.data[0]
    title = (article.get("title") or "").strip()
    summary = (article.get("summary") or "").strip()
    content = article.get("original_content") or ""
    content_preview = (content or "")[:2500]

    if not title or not content:
        return None

    prompt = QUIZ_PROMPT_TEMPLATE.format(
        title=title[:200],
        summary=summary[:500] if summary else "No summary available",
        content_preview=content_preview,
    )
    if for_regenerate:
        prompt += QUIZ_REGENERATE_PROMPT_EXTRA

    # Higher temperature when regenerating for more variety
    temperature = 0.55 if for_regenerate else 0.3
    llm = _create_llm(temperature=temperature)
    try:
        response = llm.invoke(prompt)
        response_text = response.content if hasattr(response, "content") else str(response)
        questions_data = _parse_quiz_from_response(response_text)
        if not questions_data:
            return None
        quiz_resp = supabase.table("article_quizzes").insert({"article_id": article_id}).execute()
        if not quiz_resp.data:
            return None
        quiz_id = quiz_resp.data[0]["id"]
        question_rows = [
            {
                "quiz_id": quiz_id,
                "question_text": q["question_text"],
                "options": q["options"],
                "correct_answer_index": q["correct_answer_index"],
                "question_order": i,
            }
            for i, q in enumerate(questions_data)
        ]
        if question_rows:
            supabase.table("quiz_questions").insert(question_rows).execute()
        return quiz_id
    except Exception:
        return None


def is_quiz_generation_in_progress(article_id: str) -> bool:
    """True if a background task is already generating a quiz for this article."""
    return article_id in _quiz_generation_in_progress


def mark_quiz_generation_started(article_id: str) -> None:
    """Call before starting background generation."""
    _quiz_generation_in_progress.add(article_id)


def run_quiz_generation_and_clear(article_id: str, for_regenerate: bool = False) -> None:
    """
    Run quiz generation in background; always removes article_id from in-progress set when done.
    Use this as the BackgroundTasks task so the route can return immediately.
    """
    try:
        generate_quiz_for_article(article_id, for_regenerate=for_regenerate)
    finally:
        _quiz_generation_in_progress.discard(article_id)
