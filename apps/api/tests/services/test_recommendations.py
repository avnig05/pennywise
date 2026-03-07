import json
from datetime import datetime, timedelta, timezone

import pytest

from app.services import recommendations as reco


def test_normalize_keywords_handles_various_inputs():
    assert reco._normalize_keywords(None) == []
    assert reco._normalize_keywords(["a", "b", ""]) == ["a", "b"]

    # JSON string of list
    s = json.dumps(["x", "y", "  z  "])
    assert reco._normalize_keywords(s) == ["x", "y", "z"]

    # Fallback to comma-separated string when JSON fails
    s2 = "alpha,  beta , ,gamma"
    assert reco._normalize_keywords(s2) == ["alpha", "beta", "gamma"]


def test_parse_top_ids_from_response_honours_expected_count_and_ignores_extras():
    body = json.dumps(["id1", "id2", "id3"])
    ids = reco._parse_top_ids_from_response(body, expected_count=2)
    assert ids == ["id1", "id2"]


def test_parse_top_ids_from_response_handles_markdown_code_block():
    body = '```json\n["a","b","c"]\n```'
    ids = reco._parse_top_ids_from_response(body, expected_count=3)
    assert ids == ["a", "b", "c"]


def test_get_recommended_article_ids_returns_empty_when_no_profile(monkeypatch):
    monkeypatch.setattr(reco, "get_profile", lambda user_id: None)
    ids = reco.get_recommended_article_ids("user-1")
    assert ids == []


def test_get_recommended_article_ids_short_circuits_when_few_articles(monkeypatch):
    profile = {"priority": "saving"}
    articles = [
        {"id": "a1", "title": "t1", "category": "c", "difficulty": "beginner", "keywords": ["k"]},
        {"id": "a2", "title": "t2", "category": "c", "difficulty": "beginner", "keywords": ["k"]},
    ]

    monkeypatch.setattr(reco, "get_profile", lambda user_id: profile)
    monkeypatch.setattr(reco, "get_articles_for_recommendation", lambda limit: articles)

    # If len(articles) <= TOP_N, it should just return IDs without calling LLM
    called = {"value": False}

    def _fake_create_llm(*_args, **_kwargs):
        called["value"] = True
        raise AssertionError("LLM should not be called when candidate list is small")

    monkeypatch.setattr(reco, "_create_llm", _fake_create_llm)

    ids = reco.get_recommended_article_ids("user-1", top_n=5, candidate_limit=10)
    assert ids == ["a1", "a2"]
    assert called["value"] is False


def test_get_cached_recommendation_ids_respects_ttl(monkeypatch):
    # Build a fake Supabase response object
    class FakeResp:
        def __init__(self, rows):
            self.data = rows

    class FakeTable:
        def __init__(self, rows):
            self._rows = rows

        def select(self, *_args, **_kwargs):
            return self

        def eq(self, *_args, **_kwargs):
            return self

        def execute(self):
            return FakeResp(self._rows)

    class FakeSupabase:
        def __init__(self, rows):
            self._rows = rows

        def table(self, _name):
            return FakeTable(self._rows)

    now = datetime.now(timezone.utc)
    fresh_ts = now.isoformat()
    expired_ts = (now - timedelta(seconds=reco.RECOMMENDATIONS_CACHE_TTL_SECONDS + 10)).isoformat()

    # Fresh cache row
    fresh_rows = [{"user_id": "u1", "article_ids": json.dumps(["x", "y"]), "updated_at": fresh_ts}]
    monkeypatch.setattr(reco, "supabase", FakeSupabase(fresh_rows))
    ids = reco._get_cached_recommendation_ids("u1")
    assert ids == ["x", "y"]

    # Expired cache row
    expired_rows = [{"user_id": "u1", "article_ids": json.dumps(["x", "y"]), "updated_at": expired_ts}]
    monkeypatch.setattr(reco, "supabase", FakeSupabase(expired_rows))
    ids2 = reco._get_cached_recommendation_ids("u1")
    assert ids2 is None


def test_get_recommended_articles_uses_cache_when_available(monkeypatch):
    cached_ids = ["a1", "a2"]

    monkeypatch.setattr(reco, "_get_cached_recommendation_ids", lambda user_id: cached_ids)

    def _fake_articles_by_ids(ids):
        return [{"id": i} for i in ids]

    monkeypatch.setattr(reco, "_articles_by_ids", _fake_articles_by_ids)

    result = reco.get_recommended_articles("user-1", top_n=2)
    assert [a["id"] for a in result] == cached_ids


