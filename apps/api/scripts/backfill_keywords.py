"""
Backfill the keywords column for all articles using the LLM.
Run from apps/api: python scripts/backfill_keywords.py [--limit N] [--debug]
  --debug: print LLM raw response when no keywords are extracted (to diagnose parsing)
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.keyword_extractor import extract_keywords_for_all_articles


def main():
    parser = argparse.ArgumentParser(description="Extract keywords for articles using LLM")
    parser.add_argument("--limit", "-n", type=int, default=None, help="Max number of articles to process")
    parser.add_argument("--debug", action="store_true", help="Show LLM response when keywords are empty")
    args = parser.parse_args()
    print("Extracting keywords with LLM for all articles...")
    result = extract_keywords_for_all_articles(limit=args.limit, debug=args.debug)
    print(f"Processed: {result['processed']}, Skipped (no keywords): {result.get('skipped', 0)}, Failed: {result['failed']}")
    if result["errors"]:
        for e in result["errors"][:15]:
            print(f"  - {e.get('id')}: {e['error']}")
        if len(result["errors"]) > 15:
            print(f"  ... and {len(result['errors']) - 15} more")
    sys.exit(0 if result["failed"] == 0 else 1)


if __name__ == "__main__":
    main()
