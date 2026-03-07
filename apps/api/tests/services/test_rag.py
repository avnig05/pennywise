import pytest

from app.services import rag


def test_cosine_similarity_basic_cases():
    assert rag._cosine_similarity([1, 0], [1, 0]) == pytest.approx(1.0)
    assert rag._cosine_similarity([1, 0], [0, 1]) == pytest.approx(0.0)
    # Zero vector should yield 0 similarity
    assert rag._cosine_similarity([0, 0], [1, 2]) == pytest.approx(0.0)


def test_parse_steps_from_response_numbered_list():
    text = "1. First do this.\n2. Then do that.\n3. Finally, finish."
    steps = rag._parse_steps_from_response(text)
    assert steps is not None
    assert len(steps) >= 2
    assert "First do this." in steps[0]


def test_parse_steps_from_response_step_labels():
    text = "Step 1: Open an account.\nStep 2: Set up automatic transfers."
    steps = rag._parse_steps_from_response(text)
    assert steps is not None
    assert len(steps) == 2


def test_answer_with_rag_returns_fallback_when_no_chunks(monkeypatch):
    monkeypatch.setattr(rag, "retrieve_chunks", lambda question, top_k=rag.TOP_K_CHUNKS: [])

    answer, sources, steps = rag.answer_with_rag("How do I budget?")

    assert "don't have any article content" in answer
    assert sources == []
    assert steps is None


def test_answer_with_rag_calls_llm_and_builds_sources(monkeypatch):
    chunks = [
        {"title": "Article A", "content": "Content A", "source_url": "http://a", "chunk_index": 0},
        {"title": "Article A", "content": "More A", "source_url": "http://a", "chunk_index": 1},
        {"title": "Article B", "content": "Content B", "source_url": "http://b", "chunk_index": 0},
    ]
    monkeypatch.setattr(rag, "retrieve_chunks", lambda question, top_k=rag.TOP_K_CHUNKS: chunks)

    class FakeResponse:
        def __init__(self, content: str):
            self.content = content

    def _fake_invoke_llm_with_retry_and_fallback(prompt: str):
        # Return an answer that uses numbered steps so parsing is exercised
        return FakeResponse("1. Step one.\n2. Step two.")

    monkeypatch.setattr(rag, "_invoke_llm_with_retry_and_fallback", _fake_invoke_llm_with_retry_and_fallback)
    monkeypatch.setattr(rag, "RAG_LLM_BACKEND", "gemini")  # ensure we don't hit Ollama path

    answer, sources, steps = rag.answer_with_rag("How do I budget?")

    assert "Step one." in answer
    # Sources should be unique by (title, url) → 2 entries
    titles = {s["title"] for s in sources}
    assert titles == {"Article A", "Article B"}
    assert steps is not None and len(steps) >= 2


def test_is_429_detects_rate_limit():
    """Actual _is_429 helper used by RAG retry logic."""
    assert rag._is_429(Exception("429 Resource exhausted")) is True
    assert rag._is_429(Exception("RESOURCE_EXHAUSTED")) is True
    assert rag._is_429(Exception("500 Internal error")) is False


def test_retrieve_chunks_real_scoring_and_enrichment(monkeypatch):
    """Actual retrieve_chunks: real get_embedding + supabase mocked; scoring and enrichment run."""
    monkeypatch.setattr(rag, "get_embedding", lambda q: [1.0, 0.0, 0.0])

    chunk_rows = [
        {
            "id": "c1",
            "article_id": "art1",
            "chunk_index": 0,
            "content": "Budget steps here.",
            "embedding": [0.9, 0.1, 0.0],
        },
        {
            "id": "c2",
            "article_id": "art1",
            "chunk_index": 1,
            "content": "More content.",
            "embedding": [0.1, 1.0, 0.0],
        },
    ]
    articles_data = [{"id": "art1", "title": "Budget Article", "source_url": "https://example.com"}]

    class FakeChunkResp:
        def __init__(self, data):
            self.data = data

    class NotBuilder:
        """Supabase chain is .not_.is_('embedding', 'null') - not_ is attribute, .is_() returns builder."""
        def __init__(self, parent):
            self._parent = parent

        def is_(self, *a, **kw):
            return self._parent

    class FakeChunkQuery:
        def __init__(self, data):
            self._data = data
            self.not_ = NotBuilder(self)

        def select(self, *a):
            return self

        def execute(self):
            return FakeChunkResp(self._data)

    class FakeArticleQuery:
        def __init__(self, data):
            self._data = data

        def select(self, *a):
            return self

        def in_(self, *a, **kw):
            return self

        def execute(self):
            return FakeChunkResp(self._data)

    class FakeSupabase:
        def __init__(self, chunk_data, article_data):
            self._chunk_data = chunk_data
            self._article_data = article_data

        def table(self, name):
            if name == "article_chunks":
                return FakeChunkQuery(self._chunk_data)
            return FakeArticleQuery(self._article_data)

    monkeypatch.setattr(rag, "supabase", FakeSupabase(chunk_rows, articles_data))

    result = rag.retrieve_chunks("how to budget?", top_k=2)

    assert len(result) == 2
    assert result[0]["article_id"] == "art1"
    assert result[0]["title"] == "Budget Article"
    assert result[0]["source_url"] == "https://example.com"
    # First chunk has higher similarity to [1,0,0] than second
    assert "Budget steps" in result[0]["content"]

