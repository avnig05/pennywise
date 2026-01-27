# Pennywise API (FastAPI)

## Run locally
```bash
python -m venv .venv
# macOS/Linux: source .venv/bin/activate
# Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

## Env (required for /me)
Create `apps/api/.env` (gitignored):
```env
SUPABASE_URL=...  #You can see this in Supabase, Project Settings, Data API, project url
SUPABASE_ANON_KEY=...  #You can see this in Supabase, Project Settings, API Keys, Legacy anon, service_role API keys, anon public
SUPABASE_SERVICE_ROLE_KEY=... #You can see this in Supabase, Project Settings, API Keys, Legacy anon, service_role API keys, service role
DEV_USER_ID=...   # UUID of a Supabase Auth user (not sure if you guys can see the user I created in Supabase, if you do, set that UID, if not, create a new one(this is just to try fast before we actually do the OAUTH))
#Also add at the end this line:
API_PORT=8000
