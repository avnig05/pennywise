"""
CLI script to ingest articles from urls.txt through the full pipeline.
Runs: scrape → summarize → chunk → embed → save to Supabase
"""

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.supabase_client import supabase
from app.services.scraper import scrape_article
from app.services.summarizer import summarize_article
from app.services.chunker import chunk_text
from app.services.embedder import get_embedding


def ingest_single_article(url: str, category: str, difficulty: str = "beginner", update_existing: bool = False) -> dict:
    """
    Ingest a single article through the full pipeline.
    If update_existing is True and the article already exists (same source_url), update it and re-run summary/chunks.
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
    
    # Step 1: Scrape
    print(f"  Scraping...")
    scraped = scrape_article(url)
    if not scraped:
        result["error"] = "Failed to scrape article"
        return result
    
    result["title"] = scraped.title
    print(f"  ✓ Scraped: {scraped.title}")
    
    # Step 2: Create or get article row
    print(f"  Saving to database...")
    article_id = None
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
            if update_existing:
                existing = supabase.table("articles").select("id").eq("source_url", url).execute()
                if existing.data and len(existing.data) > 0:
                    article_id = existing.data[0]["id"]
                    supabase.table("articles").update({
                        "source_name": scraped.source_name,
                        "title": scraped.title,
                        "original_content": scraped.content,
                        "category": category,
                        "difficulty": difficulty,
                        "scraped_at": datetime.now(timezone.utc).isoformat(),
                    }).eq("id", article_id).execute()
                    supabase.table("article_chunks").delete().eq("article_id", article_id).execute()
                    print(f"  ✓ Updating existing article {article_id}")
                else:
                    result["error"] = "Article already exists (could not look up id)"
                    return result
            else:
                result["error"] = "Article already exists (use --update-existing to refresh)"
                return result
        else:
            result["error"] = f"Database error: {e}"
            return result
    
    # Step 3: Generate summary
    print(f"  Generating summary...")
    try:
        summary = summarize_article(scraped)
        supabase.table("articles").update({"summary": summary}).eq("id", article_id).execute()
        print(f"  ✓ Summary generated")
    except Exception as e:
        print(f"  ⚠ Summary failed: {e}")
    
    # Step 4: Chunk and embed
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
    1. Simple: one URL per line
    2. With category: url,category,difficulty (CSV-like)
    
    Returns list of dicts with url, category, difficulty
    """
    urls = []
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            
            # Check if it's CSV format
            if "," in line:
                parts = line.split(",")
                urls.append({
                    "url": parts[0].strip(),
                    "category": parts[1].strip() if len(parts) > 1 else "budgeting",
                    "difficulty": parts[2].strip() if len(parts) > 2 else "beginner",
                })
            else:
                urls.append({
                    "url": line,
                    "category": "budgeting",  # default
                    "difficulty": "beginner",
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
        default="budgeting",
        help="Category for articles (default: budgeting)"
    )
    parser.add_argument(
        "--difficulty", "-d",
        default="beginner",
        choices=["beginner", "intermediate", "advanced"],
        help="Difficulty level (default: beginner)"
    )
    parser.add_argument(
        "--update-existing",
        action="store_true",
        help="If an article with the same URL already exists, update it (re-scrape, re-summarize, re-chunk)"
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
    
    print(f"\nProcessing {len(urls)} article(s)...\n")
    
    # Process each URL
    results = {"success": [], "failed": []}
    
    for i, url_info in enumerate(urls, 1):
        print(f"[{i}/{len(urls)}] {url_info['url']}")
        result = ingest_single_article(
            url_info["url"],
            url_info["category"],
            url_info["difficulty"]
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
