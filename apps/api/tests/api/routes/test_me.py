"""Unit tests for app/api/routes/me.py"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.auth import get_current_user_id
from app.api.routes import me as me_routes

# Use a client with no auth override to test 401
client_no_auth = TestClient(app)


async def fake_user_id():
    return "test-user-123"


@pytest.fixture
def auth_client():
    app.dependency_overrides[get_current_user_id] = fake_user_id
    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.pop(get_current_user_id, None)


def test_get_me_returns_401_without_auth():
    resp = client_no_auth.get("/me")
    assert resp.status_code == 401


def test_get_me_returns_404_when_no_profile(auth_client, monkeypatch):
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

    monkeypatch.setattr(me_routes, "supabase", FakeSupabase())
    resp = auth_client.get("/me")
    assert resp.status_code == 404
    assert "Profile not found" in resp.json()["detail"]


def test_get_me_returns_profile_when_found(auth_client, monkeypatch):
    profile = {"user_id": "test-user-123", "priority": "save", "interests": ["budgeting"]}

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

    monkeypatch.setattr(me_routes, "supabase", FakeSupabase([profile]))
    resp = auth_client.get("/me")
    assert resp.status_code == 200
    assert resp.json()["user_id"] == "test-user-123"
    assert resp.json()["priority"] == "save"


def test_put_me_updates_and_returns_profile(auth_client, monkeypatch):
    updated_row = {"user_id": "test-user-123", "priority": "debt", "state": "CA"}

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

        def upsert(self, payload, on_conflict=None):
            return self

        def execute(self):
            return FakeResp(self._data)

    class FakeSupabase:
        def __init__(self, data):
            self._data = data

        def table(self, name):
            return FakeQuery(self._data)

    monkeypatch.setattr(me_routes, "supabase", FakeSupabase([updated_row]))
    monkeypatch.setattr(me_routes, "invalidate_recommendations_cache", lambda uid: None)

    resp = auth_client.put("/me", json={"priority": "debt", "state": "CA"})
    assert resp.status_code == 200
    assert resp.json()["priority"] == "debt"


def test_get_my_feed_returns_articles(auth_client, monkeypatch):
    articles = [{"id": "a1", "title": "Budget 101", "category": "budgeting"}]
    monkeypatch.setattr(me_routes, "get_recommended_articles", lambda user_id, top_n=5: articles)

    resp = auth_client.get("/me/feed?top_n=3")
    assert resp.status_code == 200
    assert resp.json()["articles"] == articles


def test_get_my_tip_returns_tip(auth_client, monkeypatch):
    tip = {"tip_text": "Save 20% of income.", "tip_timestamp": "2025-01-01T12:00:00Z"}
    monkeypatch.setattr(me_routes, "get_or_generate_tip", lambda user_id: tip)

    resp = auth_client.get("/me/tip")
    assert resp.status_code == 200
    assert resp.json()["tip_text"] == tip["tip_text"]


def test_get_my_tip_returns_404_when_no_tip(auth_client, monkeypatch):
    monkeypatch.setattr(me_routes, "get_or_generate_tip", lambda user_id: None)

    resp = auth_client.get("/me/tip")
    assert resp.status_code == 404
    assert "Unable to generate tip" in resp.json()["detail"]


def test_post_checkin_returns_learning_metadata(auth_client, monkeypatch):
    meta = {"articles_read": 1, "current_streak": 1, "badges": {}}
    monkeypatch.setattr(me_routes, "checkin", lambda user_id: meta)

    resp = auth_client.post("/me/checkin")
    assert resp.status_code == 200
    assert resp.json()["learning_metadata"] == meta


def test_mark_article_read_returns_learning_metadata(auth_client, monkeypatch):
    meta = {"articles_read": 2, "read_article_ids": ["art-1", "art-2"]}
    monkeypatch.setattr(me_routes, "record_article_read", lambda user_id, article_id: meta)

    resp = auth_client.post("/me/mark-read", json={"article_id": "art-1"})
    assert resp.status_code == 200
    assert resp.json()["learning_metadata"] == meta


def test_toggle_saved_article_adds_and_returns_list(auth_client, monkeypatch):
    current_saved = []
    updated_saved = ["art-1"]

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
        def __init__(self):
            self._updated = None

        def update(self, payload):
            self._updated = payload.get("saved_articles")
            return self

        def eq(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp([{}])

    call_count = [0]

    def table(name):
        call_count[0] += 1
        if name == "profiles":
            if call_count[0] == 1:
                return FakeSelectQuery([{"saved_articles": current_saved}])
            return FakeUpdateQuery()
        return None

    class FakeSupabase:
        def table(self, name):
            return table(name)

    monkeypatch.setattr(me_routes, "supabase", FakeSupabase())
    resp = auth_client.post("/me/saved/toggle", json={"article_id": "art-1"})
    assert resp.status_code == 200
    assert "art-1" in resp.json()["saved_articles"]


def test_get_my_progress_returns_progress_structure(auth_client, monkeypatch):
    class FakeResp:
        def __init__(self, data):
            self.data = data

    class FakeArticlesQuery:
        def select(self, *a):
            return self

        def in_(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp([{"id": "art-1"}])

    class FakeCompletionsQuery:
        def select(self, *a):
            return self

        def eq(self, *a, **kw):
            return self

        def in_(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp([{"article_id": "art-1", "quiz_score": 80}])

    call_count = [0]

    def table(name):
        call_count[0] += 1
        if name == "articles":
            return FakeArticlesQuery()
        if name == "user_article_completions":
            return FakeCompletionsQuery()
        return None

    class FakeSupabase:
        def table(self, name):
            return table(name)

    monkeypatch.setattr(me_routes, "supabase", FakeSupabase())
    resp = auth_client.get("/me/progress")
    assert resp.status_code == 200
    data = resp.json()
    assert "progress" in data
    assert isinstance(data["progress"], list)
    assert len(data["progress"]) > 0
    assert data["progress"][0]["category"] == "savings"
    assert "percent" in data["progress"][0]
