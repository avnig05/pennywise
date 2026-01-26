import os
from pathlib import Path
from dotenv import load_dotenv

# Load apps/api/.env
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=False)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
DEV_USER_ID = os.getenv("DEV_USER_ID", "")

def require_env(name: str, value: str) -> str:
    if not value:
        raise RuntimeError(f"Missing required env var: {name} (check apps/api/.env)")
    return value
