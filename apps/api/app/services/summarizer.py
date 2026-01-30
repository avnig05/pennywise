"""
Summarizer service for financial education articles.
Uses Google Gemini via LangChain to create concise, educational summaries.
"""

from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import GEMINI_API_KEY, require_env
from app.services.scraper import ScrapedArticle


# Financial education-focused summarization prompt
SUMMARY_PROMPT_TEMPLATE = """You are a financial education expert tasked with creating clear, concise summaries of financial articles for learners.

Your goal is to help people understand key financial concepts from credible sources. Create a summary that:

1. **Extracts the core financial concepts** - What are the main financial topics, strategies, or principles discussed?
2. **Highlights actionable insights** - What can readers learn or apply from this content?
3. **Maintains educational value** - Preserve important details, examples, and explanations that help understanding
4. **Uses clear, accessible language** - Write for a general audience interested in financial literacy
5. **Keeps it concise** - Aim for 3-5 paragraphs that capture the essence without losing critical information

Focus on the educational content and avoid marketing language, disclaimers, or boilerplate text.

Article Title: {title}
Source: {source_name}
{author_info}
{date_info}

Article Content:
{content}

Create a comprehensive yet concise summary suitable for financial education:"""


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
        model="gemini-pro",
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
        # Invoke the LLM with the prompt
        response = llm.invoke(prompt)
        # Extract content from response (LangChain returns AIMessage)
        summary = response.content if hasattr(response, 'content') else str(response)
        summary = summary.strip()
        
        # Optionally truncate if max_length specified
        if max_length and len(summary) > max_length:
            # Truncate at sentence boundary if possible
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

