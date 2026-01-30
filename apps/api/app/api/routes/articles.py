"""
Article ingestion route.
Orchestrates scraping, summarizing, and chunking of articles.
"""

from typing import Optional, Literal, List
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.supabase_client import supabase
from app.services.scraper import scrape_article
from app.services.summarizer import summarize_article
from app.services.chunker import chunk_text

router = APIRouter(prefix="/articles", tags=["articles"])


# Request/Response models
CategoryType = Literal[
    "budgeting",
    "investing",
    "credit_cards",
    "building_credit",
    "student_loans",
    "debt_management",
    "taxes",
    "savings",
]

DifficultyType = Literal["beginner", "intermediate", "advanced"]


class ArticleIngestRequest(BaseModel):
    """Request body for ingesting a new article."""
    source_url: str
    category: CategoryType
    difficulty: DifficultyType = "beginner"


class ArticleIngestResponse(BaseModel):
    """Response after successfully ingesting an article."""
    id: str
    title: str
    source_url: str
    source_name: str
    category: str
    difficulty: str
    summary: Optional[str] = None
    chunks_created: int


class BulkIngestRequest(BaseModel):
    """Request body for bulk article ingestion."""
    articles: List[ArticleIngestRequest]


class BulkIngestResponse(BaseModel):
    """Response after bulk ingestion."""
    successful: List[ArticleIngestResponse]
    failed: List[dict]


@router.post("/ingest", response_model=ArticleIngestResponse)
def ingest_article(request: ArticleIngestRequest):
    """
    Ingest a single article through the full pipeline:
    1. Create initial article row in database
    2. Scrape the article content
    3. Update article with scraped content
    4. Generate AI summary
    5. Update article with summary
    6. Chunk the content and store chunks
    """
    
    # Step 1: Create initial article row
    initial_data = {
        "source_url": request.source_url,
        "category": request.category,
        "difficulty": request.difficulty,
        "title": "Pending...",  # Placeholder until scraped
        "source_name": "",
        "original_content": "",
    }
    
    try:
        insert_resp = supabase.table("articles").insert(initial_data).execute()
        if not insert_resp.data:
            raise HTTPException(status_code=500, detail="Failed to create article row")
        article_row = insert_resp.data[0]
        article_id = article_row["id"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insert failed: {e}")
    
    # Step 2: Scrape the article
    try:
        scraped = scrape_article(request.source_url)
        if not scraped:
            # Clean up the row we created
            supabase.table("articles").delete().eq("id", article_id).execute()
            raise HTTPException(status_code=400, detail=f"Failed to scrape article from {request.source_url}")
    except HTTPException:
        raise
    except Exception as e:
        supabase.table("articles").delete().eq("id", article_id).execute()
        raise HTTPException(status_code=500, detail=f"Scraping error: {e}")
    
    # Step 3: Update article with scraped content
    scraped_data = {
        "title": scraped.title,
        "source_name": scraped.source_name,
        "original_content": scraped.content,
        "scraped_at": datetime.utcnow().isoformat(),
    }
    
    try:
        supabase.table("articles").update(scraped_data).eq("id", article_id).execute()
    except Exception as e:
        supabase.table("articles").delete().eq("id", article_id).execute()
        raise HTTPException(status_code=500, detail=f"Failed to update article with scraped content: {e}")
    
    # Step 4: Generate AI summary
    summary = None
    try:
        summary = summarize_article(scraped)
    except Exception as e:
        # Log but don't fail - summary is optional
        print(f"Warning: Failed to generate summary for article {article_id}: {e}")
    
    # Step 5: Update article with summary
    if summary:
        try:
            supabase.table("articles").update({"summary": summary}).eq("id", article_id).execute()
        except Exception as e:
            print(f"Warning: Failed to save summary for article {article_id}: {e}")
    
    # Step 6: Chunk the content and store chunks
    chunks_created = 0
    try:
        chunks = chunk_text(scraped.content)
        chunk_rows = [
            {
                "article_id": article_id,
                "chunk_index": idx,
                "content": chunk_content,
            }
            for idx, chunk_content in enumerate(chunks)
        ]
        
        if chunk_rows:
            chunk_resp = supabase.table("article_chunks").insert(chunk_rows).execute()
            chunks_created = len(chunk_resp.data) if chunk_resp.data else 0
    except Exception as e:
        print(f"Warning: Failed to create chunks for article {article_id}: {e}")
    
    return ArticleIngestResponse(
        id=article_id,
        title=scraped.title,
        source_url=request.source_url,
        source_name=scraped.source_name,
        category=request.category,
        difficulty=request.difficulty,
        summary=summary,
        chunks_created=chunks_created,
    )


@router.post("/ingest/bulk", response_model=BulkIngestResponse)
def ingest_articles_bulk(request: BulkIngestRequest):
    """
    Ingest multiple articles. Processes each article independently,
    collecting successes and failures.
    """
    successful = []
    failed = []
    
    for article_req in request.articles:
        try:
            result = ingest_article(article_req)
            successful.append(result)
        except HTTPException as e:
            failed.append({
                "source_url": article_req.source_url,
                "error": e.detail,
            })
        except Exception as e:
            failed.append({
                "source_url": article_req.source_url,
                "error": str(e),
            })
    
    return BulkIngestResponse(successful=successful, failed=failed)


@router.get("")
def list_articles(
    category: Optional[CategoryType] = None,
    difficulty: Optional[DifficultyType] = None,
    limit: int = 50,
):
    """List articles with optional filtering."""
    query = supabase.table("articles").select(
        "id, title, source_url, source_name, category, difficulty, summary, scraped_at, created_at"
    )
    
    if category:
        query = query.eq("category", category)
    if difficulty:
        query = query.eq("difficulty", difficulty)
    
    query = query.order("created_at", desc=True).limit(limit)
    
    resp = query.execute()
    return resp.data or []


@router.get("/{article_id}")
def get_article(article_id: str):
    """Get a single article by ID."""
    resp = supabase.table("articles").select("*").eq("id", article_id).execute()
    
    if not resp.data:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return resp.data[0]


@router.get("/{article_id}/chunks")
def get_article_chunks(article_id: str):
    """Get all chunks for an article."""
    # Verify article exists
    article_resp = supabase.table("articles").select("id").eq("id", article_id).execute()
    if not article_resp.data:
        raise HTTPException(status_code=404, detail="Article not found")
    
    chunks_resp = (
        supabase.table("article_chunks")
        .select("id, chunk_index, content, created_at")
        .eq("article_id", article_id)
        .order("chunk_index")
        .execute()
    )
    
    return chunks_resp.data or []

