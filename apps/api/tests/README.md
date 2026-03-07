# API unit tests

Unit tests for `apps/api`. They use **pytest** and cover pure logic only (no DB or LLM calls during the test run).

## Prerequisites

- From `apps/api`: create/activate the venv and install dependencies (pytest is in `requirements.txt`).

## Run all tests

Run from the **`apps/api`** directory (not from inside `tests/`):

```bash
# Activate venv first (macOS/Linux)
source .venv/bin/activate

# Run all tests
pytest tests/ -v
```

Without activating the venv:

```bash
.venv/bin/python -m pytest tests/ -v
```

## Run specific tests

```bash
# One file
pytest tests/test_chunker.py -v

# One test class
pytest tests/test_rag.py::TestCosineSimilarity -v

# One test by name
pytest tests/test_rag.py::TestCosineSimilarity::test_identical_vectors -v

# Tests whose name contains a keyword
pytest tests/ -v -k "chunk"
```

## What’s tested

| File | Functions |
|------|-----------|
| `test_chunker.py` | `chunk_text` |
| `test_rag.py` | `_cosine_similarity`, `_parse_steps_from_response`, `_is_429` |
| `test_recommendations.py` | `_normalize_keywords`, `_parse_top_ids_from_response` |
| `test_keyword_extractor.py` | `_parse_keywords_from_response` |
| `test_quiz_generator.py` | `_parse_quiz_from_response` |
| `test_article_structured.py` | `_extract_json_object`, `_parse_structured_response`, `_is_valid_cached` |
| `test_tip_generator.py` | `should_regenerate_tip` |
| `test_config.py` | `require_env` |
