import os
import sys
from pathlib import Path

import pytest


# Ensure the app package (apps/api/app) is importable as `app`
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


@pytest.fixture(autouse=True)
def set_test_env(monkeypatch):
    """
    Ensure required env vars exist so helpers that call require_env don't crash.
    Individual tests still mock LLM / Supabase clients.
    """
    monkeypatch.setenv("GEMINI_API_KEY", os.getenv("GEMINI_API_KEY", "test-gemini-key"))
    monkeypatch.setenv("SUPABASE_URL", os.getenv("SUPABASE_URL", "http://localhost:54321"))
    yield


