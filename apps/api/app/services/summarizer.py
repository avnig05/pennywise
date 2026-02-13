"""
Summarizer service for financial education articles.
Uses either Google Gemini or a local Ollama model to create concise, educational summaries.
Also provides LLM-based classification for category and difficulty.
"""

import json
import re
from typing import Optional, Tuple

import httpx

from app.core.config import AI_PROVIDER, GEMINI_API_KEY, OLLAMA_BASE_URL, OLLAMA_MODEL, require_env
from app.services.scraper import ScrapedArticle

# Valid values for classification (must match app.models.article)
CATEGORIES = [
    "budgeting",
    "investing",
    "credit_cards",
    "building_credit",
    "student_loans",
    "debt_management",
    "taxes",
    "savings",
]
DIFFICULTIES = ["beginner", "intermediate", "advanced"]

CLASSIFY_PROMPT_TEMPLATE = """You are classifying a financial education article. Based on the title and content below, choose exactly one category and one difficulty.
Categories (pick one): budgeting, investing, credit cards, credit score, student loans, debt management, taxes, savings
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
- Write 8–12 paragraphs so the summary thoroughly covers the article. Separate each paragraph with a blank line (use exactly two newlines between paragraphs).
- Start with one or two sentences that state the main idea or takeaway, then add paragraphs for each major section or theme in the article.
- Each paragraph: 2–4 sentences. Be clear and direct but include enough detail to convey the point. Do not skip important sub-points.
- Use line breaks to create breathing room—no wall of text. The summary should still feel scannable.
- Do NOT use Markdown. No headings, no bold/italics, no numbered lists, and no bullet points.
- If the article has steps, tips, or a list of factors, include them as plain sentences (e.g., “Key factors include …, …, and ….”).
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


def _effective_provider() -> str:
    """
    Choose provider:
    - if AI_PROVIDER set, use it
    - else: gemini if key present, otherwise ollama
    """
    if AI_PROVIDER:
        return AI_PROVIDER
    return "gemini" if GEMINI_API_KEY else "ollama"


def _generate_with_ollama(prompt: str, temperature: float) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "options": {"temperature": temperature},
    }
    with httpx.Client(timeout=180.0) as client:
        r = client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
        r.raise_for_status()
        data = r.json()
    return str(((data.get("message") or {}).get("content")) or "").strip()


def _generate_with_gemini(prompt: str, temperature: float) -> str:
    api_key = require_env("GEMINI_API_KEY", GEMINI_API_KEY)
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
    except Exception as e:
        raise RuntimeError(f"Gemini provider requires langchain-google-genai: {e}")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite",
        google_api_key=api_key,
        temperature=temperature,
    )
    response = llm.invoke(prompt)
    return (response.content if hasattr(response, "content") else str(response)).strip()


def _generate(prompt: str, temperature: float) -> str:
    provider = _effective_provider()
    if provider == "ollama":
        return _generate_with_ollama(prompt, temperature=temperature)
    if provider == "gemini":
        return _generate_with_gemini(prompt, temperature=temperature)
    raise RuntimeError(f"Unsupported AI_PROVIDER: {provider} (expected 'ollama' or 'gemini')")


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

    try:
        summary = _generate(prompt, temperature=temperature).strip()

        # Safety: if the model still returns markdown-ish formatting, strip the most common markers.
        # We keep newlines (paragraph breaks) intact.
        summary = re.sub(r"^\s*#{1,6}\s+", "", summary, flags=re.M)  # headings
        summary = summary.replace("**", "").replace("__", "").replace("*", "")
        summary = re.sub(r"^\s*[-•]\s+", "", summary, flags=re.M)  # bullets
        
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
    raw = _generate(prompt, temperature=temperature).strip()

    # Extract JSON blob if the model wrapped it in extra text/code blocks
    start = raw.find("{")
    if start != -1:
        depth = 0
        for i in range(start, len(raw)):
            if raw[i] == "{":
                depth += 1
            elif raw[i] == "}":
                depth -= 1
                if depth == 0:
                    raw = raw[start : i + 1]
                    break

    data = None
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        try:
            data = json.loads(raw.replace("'", '"'))
        except json.JSONDecodeError:
            data = None

    if not isinstance(data, dict):
        cat_match = re.search(r'["\']category["\']\s*:\s*["\']([^"\']+)["\']', raw, re.I)
        diff_match = re.search(r'["\']difficulty["\']\s*:\s*["\']([^"\']+)["\']', raw, re.I)
        category = (cat_match.group(1).strip().lower() if cat_match else "budgeting")
        difficulty = (diff_match.group(1).strip().lower() if diff_match else "beginner")
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

