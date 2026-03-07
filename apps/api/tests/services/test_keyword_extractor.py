from app.services import keyword_extractor as ke


def test_parse_keywords_from_response_direct_json():
    text = '["Budgeting", " savings ", "CREDIT score", "budgeting"]'
    result = ke._parse_keywords_from_response(text, max_keywords=10)
    # Lowercased, trimmed, deduplicated
    assert result == ["budgeting", "savings", "credit score"]


def test_parse_keywords_from_response_with_markdown_block_and_extra_text():
    text = "Here are the keywords:\n```json\n[\"a\", \"b\", \"c\"]\n```\nThanks!"
    result = ke._parse_keywords_from_response(text, max_keywords=2)
    assert result == ["a", "b"]


def test_extract_keywords_llm_returns_empty_when_no_title_and_summary():
    assert ke.extract_keywords_llm("", "") == []


def test_extract_keywords_llm_runs_real_prompt_and_parsing(monkeypatch):
    """Actual extract_keywords_llm: real prompt format and _parse_keywords_from_response; only LLM mocked."""
    seen_prompt = []

    class FakeResponse:
        content = '["emergency fund", "savings", "budgeting"]'

    class FakeLLM:
        def invoke(self, prompt):
            seen_prompt.append(prompt)
            return FakeResponse()

    monkeypatch.setattr(ke, "_create_llm", lambda: FakeLLM())

    result = ke.extract_keywords_llm("How to save money", "Summary about emergency funds and budgeting.", max_keywords=5)

    assert result == ["emergency fund", "savings", "budgeting"]
    assert len(seen_prompt) == 1
    assert "How to save money" in seen_prompt[0]
    assert "Summary about" in seen_prompt[0]


def test_extract_keywords_for_article_full_flow(monkeypatch):
    """Actual extract_keywords_for_article: real Supabase chain + extract_keywords_llm; LLM mocked."""
    row = {"id": "art-1", "title": "Saving Tips", "summary": "Learn to build an emergency fund."}
    update_called = []

    class FakeResp:
        def __init__(self, data):
            self.data = data

    class FakeSelectQuery:
        def __init__(self, data):
            self._data = data

        def select(self, *a):
            return self

        def eq(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp(self._data)

    class FakeUpdateQuery:
        def __init__(self, captured):
            self._captured = captured

        def update(self, payload):
            self._captured.append(payload)
            return self

        def eq(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp([{"id": "art-1"}])

    class StatefulFake:
        def __init__(self):
            self.select_called = False

        def table(self, name):
            if not self.select_called:
                self.select_called = True
                return FakeSelectQuery([row])
            return FakeUpdateQuery(update_called)

    monkeypatch.setattr(ke, "supabase", StatefulFake())
    monkeypatch.setattr(ke, "extract_keywords_llm", lambda title, summary, max_keywords=10, debug=False: ["savings", "emergency fund"])

    result = ke.extract_keywords_for_article("art-1")

    assert result == ["savings", "emergency fund"]
    assert len(update_called) == 1
    assert update_called[0]["keywords"] == ["savings", "emergency fund"]

