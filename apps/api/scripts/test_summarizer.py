"""
Quick script to test the summarizer: scrape a URL and print the generated summary.
Run from apps/api: python scripts/test_summarizer.py [url]

Requires: .env with GEMINI_API_KEY. Optional: pass a URL (defaults to a CFPB article).
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.scraper import scrape_article
from app.services.summarizer import summarize_article


DEFAULT_URL = "https://www.consumerfinance.gov/ask-cfpb/what-is-a-credit-score-en-315/"


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    print(f"URL: {url}\n")
    print("Scraping...")
    scraped = scrape_article(url)
    if not scraped:
        print("Failed to scrape.")
        sys.exit(1)
    print(f"Title: {scraped.title}\n")
    print("Summarizing (Gemini)...")
    try:
        summary = summarize_article(scraped)
        print("\n--- Summary ---\n")
        print(summary)
        print("\n--- End ---")
    except Exception as e:
        print(f"Summarizer error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
