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