# ---- Tests that run actual service code with only Supabase/LLM mocked at the boundary ----


def test_get_profile_returns_row_from_supabase(monkeypatch):
    """Actual get_profile: uses real code, only Supabase is mocked."""
    fake_row = {"user_id": "u1", "priority": "saving", "interests": ["budgeting"]}

    class FakeResp:
        def __init__(self, data):
            self.data = data

    class FakeQuery:
        def __init__(self, data):
            self._data = data

        def select(self, *a):
            return self

        def eq(self, *a):
            return self

        def execute(self):
            return FakeResp(self._data)

    class FakeSupabase:
        def __init__(self, data):
            self._data = data

        def table(self, name):
            return FakeQuery(self._data)

    monkeypatch.setattr(reco, "supabase", FakeSupabase([fake_row]))
    result = reco.get_profile("u1")
    assert result == fake_row


def test_get_profile_returns_none_when_no_row(monkeypatch):
    """Actual get_profile when Supabase returns empty list."""
    class FakeResp:
        data = []

    class FakeQuery:
        def select(self, *a):
            return self

        def eq(self, *a):
            return self

        def execute(self):
            return FakeResp()

    class FakeSupabase:
        def table(self, name):
            return FakeQuery()

    monkeypatch.setattr(reco, "supabase", FakeSupabase())
    result = reco.get_profile("u1")
    assert result is None


def test_get_articles_for_recommendation_builds_payload_from_rows(monkeypatch):
    """Actual get_articles_for_recommendation: real loop over rows, keyword/summary logic."""
    rows = [
        {
            "id": "art1",
            "title": "Budgeting 101",
            "summary": "A short summary here.",
            "category": "budgeting",
            "difficulty": "beginner",
            "keywords": ["budgeting", "savings"],
        },
        {
            "id": "art2",
            "title": "No keywords",
            "summary": "Fallback text",
            "category": "savings",
            "difficulty": "intermediate",
            "keywords": None,
        },
    ]

    class FakeResp:
        def __init__(self, data):
            self.data = data

    class FakeQuery:
        def __init__(self, data):
            self._data = data

        def select(self, *a):
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

    monkeypatch.setattr(reco, "supabase", FakeSupabase(rows))
    result = reco.get_articles_for_recommendation(limit=5)
    assert len(result) == 2
    assert result[0]["id"] == "art1"
    assert result[0]["keywords"] == ["budgeting", "savings"]
    assert result[1]["keywords"] == ["Fallback text"]  # fallback from summary when keywords empty


def test_get_recommended_article_ids_full_flow_uses_real_parsing_and_filter(monkeypatch):
    """Actual get_recommended_article_ids: real prompt format, _parse_top_ids_from_response, valid_ids filter."""
    profile = {"user_id": "u1", "priority": "saving"}
    articles = [
        {"id": "a1", "title": "T1", "category": "c", "difficulty": "beginner", "keywords": ["k"]},
        {"id": "a2", "title": "T2", "category": "c", "difficulty": "beginner", "keywords": ["k"]},
        {"id": "a3", "title": "T3", "category": "c", "difficulty": "beginner", "keywords": ["k"]},
        {"id": "a4", "title": "T4", "category": "c", "difficulty": "beginner", "keywords": ["k"]},
        {"id": "a5", "title": "T5", "category": "c", "difficulty": "beginner", "keywords": ["k"]},
        {"id": "a6", "title": "T6", "category": "c", "difficulty": "beginner", "keywords": ["k"]},
    ]

    monkeypatch.setattr(reco, "get_profile", lambda user_id: profile)
    monkeypatch.setattr(reco, "get_articles_for_recommendation", lambda limit: articles)

    # LLM returns JSON array; service runs real _parse_top_ids_from_response and valid_ids filter
    class FakeResponse:
        content = '["a3", "a1", "a5", "invalid-id", "a2"]'

    class FakeLLM:
        def invoke(self, prompt):
            assert "u1" in prompt or "saving" in prompt
            assert "a1" in prompt and "a6" in prompt
            return FakeResponse()

    monkeypatch.setattr(reco, "_create_llm", lambda *a, **kw: FakeLLM())

    ids = reco.get_recommended_article_ids("u1", top_n=3, candidate_limit=10)
    assert ids == ["a3", "a1", "a5"]  # filtered to valid ids, then [:top_n]

