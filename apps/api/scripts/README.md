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
python -m scripts.ingest
```

### Process from a different file
```bash
python -m scripts.ingest --file data/my_urls.txt
```

### Process a single URL
```bash
python -m scripts.ingest --url "https://example.com/article" --category budgeting
```

### With category and difficulty
```bash
python -m scripts.ingest --url "https://example.com/article" --category credit_cards --difficulty intermediate
```

## urls.txt Format

Add URLs to `data/urls.txt`, one per line:

```
# Simple format (uses default category "budgeting")
https://example.com/article1

# With category and difficulty (comma-separated)
https://example.com/article2,credit_cards,beginner
https://example.com/article3,student_loans,intermediate
```

### Available Categories
- budgeting
- investing
- credit_cards
- building_credit
- student_loans
- debt_management
- taxes
- savings

### Difficulty Levels
- beginner (default)
- intermediate
- advanced

## Notes

- Lines starting with `#` are ignored (comments)
- Duplicate URLs will be skipped ("Article already exists")
- Some sites block scraping (e.g., studentaid.gov) - use alternative sources
