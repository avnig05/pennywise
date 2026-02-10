"""
Test classification (category + difficulty) for articles without writing to the DB.
Scrapes each URL, runs the LLM classifier, and prints the result.

Run from apps/api:
  python -m scripts.test_classify --file data/urls.txt
  python -m scripts.test_classify --url "https://example.com/article"
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.scraper import scrape_article
from app.services.summarizer import classify_article


def load_urls(filepath: str) -> list[dict]:
    """Load URLs from file (one per line, or url,category,difficulty). Returns list of {url}."""
    urls = []
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            url = line.split(",")[0].strip()
            urls.append({"url": url})
    return urls


def main():
    parser = argparse.ArgumentParser(
        description="Test category and difficulty classification for articles (no DB write)"
    )
    parser.add_argument(
        "--file", "-f",
        default="data/urls.txt",
        help="Path to file containing URLs",
    )
    parser.add_argument(
        "--url", "-u",
        help="Single URL to test (overrides --file)",
    )
    args = parser.parse_args()

    if args.url:
        urls = [{"url": args.url}]
    else:
        filepath = Path(args.file)
        if not filepath.exists():
            print(f"Error: File not found: {filepath}")
            sys.exit(1)
        urls = load_urls(str(filepath))

    if not urls:
        print("No URLs to process")
        sys.exit(0)

    print("=" * 70)
    print("Classification test (category + difficulty)")
    print("=" * 70)

    for i, item in enumerate(urls, 1):
        url = item["url"]
        print(f"\n[{i}/{len(urls)}] {url}")
        print("  Scraping...")
        scraped = scrape_article(url)
        if not scraped:
            print("  ✗ Failed to scrape")
            continue
        print(f"  Title: {scraped.title[:60]}{'...' if len(scraped.title) > 60 else ''}")
        print("  Classifying...")
        try:
            category, difficulty = classify_article(scraped)
            print(f"  → category={category}, difficulty={difficulty}")
        except Exception as e:
            print(f"  ✗ Classification failed: {e}")

    print("\n" + "=" * 70)
    print("Done")
    print("=" * 70)


if __name__ == "__main__":
    main()
