## Pennywise

**Pennywise** is a finance app that simplifies budgeting, builds financial literacy, and helps you make better money decisions with personalized, source-backed guidance.

The goal is to feel in control of your money — not overwhelmed by it.

---

### What Pennywise does

- **Personalized guidance**: Understand your financial situation through an onboarding flow and tailored recommendations instead of generic advice.
- **Education-first experience**: Learn the *why* behind each suggestion, with explanations and links to credible sources.
- **Practical budgeting help**: Get suggestions for how to allocate income, manage recurring expenses, and plan toward goals.
- **Assistant-style interactions**: Ask questions in natural language and get structured, source-backed answers (powered by AI).

---

### Website / app preview

- **Marketing site hero section**
  - *(Add screenshot here – for example a hero image of the landing page)*

- **Dashboard**
  - *(Add screenshot here – main dashboard showing summary cards, income/expense breakdown, and recommendations)*

- **Onboarding flow**
  - *(Add screenshot here – multi-step questionnaire capturing job type, income, rent, debt, goals, etc.)*

You can embed images like this once you have them exported:

```md
![Pennywise dashboard](./docs/images/dashboard.png)
```

---

### Tech stack (for curious users)

- **Frontend**: Next.js (React + TypeScript)
- **Backend**: FastAPI (Python)
- **Database & Auth**: Supabase
- **AI**: Gemini (for recommendations and explanations)
- **Monorepo**: pnpm / npm workspaces-style layout

You do **not** need to know any of this to simply run the app locally, but it’s helpful context if you’re technical or considering contributing.

---

### Repository structure

- `apps/web` – Web app (Next.js)
- `apps/api` – API service (FastAPI)
- `packages/shared` – Shared types/utilities
- `docs/` – Architecture, API contract, data model, and design docs

---

### How to run Pennywise locally

This section is intended for anyone who wants to try Pennywise on their own machine (no prior contribution required).

#### 1. Prerequisites

- **Node.js** (LTS version recommended, e.g. 20.x)
- **npm** or **pnpm** (npm works out of the box)
- **Python 3.10+**
- A **Supabase** project (free tier is fine)
- A **Gemini** API key (for AI features; optional but recommended)

---

### Backend (API) setup

1. **Navigate to the API app**

   ```bash
   cd apps/api
   ```

2. **Create and activate a virtual environment**

   ```bash
   python -m venv .venv
   # macOS/Linux
   source .venv/bin/activate
   # Windows (PowerShell)
   .venv\Scripts\Activate.ps1
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Create the API environment file**

   In `apps/api`, create a file named `.env` (this file is gitignored) and add:

   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GEMINI_API_KEY=your_gemini_api_key   # required for AI features
   ```

5. **Run the API locally**

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

6. **Check that the API is healthy**

   Open in your browser:

   - `http://localhost:8000/health`

---

### Frontend (web) setup

1. **Open a new terminal window** (keep the API running), then from the repo root:

   ```bash
   cd apps/web
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create the web environment file**

   In `apps/web`, create `.env.local` with:

   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

   `apps/web/.env.local` is gitignored and should **not** be committed.

4. **Run the web app**

   ```bash
   npm run dev
   ```

5. **Open the app**

   Visit:

   - `http://localhost:3000`

You should now be able to go through onboarding, see your dashboard, and interact with guidance powered by the running API.

---

### Quick API test (optional, for power users)

If you prefer using PowerShell or a terminal, here are sample calls to exercise the profile endpoints once your API is running on `http://localhost:8000`.

```powershell
# Health check
Invoke-RestMethod -Method Get -Uri "http://localhost:8000/health"

# Get current profile
Invoke-RestMethod -Method Get -Uri "http://localhost:8000/me"

# Update profile
Invoke-RestMethod -Method Put -Uri "http://localhost:8000/me" `
  -ContentType "application/json" `
  -Body '{"job_type":"w2","state":"CA","pay_frequency":"biweekly","net_income_range":"1500_2500","rent_status":"rent","debt_status":"none","credit_card_status":"use_sometimes","emergency_buffer_range":"lt_500","priority":"save"}'
```

---

### How user data is stored

- **Supabase** stores user profiles (for example, your job type, income range, rent status, and goals) in a `profiles` table.
- Secure credentials for Supabase live only in `apps/api/.env`, which is never committed.
- The backend is designed to use authenticated Supabase tokens to derive a `user_id` so that each user’s data is kept separate.

From the app’s perspective:

- The web app sends authenticated requests like `PUT /me` to update your profile.
- The API writes this information to Supabase.
- You can verify what’s stored by calling `GET /me`.

---

### Contributing / feedback

- **Non-technical feedback**: If you’re just trying out Pennywise, feedback on clarity, tone, and usefulness of recommendations is extremely valuable.
- **Technical contributions**: If you’re a developer and want to contribute, you can:
  - Open an issue describing a bug, idea, or improvement.
  - Submit a pull request (ideally with a short description and screenshots where applicable).

Pennywise is early-stage and evolving quickly; your feedback helps shape what it becomes.
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
