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

### Update an existing article (same URL)
If the article is already in the DB, by default ingestion is skipped. Use `--update-existing` to refresh the summary (and chunks/embeddings unless disabled):

```bash
python -m scripts.ingest --file data/urls.txt --auto-classify --update-existing
```

### Skip embeddings (saves Gemini quota)
Embedding calls usually dominate quota usage. Use `--no-embeddings` to skip chunking/embeddings:

```bash
python -m scripts.ingest --file data/urls.txt --auto-classify --no-embeddings
```

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
