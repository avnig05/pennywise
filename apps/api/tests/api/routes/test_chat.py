"""Unit tests for app/api/routes/chat.py"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.auth import get_current_user_id
from app.api.routes import chat as chat_routes

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


def test_ask_returns_401_without_auth():
    resp = client_no_auth.post("/chat/ask", json={"message": "How do I budget?"})
    assert resp.status_code == 401


def test_ask_returns_400_when_message_empty(auth_client):
    resp = auth_client.post("/chat/ask", json={"message": ""})
    assert resp.status_code == 400
    assert "message is required" in resp.json()["detail"]


def test_ask_creates_chat_and_returns_reply(auth_client, monkeypatch):
    new_chat_id = "chat-new-123"
    reply_text = "Here are steps to budget."
    sources = [{"title": "Article A", "source_url": "https://a.com", "snippet": "Snippet..."}]
    steps = ["Step 1", "Step 2"]

    class FakeResp:
        def __init__(self, data):
            self.data = data

    class FakeInsertQuery:
        def __init__(self, result_data):
            self._result = result_data

        def insert(self, payload):
            return self

        def execute(self):
            return FakeResp(self._result)

    class FakeSelectQuery:
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

    call_log = []

    def table(name):
        call_log.append(name)
        if name == "chats":
            if len(call_log) <= 1:
                return FakeInsertQuery([{"id": new_chat_id}])
            return FakeSelectQuery([{"id": new_chat_id}])
        if name == "chat_messages":
            return FakeInsertQuery([{"id": "msg-1"}])
        return None

    class FakeSupabase:
        def table(self, name):
            return table(name)

    monkeypatch.setattr(chat_routes, "supabase", FakeSupabase())
    monkeypatch.setattr(
        chat_routes,
        "answer_with_rag",
        lambda msg: (reply_text, sources, steps),
    )
    # Mock background task so we don't call summarize_chat
    monkeypatch.setattr(chat_routes, "_update_chat_title_background", lambda chat_id: None)

    resp = auth_client.post("/chat/ask", json={"message": "How do I budget?"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["reply"] == reply_text
    assert data["chat_id"] == new_chat_id
    assert len(data["sources"]) == 1
    assert data["sources"][0]["title"] == "Article A"
    assert data["steps"] == steps


def test_ask_uses_existing_chat_when_chat_id_provided(auth_client, monkeypatch):
    existing_chat_id = "chat-existing-456"

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

    class FakeInsertQuery:
        def insert(self, payload):
            return self

        def execute(self):
            return FakeResp([{"id": "msg-2"}])

    call_count = [0]

    def table(name):
        call_count[0] += 1
        if name == "chats":
            return FakeSelectQuery([{"id": existing_chat_id}])
        if name == "chat_messages":
            return FakeInsertQuery()
        return None

    class FakeSupabase:
        def table(self, name):
            return table(name)

    monkeypatch.setattr(chat_routes, "supabase", FakeSupabase())
    monkeypatch.setattr(
        chat_routes,
        "answer_with_rag",
        lambda msg: ("Reply", [], None),
    )
    monkeypatch.setattr(chat_routes, "_update_chat_title_background", lambda chat_id: None)

    resp = auth_client.post(
        "/chat/ask",
        json={"message": "Follow-up?", "chat_id": existing_chat_id},
    )
    assert resp.status_code == 200
    assert resp.json()["chat_id"] == existing_chat_id


def test_ask_returns_404_when_chat_id_not_owned(auth_client, monkeypatch):
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

    monkeypatch.setattr(chat_routes, "supabase", FakeSupabase())
    resp = auth_client.post(
        "/chat/ask",
        json={"message": "Hi", "chat_id": "other-users-chat"},
    )
    assert resp.status_code == 404
    assert "Chat not found" in resp.json()["detail"]


def test_list_chats_returns_200_and_list(auth_client, monkeypatch):
    chats_data = [
        {"id": "c1", "title": "Budget chat", "updated_at": "2025-01-01T12:00:00"}
    ]

    class FakeResp:
        def __init__(self, data):
            self.data = data

    class FakeChatsQuery:
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

    class FakeMessagesQuery:
        def select(self, *a):
            return self

        def eq(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp([{"id": "m1"}, {"id": "m2"}])

    call_count = [0]

    def table(name):
        call_count[0] += 1
        if name == "chats":
            return FakeChatsQuery(chats_data)
        if name == "chat_messages":
            return FakeMessagesQuery()
        return None

    class FakeSupabase:
        def table(self, name):
            return table(name)

    monkeypatch.setattr(chat_routes, "supabase", FakeSupabase())
    resp = auth_client.get("/chat")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["id"] == "c1"
    assert data[0]["message_count"] == 2


def test_get_chat_returns_404_when_not_found(auth_client, monkeypatch):
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

    monkeypatch.setattr(chat_routes, "supabase", FakeSupabase())
    resp = auth_client.get("/chat/nonexistent-chat")
    assert resp.status_code == 404
    assert "Chat not found" in resp.json()["detail"]


def test_get_chat_returns_detail_when_found(auth_client, monkeypatch):
    chat_row = {
        "id": "c1",
        "title": "My chat",
        "created_at": "2025-01-01T10:00:00",
        "updated_at": "2025-01-01T12:00:00",
    }
    messages_data = [
        {
            "id": "m1",
            "role": "user",
            "content": "Hello",
            "sources": None,
            "created_at": "2025-01-01T10:00:00",
        },
        {
            "id": "m2",
            "role": "assistant",
            "content": "Hi there.",
            "sources": [],
            "created_at": "2025-01-01T10:01:00",
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

        def eq(self, *a, **kw):
            return self

        def order(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp(self._data)

    call_count = [0]

    def table(name):
        call_count[0] += 1
        if name == "chats":
            return FakeQuery([chat_row])
        if name == "chat_messages":
            return FakeQuery(messages_data)
        return None

    class FakeSupabase:
        def table(self, name):
            return table(name)

    monkeypatch.setattr(chat_routes, "supabase", FakeSupabase())
    resp = auth_client.get("/chat/c1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "c1"
    assert data["title"] == "My chat"
    assert len(data["messages"]) == 2
    assert data["messages"][0]["role"] == "user"
    assert data["messages"][1]["role"] == "assistant"


def test_delete_chat_returns_404_when_not_found(auth_client, monkeypatch):
    class FakeResp:
        data = []

    class FakeQuery:
        def select(self, *a):
            return self

        def eq(self, *a, **kw):
            return self

        def delete(self):
            return self

        def execute(self):
            return FakeResp()

    class FakeSupabase:
        def table(self, name):
            return FakeQuery()

    monkeypatch.setattr(chat_routes, "supabase", FakeSupabase())
    resp = auth_client.delete("/chat/nonexistent-chat")
    assert resp.status_code == 404


def test_delete_chat_returns_success_when_found(auth_client, monkeypatch):
    class FakeResp:
        def __init__(self, data=None):
            self.data = data or []

    class FakeSelectQuery:
        def select(self, *a):
            return self

        def eq(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp([{"id": "c1"}])

    class FakeDeleteQuery:
        def delete(self):
            return self

        def eq(self, *a, **kw):
            return self

        def execute(self):
            return FakeResp()

    call_count = [0]

    def table(name):
        call_count[0] += 1
        if name == "chats":
            if call_count[0] == 1:
                return FakeSelectQuery()
            return FakeDeleteQuery()
        return None

    class FakeSupabase:
        def table(self, name):
            return table(name)

    monkeypatch.setattr(chat_routes, "supabase", FakeSupabase())
    resp = auth_client.delete("/chat/c1")
    assert resp.status_code == 200
    assert resp.json()["success"] is True
