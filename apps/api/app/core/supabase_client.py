from supabase import create_client, Client
from app.core.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, require_env

supabase: Client = create_client(
    require_env("SUPABASE_URL", SUPABASE_URL),
    require_env("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY),
)
