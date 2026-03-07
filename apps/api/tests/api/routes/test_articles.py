"""Unit tests for app/api/routes/articles.py"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api.routes import articles as articles_routes

client = TestClient(app)


def test_list_articles_returns_200_and_list(monkeypatch):
    rows = [
        {
            "id": "art-1",
            "title": "Budget 101",
            "category": "budgeting",
            "difficulty": "beginner",
            "source_url": "https://example.com/1",
            "source_name": "Example",
            "summary": "Summary",
            "scraped_at": None,
            "created_at": "2025-01-01T00:00:00",
        }
    ]

    class FakeResp:
        def __init__(self, data):
            self.data = data

    class FakeQuery:
        def __init__(self, data):
            self._data = data

        def select(self, *a):
            return self

        def in_(self, *a, **kw):
            return self

        def eq(self, *a, **kw):
            return self

        def order(self, *a, **kw):
            return self

        def limit(self, n):
            return self

        def execute(self):
            return FakeResp(self._data)

    class FakeSupabase:
        def __init__(self, data):
            self._data = data

        def table(self, name):
            return FakeQuery(self._data)

    monkeypatch.setattr(articles_routes, "supabase", FakeSupabase(rows))
    resp = client.get("/articles")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["id"] == "art-1"
    assert data[0]["title"] == "Budget 101"


def test_list_articles_with_category_filter(monkeypatch):
    class FakeResp:
        data = []

    class FakeQuery:
        def select(self, *a):
            return self

        def in_(self, *a, **kw):
            return self

        def eq(self, *a, **kw):
            return self

        def order(self, *a, **kw):
            return self

        def limit(self, n):
            return self

        def execute(self):
            return FakeResp()

    class FakeSupabase:
        def table(self, name):
            return FakeQuery()

    monkeypatch.setattr(articles_routes, "supabase", FakeSupabase())
    resp = client.get("/articles?category=budgeting&difficulty=beginner")
    assert resp.status_code == 200
    assert resp.json() == []


def test_get_article_returns_404_when_not_found(monkeypatch):
    class FakeResp:
        data = []

    class FakeQuery:
        def select(self, *a):
            return self

        def eq(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp()

    class FakeSupabase:
        def table(self, name):
            return FakeQuery()

    monkeypatch.setattr(articles_routes, "supabase", FakeSupabase())
    resp = client.get("/articles/nonexistent-id")
    assert resp.status_code == 404
    assert "Article not found" in resp.json()["detail"]


def test_get_article_returns_article_when_found(monkeypatch):
    article = {
        "id": "art-1",
        "title": "How to Save",
        "category": "savings",
        "difficulty": "beginner",
        "summary": "A summary.",
    }

    class FakeResp:
        def __init__(self, data):
            self.data = data

    class FakeQuery:
        def __init__(self, data):
            self._data = data

        def select(self, *a):
            return self

        def eq(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp(self._data)

    class FakeSupabase:
        def __init__(self, data):
            self._data = data

        def table(self, name):
            return FakeQuery(self._data)

    monkeypatch.setattr(articles_routes, "supabase", FakeSupabase([article]))
    resp = client.get("/articles/art-1")
    assert resp.status_code == 200
    assert resp.json()["id"] == "art-1"
    assert resp.json()["title"] == "How to Save"


def test_get_article_structured_returns_404_when_article_missing(monkeypatch):
    class FakeResp:
        data = []

    class FakeQuery:
        def select(self, *a):
            return self

        def eq(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp()

    class FakeSupabase:
        def table(self, name):
            return FakeQuery()

    monkeypatch.setattr(articles_routes, "supabase", FakeSupabase())
    monkeypatch.setattr(articles_routes, "get_structured_article", lambda aid: None)
    resp = client.get("/articles/art-1/structured")
    assert resp.status_code == 404


def test_get_article_structured_returns_404_when_structured_missing(monkeypatch):
    class FakeResp:
        def __init__(self, data):
            self.data = data

    class FakeQuery:
        def __init__(self, data):
            self._data = data

        def select(self, *a):
            return self

        def eq(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp(self._data)

    class FakeSupabase:
        def __init__(self, data):
            self._data = data

        def table(self, name):
            return FakeQuery(self._data)

    monkeypatch.setattr(articles_routes, "supabase", FakeSupabase([{"id": "art-1"}]))
    monkeypatch.setattr(articles_routes, "get_structured_article", lambda aid: None)
    resp = client.get("/articles/art-1/structured")
    assert resp.status_code == 404
    assert "Structured content not found" in resp.json()["detail"]


def test_get_article_structured_returns_structured_when_found(monkeypatch):
    structured = {"sections": [{"title": "Intro", "content": "..."}], "intro_commentary": "Welcome."}

    class FakeResp:
        def __init__(self, data):
            self.data = data

    class FakeQuery:
        def __init__(self, data):
            self._data = data

        def select(self, *a):
            return self

        def eq(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp(self._data)

    class FakeSupabase:
        def __init__(self, data):
            self._data = data

        def table(self, name):
            return FakeQuery(self._data)

    monkeypatch.setattr(articles_routes, "supabase", FakeSupabase([{"id": "art-1"}]))
    monkeypatch.setattr(articles_routes, "get_structured_article", lambda aid: structured)
    resp = client.get("/articles/art-1/structured")
    assert resp.status_code == 200
    assert resp.json()["sections"] == structured["sections"]


def test_get_article_chunks_returns_404_when_article_missing(monkeypatch):
    class FakeResp:
        data = []

    class FakeQuery:
        def select(self, *a):
            return self

        def eq(self, *a, **kw):
            return self

        def order(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp()

    class FakeSupabase:
        def table(self, name):
            return FakeQuery()

    monkeypatch.setattr(articles_routes, "supabase", FakeSupabase())
    resp = client.get("/articles/art-1/chunks")
    assert resp.status_code == 404


def test_get_article_chunks_returns_list_when_found(monkeypatch):
    chunks = [
        {"id": "c1", "chunk_index": 0, "content": "First chunk.", "created_at": "2025-01-01T00:00:00"},
        {"id": "c2", "chunk_index": 1, "content": "Second chunk.", "created_at": "2025-01-01T00:00:00"},
    ]

    class FakeResp:
        def __init__(self, data):
            self.data = data

    class FakeQuery:
        def __init__(self, data):
            self._data = data

        def select(self, *a):
            return self

        def eq(self, *a, **kw):
            return self

        def order(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp(self._data)

    call_count = [0]

    def table(name):
        call_count[0] += 1
        if name == "articles":
            return FakeQuery([{"id": "art-1"}])
        if name == "article_chunks":
            return FakeQuery(chunks)
        return FakeQuery([])

    class FakeSupabase:
        def table(self, name):
            return table(name)

    monkeypatch.setattr(articles_routes, "supabase", FakeSupabase())
    resp = client.get("/articles/art-1/chunks")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["chunk_index"] == 0
