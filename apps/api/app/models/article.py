from typing import Optional, List, Literal
from pydantic import BaseModel
from datetime import datetime


# categories for finance articles
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


class ArticleBase(BaseModel):
    """base fields for an article."""
    source_url: str
    source_name: str
    title: str
    category: CategoryType
    difficulty: DifficultyType = "beginner"


class ArticleCreate(ArticleBase):
    """used when creating an article from the scraper."""
    original_content: str
    summary: Optional[str] = None


class Article(ArticleBase):
    """full article as stored in the database."""
    id: str
    original_content: str
    summary: Optional[str] = None
    scraped_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class ArticleChunk(BaseModel):
    """a chunk of an article for RAG."""
    id: str
    article_id: str
    chunk_index: int
    content: str
    created_at: Optional[datetime] = None


class ArticleSummary(BaseModel):
    """lightweight article for listing/recommendations."""
    id: str
    title: str
    summary: Optional[str] = None
    category: CategoryType
    difficulty: DifficultyType
    source_name: str


class ArticleWithChunks(Article):
    """Article with its chunks included."""
    chunks: List[ArticleChunk] = []
