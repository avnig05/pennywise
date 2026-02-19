"""
Summarizer service for financial education articles.
Uses Google Gemini via LangChain to create concise, educational summaries.
Also provides LLM-based classification for category and difficulty.
"""

import re
from typing import Optional, Tuple

from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import GEMINI_API_KEY, require_env
from app.services.scraper import ScrapedArticle

# Valid values for classification (must match app.models.article)
CATEGORIES = [
    "budgeting", "investing", "credit cards", "credit score",
    "student loans", "debt management", "taxes", "savings", "banking",
]
DIFFICULTIES = ["beginner", "intermediate", "advanced"]

CLASSIFY_PROMPT_TEMPLATE = """You are classifying a financial education article. Based on the title and content below, choose exactly one category and one difficulty.
Categories (pick one): budgeting, investing, credit cards, credit score, student loans, debt management, taxes, savings, banking
Difficulty (pick one): beginner = introductory/basic, intermediate = some finance knowledge, advanced = assumes familiarity or specialized terms
Respond with exactly these two lines, nothing else:
Category: <one word from the list above, e.g. credit cards>
Difficulty: <beginner or intermediate or advanced>

Article Title: {title}

Article Content (excerpt):
{content_excerpt}
"""


# Financial education-focused summarization prompt
SUMMARY_PROMPT_TEMPLATE = """You are writing for college students, new graduates, and working adults who want to understand financial topics clearly. Your summary should cover a substantial amount of the article—the reader should get a thorough overview of the main points, sections, and important details without having to read the full piece.

Use plain, professional language that is easy to read but not oversimplified. Avoid academic or legal-style phrasing.

Formatting rules (must follow so the summary looks good on screen):
- Write 6-8 paragraphs so the summary thoroughly covers the article. Separate each paragraph with a blank line (use exactly two newlines between paragraphs).
- Start with one or two sentences that state the main idea or takeaway, then add paragraphs for each major section or theme in the article.
- Each paragraph: 2–4 sentences. Be clear and direct but include enough detail to convey the point. Do not skip important sub-points.
- Use line breaks to create breathing room—no wall of text. The summary should still feel scannable.
- If the article has steps, tips, or a list of factors, include them (as short bullet-style lines with "• " or "- ", or as 2–3 short sentences).
- Avoid jargon; if a financial term is needed, briefly explain it in parentheses or in the next few words.

Content rules—cover the article thoroughly:
1) Clearly explain the main financial concept and why it matters.
2) Include key definitions, numbers, thresholds, or rules the article mentions.
3) Break down important factors, options, or trade-offs and how they compare.
4) Include step-by-step or process information when the article provides it.
5) Add practical implications: what to do, what to avoid, where to go for more.
6) Do not leave out major sections or subsections that add real value—the summary should reflect a good amount of the original content.

Avoid marketing language, disclaimers, and filler phrases. Omit only tangents and redundancy.

Article Title: {title}
Source: {source_name}
{author_info}
{date_info}

Article Content:
{content}

Write a thorough, well-formatted summary that covers a good amount of the article and is easy to read. Use blank lines between paragraphs:"""


def create_summarizer_llm(temperature: float = 0.3) -> ChatGoogleGenerativeAI:
    """
    Create a configured Google Gemini LLM instance for summarization.
    
    Args:
        temperature: Controls randomness (0.0 = deterministic, 1.0 = creative)
                    Lower values (0.2-0.4) work better for factual summarization
        
    Returns:
        Configured ChatGoogleGenerativeAI instance
    """
    api_key = require_env("GEMINI_API_KEY", GEMINI_API_KEY)
    
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=temperature,
    )


