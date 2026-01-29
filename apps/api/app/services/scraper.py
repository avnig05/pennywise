"""
Generic article scraper using trafilatura.
Extracts article content from any webpage without site-specific rules.
"""

from typing import Optional
from dataclasses import dataclass
from urllib.parse import urlparse

import trafilatura


@dataclass
class ScrapedArticle:
    """result of scraping an article."""
    url: str
    title: str
    content: str
    author: Optional[str] = None
    date: Optional[str] = None
    source_name: str = ""

    def __post_init__(self):
        # Extract source name from URL if not provided
        if not self.source_name:
            parsed = urlparse(self.url)
            # e.g., "www.investopedia.com" -> "investopedia"
            host = parsed.netloc.replace("www.", "")
            self.source_name = host.split(".")[0]


def scrape_article(url: str) -> Optional[ScrapedArticle]:
    """
    scrape an article from any URL.
    
    Args:
        url: The URL of the article to scrape
        
    Returns:
        ScrapedArticle if successful, None if failed
    """
    try:
        # Fetch the page
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            print(f"Failed to fetch: {url}")
            return None

        # Extract article content
        content = trafilatura.extract(
            downloaded,
            include_comments=False,
            include_tables=False,
            no_fallback=False,
        )
        
        if not content:
            print(f"Failed to extract content: {url}")
            return None

        # Extract metadata (title, author, date)
        metadata = trafilatura.extract_metadata(downloaded)
        
        title = metadata.title if metadata and metadata.title else "Untitled"
        author = metadata.author if metadata else None
        date = metadata.date if metadata else None

        return ScrapedArticle(
            url=url,
            title=title,
            content=content,
            author=author,
            date=date,
        )

    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None


def scrape_articles_from_file(filepath: str) -> list[ScrapedArticle]:
    """
    Scrape multiple articles from a file containing URLs (one per line).
    
    Args:
        filepath: Path to file with URLs
        
    Returns:
        List of successfully scraped articles
    """
    articles = []
    
    with open(filepath, "r") as f:
        urls = [line.strip() for line in f if line.strip() and not line.startswith("#")]
    
    for url in urls:
        print(f"Scraping: {url}")
        article = scrape_article(url)
        if article:
            articles.append(article)
            print(f"  ✓ {article.title}")
        else:
            print(f"  ✗ Failed")
    
    return articles
