"""
Backfill NULL embeddings for article_chunks.
Run from apps/api: python -m scripts.backfill_embeddings [--limit N] [--dry-run]
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.supabase_client import supabase
from app.services.embedder import get_embedding


def backfill_embeddings(limit: int = None, dry_run: bool = False) -> dict:
    """
    Find all article_chunks with NULL embeddings and generate them.
    
    Args:
        limit: Max number of chunks to process (None = all)
        dry_run: If True, only report what would be done without updating
    
    Returns:
        dict with processed, failed counts and errors list
    """
    result = {
        "processed": 0,
        "failed": 0,
        "errors": [],
    }
    
    # Query chunks with NULL embeddings
    query = supabase.table("article_chunks").select("id, content, article_id").is_("embedding", "null")
    
    if limit:
        query = query.limit(limit)
    
    response = query.execute()
    chunks = response.data or []
    
    total = len(chunks)
    print(f"Found {total} chunks with NULL embeddings")
    
    if dry_run:
        print("[DRY RUN] Would process these chunks:")
        for chunk in chunks[:10]:
            print(f"  - Chunk {chunk['id']} (article {chunk['article_id']}): {chunk['content'][:50]}...")
        if total > 10:
            print(f"  ... and {total - 10} more")
        return result
    
    for i, chunk in enumerate(chunks, 1):
        chunk_id = chunk["id"]
        content = chunk["content"]
        
        print(f"[{i}/{total}] Processing chunk {chunk_id}...", end=" ")
        
        try:
            embedding = get_embedding(content)
            
            supabase.table("article_chunks").update({
                "embedding": embedding
            }).eq("id", chunk_id).execute()
            
            result["processed"] += 1
            print("✓")
            
        except Exception as e:
            result["failed"] += 1
            result["errors"].append({"id": chunk_id, "error": str(e)})
            print(f"✗ {e}")
    
    return result


def main():
    parser = argparse.ArgumentParser(description="Backfill NULL embeddings for article_chunks")
    parser.add_argument(
        "--limit", "-n",
        type=int,
        default=None,
        help="Max number of chunks to process (default: all)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only show what would be done without making changes"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Backfill Embeddings")
    print("=" * 60)
    
    result = backfill_embeddings(limit=args.limit, dry_run=args.dry_run)
    
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"Processed: {result['processed']}")
    print(f"Failed: {result['failed']}")
    
    if result["errors"]:
        print("\nFailed chunks:")
        for e in result["errors"][:15]:
            print(f"  - Chunk {e['id']}: {e['error']}")
        if len(result["errors"]) > 15:
            print(f"  ... and {len(result['errors']) - 15} more")
    
    sys.exit(0 if result["failed"] == 0 else 1)


if __name__ == "__main__":
    main()
