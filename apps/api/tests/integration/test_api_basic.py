from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint_uses_real_app():
    """Basic smoke test that the FastAPI app is wired and running."""
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body, dict)
    assert body.get("status") == "ok"


def test_list_articles_hits_real_supabase():
    """
    Integration test for /articles.

    This calls the actual FastAPI route, which in turn uses the real
    Supabase client configured via apps/api/.env (no mocks).
    """
    resp = client.get("/articles")
    # Route should exist and not raise an exception
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)

