from datetime import datetime, timedelta, timezone

from app.services import tip_generator as tips


def test_should_regenerate_tip_based_on_threshold():
    now = datetime.now(timezone.utc)
    fresh = (now - timedelta(hours=tips.TIP_REGENERATION_HOURS - 1)).isoformat()
    old = (now - timedelta(hours=tips.TIP_REGENERATION_HOURS + 1)).isoformat()

    assert tips.should_regenerate_tip(fresh) is False
    assert tips.should_regenerate_tip(old) is True


def test_should_regenerate_tip_on_parse_error():
    # Invalid timestamp should be treated as "regenerate"
    assert tips.should_regenerate_tip("not-a-timestamp") is True


def test_get_or_generate_tip_uses_existing_when_fresh(monkeypatch):
    latest = {"tip_text": "Existing tip", "tip_timestamp": datetime.now(timezone.utc).isoformat()}

    monkeypatch.setattr(tips, "get_latest_tip", lambda user_id: latest)
    monkeypatch.setattr(tips, "should_regenerate_tip", lambda ts: False)

    called = {"generate": 0, "save": 0}

    monkeypatch.setattr(tips, "generate_tip_text", lambda user_id: called.__setitem__("generate", called["generate"] + 1) or "new")
    monkeypatch.setattr(tips, "save_tip", lambda user_id, text: called.__setitem__("save", called["save"] + 1) or True)

    result = tips.get_or_generate_tip("user-1")

    assert result == latest
    assert called["generate"] == 0
    assert called["save"] == 0


def test_get_or_generate_tip_generates_and_saves_when_missing(monkeypatch):
    monkeypatch.setattr(tips, "get_latest_tip", lambda user_id: None)
    monkeypatch.setattr(tips, "should_regenerate_tip", lambda ts: True)
    monkeypatch.setattr(tips, "generate_tip_text", lambda user_id: "fresh tip")
    monkeypatch.setattr(tips, "save_tip", lambda user_id, text: True)

    result = tips.get_or_generate_tip("user-1")

    assert result is not None
    assert result["tip_text"] == "fresh tip"


# ---- Tests that run actual service code with only Supabase/LLM mocked at the boundary ----


def test_get_latest_tip_returns_row_from_supabase(monkeypatch):
    """Actual get_latest_tip: real code path, only Supabase mocked."""
    row = {"tip_text": "Save 20% of income.", "tip_timestamp": "2025-01-01T12:00:00+00:00"}

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

        def limit(self, n):
            return self

        def execute(self):
            return FakeResp(self._data)

    class FakeSupabase:
        def __init__(self, data):
            self._data = data

        def table(self, name):
            return FakeQuery(self._data)

    monkeypatch.setattr(tips, "supabase", FakeSupabase([row]))
    result = tips.get_latest_tip("user-1")
    assert result == row


def test_get_recent_tips_returns_list_from_supabase(monkeypatch):
    """Actual get_recent_tips: real code path, only Supabase mocked."""
    rows = [{"tip_text": "Tip A"}, {"tip_text": "Tip B"}]

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

        def limit(self, n):
            return self

        def execute(self):
            return FakeResp(self._data)

    class FakeSupabase:
        def __init__(self, data):
            self._data = data

        def table(self, name):
            return FakeQuery(self._data)

    monkeypatch.setattr(tips, "supabase", FakeSupabase(rows))
    result = tips.get_recent_tips("user-1", limit=5)
    assert result == ["Tip A", "Tip B"]


def test_save_tip_calls_supabase_insert(monkeypatch):
    """Actual save_tip: real payload building and insert; Supabase mocked."""
    insert_payload = []

    class FakeResp:
        data = [{}]

    class FakeQuery:
        def __init__(self, capture):
            self._capture = capture

        def insert(self, payload):
            self._capture.append(payload)
            return self

        def execute(self):
            return FakeResp()

    class FakeSupabase:
        def __init__(self, capture):
            self._capture = capture

        def table(self, name):
            return FakeQuery(self._capture)

    monkeypatch.setattr(tips, "supabase", FakeSupabase(insert_payload))
    result = tips.save_tip("user-1", "Build an emergency fund of 3–6 months.")
    assert result is True
    assert len(insert_payload) == 1
    assert insert_payload[0]["user_id"] == "user-1"
    assert "emergency fund" in insert_payload[0]["tip_text"]
    assert "tip_timestamp" in insert_payload[0]


def test_generate_tip_text_runs_real_prompt_and_validation(monkeypatch):
    """Actual generate_tip_text: real get_profile/get_recent_tips/prompt building; only LLM mocked."""
    profile = {"priority": "saving", "interests": ["budgeting"], "debt_status": "none"}

    monkeypatch.setattr(tips, "get_profile", lambda user_id: profile)
    monkeypatch.setattr(tips, "get_recent_tips", lambda user_id, limit=5: [])

    class FakeResponse:
        content = "Aim to save at least 20% of your income each month for long-term goals."

    class FakeLLM:
        def invoke(self, prompt):
            assert "saving" in prompt or "budgeting" in prompt
            assert "User Profile" in prompt or "profile" in prompt.lower()
            return FakeResponse()

    monkeypatch.setattr(tips, "_create_llm", lambda *a, **kw: FakeLLM())

    result = tips.generate_tip_text("user-1")
    assert result is not None
    assert len(result) >= 20
    assert "20%" in result

