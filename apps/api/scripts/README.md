# Article Ingestion CLI

CLI script to batch ingest articles through the full pipeline:
**Scrape → Summarize → Chunk → Embed → Save to Supabase**

## Setup

1. Make sure you're in the `apps/api` directory
2. Activate the virtual environment:
   ```bash
   source .venv/bin/activate
   ```
3. Ensure your `.env` file has `GEMINI_API_KEY` set

## Usage

### Process all URLs from urls.txt
```bash
python -m scripts.ingest --file data/urls.txt --auto-classify
```

### Process from a different file
```bash
python -m scripts.ingest --file data/my_urls.txt --auto-classify
```

### Process a single URL
```bash
python -m scripts.ingest --url "https://example.com/article" --auto-classify
```

### With category and difficulty
```bash
python -m scripts.ingest --url "https://example.com/article" --category "credit cards" --difficulty intermediate
```

### Auto-classify category and difficulty from content
To have the LLM infer each article’s category and difficulty from its content:
```bash
python -m scripts.ingest --file data/urls.txt --auto-classify
# or for a single URL:
python -m scripts.ingest --url "https://example.com/article" --auto-classify
```

### Update an existing article / regenerate chunks and embeddings
If the article is already in the DB, by default the script **skips everything** (no scrape, no chunks, no embeddings). To regenerate summary and **chunks + embeddings** from stored content, use `--update-existing`:

```bash
python -m scripts.ingest --file data/urls_bank_accounts.txt --update-existing
```

Use the same URL file format (e.g. `url,category,difficulty`); no `--auto-classify` needed if the file has category/difficulty.

### Skip embeddings (saves Gemini quota)
Embedding calls usually dominate quota usage. Use `--no-embeddings` to skip chunking/embeddings:

```bash
python -m scripts.ingest --file data/urls.txt --auto-classify --no-embeddings
```

### Chunks and embeddings only (no classification or summary)
To regenerate only chunks and embeddings—no LLM calls, so no quota and faster:

- **Existing articles only (URL-only file):** the script uses category/difficulty already in the DB.
- **File has new URLs too:** pass the category and difficulty for that file so new articles get the right metadata:

```bash
# Example: interest file → investing, beginner
python -m scripts.ingest --file data/urls_interest.txt --update-existing --chunks-only --category investing --difficulty beginner

# Example: bank accounts file → savings, beginner
python -m scripts.ingest --file data/urls_bank_accounts.txt --update-existing --chunks-only --category savings --difficulty beginner
```

Use the category that matches the URL file (e.g. `taxes`, `investing`, `savings`, `budgeting`, `credit score`, `student loans`, `credit cards`, `debt management`).

### Recreate `article_chunks` table (if you dropped it)
In Supabase SQL Editor, run (adjust if you use pgvector; otherwise `embedding` as `jsonb` or `real[]` works):

```sql
create table if not exists article_chunks (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding real[]  -- or vector(768) with pgvector extension
);
create index if not exists article_chunks_article_id_idx on article_chunks(article_id);
```

Then run ingest with `--update-existing` to populate chunks and embeddings.

## urls.txt Format

Add URLs to `data/urls.txt`. Supported formats:

```
# One URL per line (requires --auto-classify)
https://example.com/article1

# url,category,difficulty (comma-separated)
https://example.com/article2,credit cards,beginner
https://example.com/article3,student loans,intermediate
```

### Available Categories
- budgeting
- investing
- credit cards
- credit score
- student loans
- debt management
- taxes
- savings

### Difficulty Levels
- beginner
- intermediate
- advanced

## Notes

- Lines starting with `#` are ignored (comments)
- If an article is already in the DB, it will be skipped unless you pass `--update-existing`
- Some sites block scraping (e.g., studentaid.gov) - use alternative sources
