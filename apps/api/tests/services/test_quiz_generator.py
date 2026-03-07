import json

from app.services import quiz_generator as qg


def test_parse_quiz_from_response_valid_object():
    text = """
    {
      "questions": [
        {
          "question_text": "Q1?",
          "options": ["A", "B", "C", "D"],
          "correct_answer_index": 0
        },
        {
          "question_text": "Q2?",
          "options": ["A", "B", "C", "D"],
          "correct_answer_index": 1
        },
        {
          "question_text": "Q3?",
          "options": ["A", "B", "C", "D"],
          "correct_answer_index": 2
        },
        {
          "question_text": "Q4?",
          "options": ["A", "B", "C", "D"],
          "correct_answer_index": 3
        },
        {
          "question_text": "Q5?",
          "options": ["A", "B", "C", "D"],
          "correct_answer_index": 0
        }
      ]
    }
    """
    questions = qg._parse_quiz_from_response(text)
    assert questions is not None
    assert len(questions) >= 5
    assert all(len(q["options"]) == 4 for q in questions)


def test_parse_quiz_from_response_invalid_returns_none():
    bad = '{"questions": []}'
    assert qg._parse_quiz_from_response(bad) is None


def test_quiz_generation_in_progress_flags(monkeypatch):
    article_id = "article-123"
    # Ensure clean state for this specific article without touching other IDs
    qg._quiz_generation_in_progress.discard(article_id)
    assert qg.is_quiz_generation_in_progress(article_id) is False

    qg.mark_quiz_generation_started(article_id)
    assert qg.is_quiz_generation_in_progress(article_id) is True

    # run_quiz_generation_and_clear should always clear the flag even if generation fails
    def _fake_generate(article_id: str, for_regenerate: bool = False):
        return None

    monkeypatch.setattr(qg, "generate_quiz_for_article", _fake_generate)
    qg.run_quiz_generation_and_clear(article_id)

    assert qg.is_quiz_generation_in_progress(article_id) is False


def test_generate_quiz_for_article_full_flow(monkeypatch):
    """Actual generate_quiz_for_article: real prompt, _parse_quiz_from_response, DB insert flow; Supabase + LLM mocked."""
    article_row = {
        "id": "art-1",
        "title": "Budgeting Basics",
        "summary": "Learn to budget.",
        "original_content": "Content here with enough text for the article.",
    }
    quiz_id_returned = "quiz-uuid-123"
    inserted_questions = []
    tables_called = []

    class FakeResp:
        def __init__(self, data):
            self.data = data

    class FakeArticleQuery:
        def __init__(self, data):
            self._data = data

        def select(self, *a):
            return self

        def eq(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp(self._data)

    class FakeQuizInsertQuery:
        def insert(self, payload):
            return self

        def execute(self):
            return FakeResp([{"id": quiz_id_returned}])

    class FakeQuestionsInsertQuery:
        def __init__(self, capture):
            self._capture = capture

        def insert(self, payload):
            self._capture.append(payload)
            return self

        def execute(self):
            return FakeResp([{}])

    def table(name):
        tables_called.append(name)
        if name == "articles":
            return FakeArticleQuery([article_row])
        if name == "article_quizzes":
            return FakeQuizInsertQuery()
        if name == "quiz_questions":
            return FakeQuestionsInsertQuery(inserted_questions)
        return None

    class FakeSupabase:
        def table(self, name):
            return table(name)

    monkeypatch.setattr(qg, "supabase", FakeSupabase())

    valid_quiz_json = json.dumps({
        "questions": [
            {"question_text": "Q1?", "options": ["A", "B", "C", "D"], "correct_answer_index": 0},
            {"question_text": "Q2?", "options": ["A", "B", "C", "D"], "correct_answer_index": 1},
            {"question_text": "Q3?", "options": ["A", "B", "C", "D"], "correct_answer_index": 2},
            {"question_text": "Q4?", "options": ["A", "B", "C", "D"], "correct_answer_index": 3},
            {"question_text": "Q5?", "options": ["A", "B", "C", "D"], "correct_answer_index": 0},
        ]
    })

    class FakeLLMResponse:
        content = valid_quiz_json

    class FakeLLM:
        def invoke(self, prompt):
            assert "Budgeting Basics" in prompt
            assert "Content here" in prompt
            return FakeLLMResponse()

    monkeypatch.setattr(qg, "_create_llm", lambda *a, **kw: FakeLLM())

    result = qg.generate_quiz_for_article("art-1")

    assert result == quiz_id_returned
    assert len(inserted_questions) == 1  # one batch insert
    rows = inserted_questions[0]
    assert isinstance(rows, list)
    assert len(rows) >= 5
    assert all("question_text" in r and "options" in r and "correct_answer_index" in r for r in rows)