def summarize_article(
    article: ScrapedArticle,
    max_length: Optional[int] = None,
    temperature: float = 0.3,
) -> str:
    """
    Summarize a scraped article using Google Gemini LLM.
    
    Args:
        article: The ScrapedArticle to summarize
        max_length: Optional maximum character length for the summary
        temperature: LLM temperature (0.0-1.0), lower = more focused
        
    Returns:
        A concise summary string optimized for financial education
        
    Raises:
        RuntimeError: If GEMINI_API_KEY is not configured
        Exception: If LLM call fails
    """
    # Build the prompt with article metadata
    author_info = f"Author: {article.author}\n" if article.author else ""
    date_info = f"Published: {article.date}\n" if article.date else ""
    
    prompt = SUMMARY_PROMPT_TEMPLATE.format(
        title=article.title,
        source_name=article.source_name,
        author_info=author_info,
        date_info=date_info,
        content=article.content,
    )
    
    # Initialize LLM and generate summary
    llm = create_summarizer_llm(temperature=temperature)
    
    try:
        response = llm.invoke(prompt)
        summary = response.content if hasattr(response, 'content') else str(response)
        summary = summary.strip()
        
        if max_length and len(summary) > max_length:
            truncated = summary[:max_length]
            last_period = truncated.rfind(".")
            if last_period > max_length * 0.8:  # Only if we're not cutting too much
                summary = truncated[:last_period + 1]
            else:
                summary = truncated + "..."
        
        return summary
        
    except Exception as e:
        raise Exception(f"Failed to generate summary: {e}")


def summarize_content(
    content: str,
    title: str = "Untitled",
    source_name: str = "Unknown Source",
    author: Optional[str] = None,
    date: Optional[str] = None,
    max_length: Optional[int] = None,
    temperature: float = 0.3,
) -> str:
    """
    Summarize raw article content (convenience function if you don't have a ScrapedArticle).
    
    Args:
        content: The article content text to summarize
        title: Article title
        source_name: Name of the source/publication
        author: Optional author name
        date: Optional publication date
        max_length: Optional maximum character length for the summary
        temperature: LLM temperature (0.0-1.0)
        
    Returns:
        A concise summary string optimized for financial education
    """
    # Create a minimal ScrapedArticle for the summarizer
    article = ScrapedArticle(
        url="",  # Not needed for summarization
        title=title,
        content=content,
        author=author,
        date=date,
        source_name=source_name,
    )
    
    return summarize_article(article, max_length=max_length, temperature=temperature)


def classify_article(
    article: ScrapedArticle,
    content_max_chars: int = 4000,
    temperature: float = 0.1,
) -> Tuple[str, str]:
    """
    Classify a scraped article into category and difficulty using the LLM.

    Args:
        article: The ScrapedArticle to classify
        content_max_chars: Max characters of content to send (to stay within token limits)
        temperature: Low value for consistent classification

    Returns:
        (category, difficulty) where category is one of CATEGORIES and difficulty is one of DIFFICULTIES
    """
    excerpt = (article.content or "")[:content_max_chars].strip()
    if not excerpt:
        # Explicit signal that we could not classify (no silent defaults)
        return "", ""

    prompt = CLASSIFY_PROMPT_TEMPLATE.format(
        title=article.title or "Untitled",
        content_excerpt=excerpt,
    )
    llm = create_summarizer_llm(temperature=temperature)
    try:
        response = llm.invoke(prompt)
    except Exception as e:
        # If classification completely fails, fall back to safe defaults
        raise Exception(f"Failed to classify article: {e}")

    # LangChain can return content as str or list of blocks
    content = response.content if hasattr(response, "content") else str(response)
    if isinstance(content, list):
        raw = " ".join(
            (c.get("text", "") if isinstance(c, dict) else str(c) for c in content)
        )
    else:
        raw = str(content)
    raw = raw.strip()


    cat_match = re.search(r"^category\s*:\s*([^\r\n]+)\s*$", raw, re.I | re.M)
    diff_match = re.search(r"^difficulty\s*:\s*([^\r\n]+)\s*$", raw, re.I | re.M)
    raw_category = cat_match.group(1).strip().lower() if cat_match else ""
    raw_difficulty = diff_match.group(1).strip().lower() if diff_match else ""

    # Extra safety: if model returned multiple lines anyway, keep only first line.
    raw_category = raw_category.splitlines()[0].strip() if raw_category else ""
    raw_difficulty = raw_difficulty.splitlines()[0].strip() if raw_difficulty else ""

    # If we couldn't even parse either field, explicitly signal failure
    if not raw_category or not raw_difficulty:
        return "", ""

    return raw_category, raw_difficulty

