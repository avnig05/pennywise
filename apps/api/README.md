# Pennywise API (FastAPI)

## Run locally
```bash
python -m venv .venv
# macOS/Linux: source .venv/bin/activate
# Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

## Env (required)
Create `apps/api/.env` (gitignored):
```env
SUPABASE_URL=...  # Project Settings > Data API > project url
SUPABASE_ANON_KEY=...  # Project Settings > API Keys > anon public
SUPABASE_SERVICE_ROLE_KEY=...  # Project Settings > API Keys > service role
GEMINI_API_KEY=...  # For AI recommendations
API_PORT=8000
