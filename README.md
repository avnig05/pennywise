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

