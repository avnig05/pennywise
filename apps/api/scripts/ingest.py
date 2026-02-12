"""
CLI script to ingest articles from urls.txt through the full pipeline.
Runs: scrape → summarize → chunk → embed → save to Supabase
"""

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.supabase_client import supabase
from app.services.scraper import scrape_article, ScrapedArticle
from app.services.summarizer import summarize_article, classify_article
from app.services.chunker import chunk_text
from app.services.embedder import get_embedding


def ingest_single_article(
    url: str,
    category: Optional[str],
    difficulty: Optional[str],
    update_existing: bool = False,
    auto_classify: bool = False,
    no_embeddings: bool = False,
) -> dict:
    """
    Ingest a single article through the full pipeline.
    If update_existing is True and the article already exists (same source_url), update it and re-run summary/chunks.
    If auto_classify is True, category and difficulty are inferred from content via LLM (overrides provided values).
    Returns:
        dict with results or error info
    """
    result = {
        "url": url,
        "success": False,
        "title": None,
        "chunks_created": 0,
        "error": None,
    }
    
    # Step 0: Check DB first so we don't re-scrape existing URLs
    existing_row = None
    try:
        existing_resp = (
            supabase.table("articles")
            .select("id, title, original_content, source_name, category, difficulty")
            .eq("source_url", url)
            .limit(1)
            .execute()
        )
        if existing_resp.data and len(existing_resp.data) > 0:
            existing_row = existing_resp.data[0]
    except Exception as e:
        # If DB lookup fails, fall back to scraping path
        print(f"  ⚠ DB lookup failed (will scrape): {e}")

    article_id = existing_row["id"] if existing_row else None

    if existing_row:
        result["title"] = existing_row.get("title")
        if not update_existing:
            print("  ✓ Already in database (skipping scrape; use --update-existing to refresh)")
            result["success"] = True
            return result

        scraped = ScrapedArticle(
            url=url,
            title=existing_row.get("title") or "Untitled",
            content=existing_row.get("original_content") or "",
            source_name=existing_row.get("source_name") or "",
        )
        print(f"  Using stored content (no rescrape): {scraped.title}")
    else:
        # Step 1: Scrape (only when not already in DB)
        print(f"  Scraping...")
        scraped = scrape_article(url)
        if not scraped:
            result["error"] = "Failed to scrape article"
            return result

        result["title"] = scraped.title
        print(f"  ✓ Scraped: {scraped.title}")
    
    # Step 1b: Require category/difficulty unless auto_classify
    if not auto_classify:
        if not category or not difficulty:
            result["error"] = "category and difficulty are required (provide via file as url,category,difficulty or use --category/--difficulty, or use --auto-classify)"
            return result

    # Optionally classify from content (so we get varied category/difficulty per article)
    if auto_classify:
        print(f"  Classifying category and difficulty...")
        try:
            category, difficulty = classify_article(scraped)
            print(f"  ✓ Classified: category={category}, difficulty={difficulty}")
        except Exception as e:
            result["error"] = f"Classification failed: {e}"
            return result
        if not category or not difficulty:
            result["error"] = "Classification did not return category or difficulty"
            return result
    
    # Step 2: Create or get article row
    if article_id is None:
        print(f"  Saving to database...")
        try:
            article_data = {
                "source_url": url,
                "source_name": scraped.source_name,
                "title": scraped.title,
                "original_content": scraped.content,
                "category": category,
                "difficulty": difficulty,
                "scraped_at": datetime.now(timezone.utc).isoformat(),
            }
            insert_resp = supabase.table("articles").insert(article_data).execute()
            if not insert_resp.data:
                result["error"] = "Failed to insert article"
                return result
            article_id = insert_resp.data[0]["id"]
        except Exception as e:
            if "duplicate key" in str(e).lower() or "already exists" in str(e).lower():
                result["error"] = "Article already exists (use --update-existing to refresh)"
                return result
            result["error"] = f"Database error: {e}"
            return result
    else:
        # Existing article (update_existing=True): update metadata and re-generate chunks from stored content.
        print(f"  Updating article...")
        supabase.table("articles").update({
            "category": category,
            "difficulty": difficulty,
        }).eq("id", article_id).execute()
        if no_embeddings:
            print("  Skipping chunk deletion (--no-embeddings)")
        else:
            supabase.table("article_chunks").delete().eq("article_id", article_id).execute()
    
    # Step 3: Generate summary
    print(f"  Generating summary...")
    try:
        summary = summarize_article(scraped)
        supabase.table("articles").update({"summary": summary}).eq("id", article_id).execute()
        print(f"  ✓ Summary generated")
    except Exception as e:
        print(f"  ⚠ Summary failed: {e}")
    
    # Step 4: Chunk and embed (optional)
    if no_embeddings:
        print("  Skipping chunking/embeddings (--no-embeddings)")
    else:
        print(f"  Chunking and embedding...")
        try:
            chunks = chunk_text(scraped.content)
            chunk_rows = []
            
            for idx, chunk_content in enumerate(chunks):
                try:
                    embedding = get_embedding(chunk_content)
                except Exception as e:
                    print(f"  ⚠ Embedding failed for chunk {idx}: {e}")
                    embedding = None
                
                chunk_rows.append({
                    "article_id": article_id,
                    "chunk_index": idx,
                    "content": chunk_content,
                    "embedding": embedding,
                })
            
            if chunk_rows:
                supabase.table("article_chunks").insert(chunk_rows).execute()
                result["chunks_created"] = len(chunk_rows)
                print(f"  ✓ Created {len(chunk_rows)} chunks with embeddings")
        except Exception as e:
            print(f"  ⚠ Chunking failed: {e}")
    
    result["success"] = True
    return result


