"""Quick test for scraper and chunker."""

from app.services.scraper import scrape_article
from app.services.chunker import chunk_text

# Test with a sample article URL (replace with one of your URLs)
TEST_URL = "https://financialaidtoolkit.ed.gov/tk/learn/repayment.jsp"

print("=" * 50)
print("Testing Scraper")
print("=" * 50)

article = scrape_article(TEST_URL)

if article:
    print(f"\n✓ Title: {article.title}")
    print(f"✓ Source: {article.source_name}")
    print(f"✓ Author: {article.author}")
    print(f"✓ Date: {article.date}")
    print(f"✓ Content length: {len(article.content)} characters")
    print(f"\n--- First 500 chars of content ---")
    print(article.content[:500])
    
    print("\n" + "=" * 50)
    print("Testing Chunker")
    print("=" * 50)
    
    chunks = chunk_text(article.content)
    print(f"\n✓ Created {len(chunks)} chunks")
    
    for i, chunk in enumerate(chunks[:3]):  # Show first 3 chunks
        print(f"\n--- Chunk {i+1} ({len(chunk)} chars) ---")
        print(chunk[:200] + "..." if len(chunk) > 200 else chunk)
else:
    print("✗ Failed to scrape article")
