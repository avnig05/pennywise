import os
from pathlib import Path
from dotenv import load_dotenv

# Load apps/api/.env
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
print(f"Loading .env from: {ENV_PATH}")
print(f".env exists: {ENV_PATH.exists()}")
load_dotenv(dotenv_path=ENV_PATH, override=False)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# RAG chatbot backend:
# - "ollama" = local Ollama (no API limits)
# - "gemini" = Google Gemini via API key
_DEFAULT_RAG_BACKEND = "gemini" if GEMINI_API_KEY else "ollama"
RAG_LLM_BACKEND = os.getenv("RAG_LLM_BACKEND", _DEFAULT_RAG_BACKEND).strip().lower()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
# How long to reuse cached recommendations before recomputing (seconds). Default 24h.
RECOMMENDATIONS_CACHE_TTL_SECONDS = int(os.getenv("RECOMMENDATIONS_CACHE_TTL_SECONDS", "86400"))
print(f"GEMINI_API_KEY loaded: {'Yes' if GEMINI_API_KEY else 'No (empty)'}")
print(f"RAG backend: {RAG_LLM_BACKEND}")

def require_env(name: str, value: str) -> str:
    if not value:
        raise RuntimeError(f"Missing required env var: {name} (check apps/api/.env)")
    return value