def load_urls_from_file(filepath: str) -> list[dict]:
    """
    Load URLs from a file. Supports two formats:
    1. One URL per line → category and difficulty are None (use --auto-classify or add columns).
    2. url,category,difficulty (CSV-like) → missing columns are None.
    
    Returns list of dicts with url, category, difficulty (category/difficulty may be None).
    """
    urls = []
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            
            # Check if it's CSV format: url,category,difficulty (no defaults)
            if "," in line:
                parts = line.split(",")
                urls.append({
                    "url": parts[0].strip(),
                    "category": parts[1].strip() if len(parts) > 1 else None,
                    "difficulty": parts[2].strip() if len(parts) > 2 else None,
                })
            else:
                urls.append({
                    "url": line,
                    "category": None,
                    "difficulty": None,
                })
    
    return urls


def main():
    parser = argparse.ArgumentParser(description="Ingest articles from URLs into the database")
    parser.add_argument(
        "--file", "-f",
        default="data/urls.txt",
        help="Path to file containing URLs (default: data/urls.txt)"
    )
    parser.add_argument(
        "--url", "-u",
        help="Single URL to ingest (overrides --file)"
    )
    parser.add_argument(
        "--category", "-c",
        help="Category for article (required for single URL unless --auto-classify)"
    )
    parser.add_argument(
        "--difficulty", "-d",
        choices=["beginner", "intermediate", "advanced"],
        help="Difficulty level (required for single URL unless --auto-classify)"
    )
    parser.add_argument(
        "--update-existing",
        action="store_true",
        help="If an article with the same URL already exists, refresh summary/chunks (no rescrape; uses stored content)"
    )
    parser.add_argument(
        "--auto-classify",
        action="store_true",
        help="Use LLM to infer category and difficulty from article content (instead of defaults or file/CLI values)"
    )
    parser.add_argument(
        "--no-embeddings",
        dest="no_embeddings",
        action="store_true",
        help="Skip chunking + embedding generation (saves Gemini quota). Also avoids deleting existing chunks on --update-existing."
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Article Ingestion Pipeline")
    print("=" * 60)
    
    # Determine URLs to process
    if args.url:
        urls = [{"url": args.url, "category": args.category, "difficulty": args.difficulty}]
    else:
        filepath = Path(args.file)
        if not filepath.exists():
            print(f"Error: File not found: {filepath}")
            sys.exit(1)
        urls = load_urls_from_file(str(filepath))
    
    if not urls:
        print("No URLs to process")
        sys.exit(0)

    # Require category and difficulty for every item when not using --auto-classify
    if not args.auto_classify:
        missing = [
            (i + 1, u["url"]) for i, u in enumerate(urls)
            if not u.get("category") or not u.get("difficulty")
        ]
        if missing:
            print("Error: category and difficulty are required when not using --auto-classify.")
            print("Either use --auto-classify, or provide url,category,difficulty per line in the file, or use -u URL -c CATEGORY -d DIFFICULTY for a single URL.")
            for idx, u in missing:
                print(f"  Missing for [{idx}]: {u}")
            sys.exit(1)

    print(f"\nProcessing {len(urls)} article(s)...\n")
    
    # Process each URL
    results = {"success": [], "failed": []}
    
    for i, url_info in enumerate(urls, 1):
        print(f"[{i}/{len(urls)}] {url_info['url']}")
        result = ingest_single_article(
            url_info["url"],
            url_info["category"],
            url_info["difficulty"],
            update_existing=args.update_existing,
            auto_classify=args.auto_classify,
            no_embeddings=args.no_embeddings,
        )
        
        if result["success"]:
            results["success"].append(result)
            print(f"  ✓ Success!\n")
        else:
            results["failed"].append(result)
            print(f"  ✗ Failed: {result['error']}\n")
    
    # Summary
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"Successful: {len(results['success'])}")
    print(f"Failed: {len(results['failed'])}")
    
    if results["failed"]:
        print("\nFailed articles:")
        for r in results["failed"]:
            print(f"  - {r['url']}: {r['error']}")


if __name__ == "__main__":
    main()
