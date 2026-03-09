# pennywise
finance app that simplifies budgeting, financial literacy, and decision-making with personalized guidance

## What is Pennywise?

Pennywise is a finance education + guidance app focused on helping users understand core money topics through personalized recommendations and a source-backed assistant.

## Monorepo structure

- `apps/web` — Frontend (React/Next + TypeScript)
- `apps/api` — Backend (FastAPI)
- `packages/shared` — Shared types/utilities across apps
- `docs/` — Architecture, API contract, and data model
- `.github/workflows/` — CI pipelines (WIP)

## Local development (WIP)

1) Create your local env file:
```bash
cp .env.example .env

2) Run the API:
```bash
cd apps/api
python -m venv .venv
# macOS/Linux: source .venv/bin/activate
# Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
Health check:
http://localhost:8000/health

3)Run the Web app
cd apps/web
## Run locally
```bash
cd apps/web
npm install
npm run dev

Web env (required):
Create apps/web/.env.local with the following content:
    NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
.env.local is gitignored. Do not commit it.

```md
API env (required for Supabase-backed endpoints):
Create `apps/api/.env` (gitignored) with:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` (for AI recommendations)

### API quick test (PowerShell)

Health:
```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:8000/health"

1st method: Get profile
Invoke-RestMethod -Method Get -Uri "http://localhost:8000/me"

2nd method: Update profile
Invoke-RestMethod -Method Put -Uri "http://localhost:8000/me" `
  -ContentType "application/json" `
  -Body '{"job_type":"w2","state":"CA","pay_frequency":"biweekly","net_income_range":"1500_2500","rent_status":"rent","debt_status":"none","credit_card_status":"use_sometimes","emergency_buffer_range":"lt_500","priority":"save"}'

### How user data is stored

Supabase connection credentials are stored in `apps/api/.env` (gitignored).  
The backend now requires proper authentication to extract the user's `user_id`.

When the frontend sends a `PUT /me` request with proper authentication, the API updates the profile for that user in the `profiles` table in Supabase.  
You can then confirm it was saved by calling `GET /me`.

> Note: Authentication middleware needs to be implemented to extract `user_id` from Supabase Auth tokens.
