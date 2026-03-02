# Pennywise API (FastAPI)

## Run locally
```bash
python -m venv .venv
# macOS/Linux: source .venv/bin/activate
# Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Env (required)
Create `apps/api/.env` (gitignored):
```env
SUPABASE_URL=...  # Project Settings > Data API > project url
SUPABASE_ANON_KEY=...  # Project Settings > API Keys > anon public
SUPABASE_SERVICE_ROLE_KEY=...  # Project Settings > API Keys > service role
GEMINI_API_KEY=...  # For embeddings + optional Gemini RAG backend
API_PORT=8000
```

## RAG Chatbot

The `/chat/ask` endpoint answers questions using your article chunks (embeddings required).

### Chatbot backend (for developers)

We were hitting Gemini’s free-tier limits, so the RAG chatbot is wired to use **Ollama** (local) by default for generating answers. Embeddings still use Gemini once per question. For local dev you need Ollama installed, `ollama pull llama3.2`, and the Ollama app running. For production we can either run Ollama on the server or set the backend back to Gemini (see below).

**Flow:** User message → embed query (Gemini) → similarity search over `article_chunks` → top chunks + question → **Ollama or Gemini** → reply + sources.

### Using Ollama (recommended; no API limits)

1. Install [Ollama](https://ollama.com) and start the server (it often runs in the background after install).
2. Pull a model: `ollama pull llama3.2` (or `mistral`, `llama3.1`, etc.).
3. In `apps/api/.env` (optional; these are the defaults):
   ```env
   RAG_LLM_BACKEND=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.2
   ```
4. Run the API; the chatbot will use Ollama for answers. Embeddings still use Gemini (one call per question; you can switch to a local embedder later if needed).

If Ollama isn’t running or the model isn’t pulled, `/chat/ask` returns 503 with a message explaining how to fix it.

### Using Gemini

Set `RAG_LLM_BACKEND=gemini` in `.env`. You’ll need `GEMINI_API_KEY`. Free tier has limited generate-content requests per day.

- **POST /chat/ask**  
  Body: `{ "message": "How do I improve my credit score?" }`  
  Response: `{ "reply": "...", "sources": [{ "title", "source_url", "snippet" }] }`

**From here:** Wire the ChatButton (or a chat page) to this endpoint; optionally add conversation history (e.g. `chats` / `messages` tables) and pass last N turns into the RAG prompt for multi-turn chat.

## Article structured content

`GET /articles/:id/structured` returns sections and Pennywise commentary **from the database only** (no LLM at read time). Pre-generate with a script.

**1. Add the column once** (Supabase → SQL Editor): run `scripts/add_structured_content_column.sql` or  
`ALTER TABLE articles ADD COLUMN IF NOT EXISTS structured_content jsonb DEFAULT NULL;`

**2. Generate structured content** (from `apps/api`):

```bash
python scripts/backfill_structured_articles.py              # only articles missing structured_content
python scripts/backfill_structured_articles.py --limit 5   # test with 5
python scripts/backfill_structured_articles.py --all        # regenerate all
python scripts/backfill_structured_articles.py --force <id> # regenerate one
```

Uses Ollama by default (same as RAG). Set `RAG_LLM_BACKEND=gemini` in `.env` to use Gemini instead. After the script runs, article pages load structured content from the DB with no per-request generation.
