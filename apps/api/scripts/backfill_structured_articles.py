"""
Pre-generate structured article content (sections + Pennywise commentary) and save to DB.
Run from apps/api: python scripts/backfill_structured_articles.py [--limit N] [--only-missing] [--force ID]

- By default only processes articles that have no structured_content yet.
- Use --force <article_id> to regenerate a single article.
- Use --limit N to cap how many articles to process (e.g. for testing).
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.supabase_client import supabase
from app.services.article_structured import generate_structured_content


def main():
    parser = argparse.ArgumentParser(
        description="Generate structured content for articles and save to DB"
    )
    parser.add_argument(
        "--limit", "-n",
        type=int,
        default=None,
        help="Max number of articles to process",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Process all articles; default is only those missing structured_content",
    )
    parser.add_argument(
        "--force",
        type=str,
        metavar="ARTICLE_ID",
        help="Regenerate structured content for this article ID only",
    )
    args = parser.parse_args()

    if args.force:
        # Single article by ID
        resp = (
            supabase.table("articles")
            .select("id, title, summary, original_content")
            .eq("id", args.force)
            .execute()
        )
        if not resp.data:
            print(f"Article not found: {args.force}")
            sys.exit(1)
        articles = resp.data
    else:
        # List articles (optionally only missing structured_content)
        query = supabase.table("articles").select("id, title, summary, original_content, structured_content")
        if not args.all:
            query = query.is_("structured_content", "null")
        query = query.order("created_at", desc=True)
        if args.limit:
            query = query.limit(args.limit)
        resp = query.execute()
        articles = resp.data or []

    if not articles:
        print("No articles to process.")
        sys.exit(0)

    print(f"Processing {len(articles)} article(s)...")
    ok = 0
    fail = 0
    for row in articles:
        aid = row["id"]
        title = (row.get("title") or "").strip()
        summary = (row.get("summary") or "").strip()
        content = (row.get("original_content") or "")[:5000]
        if not title:
            print(f"  Skip {aid}: no title")
            fail += 1
            continue
        structured = generate_structured_content(title, summary, content)
        if not structured:
            print(f"  Fail {aid}: {title[:50]}...")
            fail += 1
            continue
        supabase.table("articles").update({"structured_content": structured}).eq("id", aid).execute()
        print(f"  OK   {aid}: {title[:50]}...")
        ok += 1

    print(f"Done. OK: {ok}, Failed: {fail}")
    sys.exit(0 if fail == 0 else 1)


if __name__ == "__main__":
    main()
