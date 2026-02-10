from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from bs4 import BeautifulSoup
from markdownify import markdownify as md
from pydantic import BaseModel, HttpUrl, Field
from playwright.async_api import async_playwright
from readability import Document

router = APIRouter()


def _safe_slug(url: str, max_len: int = 80) -> str:
    # Prefer a readable slug, but ensure uniqueness via a short hash suffix.
    base = re.sub(r"^https?://", "", url.strip(), flags=re.IGNORECASE)
    base = re.sub(r"[^\w\-\.]+", "_", base)
    base = base.strip("._-")[:max_len].strip("._-") or "page"
    h = hashlib.sha256(url.encode("utf-8")).hexdigest()[:12]
    return f"{base}__{h}"


def _output_dir(subdir: Optional[str] = None) -> Path:
    # Defaults to apps/api/.scrapes (kept inside api project root).
    api_root = Path(__file__).resolve().parents[3]  # .../apps/api
    root = Path(api_root / ".scrapes")
    root.mkdir(parents=True, exist_ok=True)

    if subdir:
        # keep it simple and safe (no path traversal)
        safe = re.sub(r"[^\w\-]+", "_", subdir).strip("_")[:60] or "run"
        out = root / safe
    else:
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        out = root / ts
    out.mkdir(parents=True, exist_ok=True)
    return out


def _clean_html_for_markdown(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")

    # Drop obvious non-content / boilerplate.
    for tag in soup.select(
        "script, style, noscript, nav, footer, header, aside, form, iframe, svg, canvas, button, input, select, textarea"
    ):
        tag.decompose()

    # Prefer <main> or <article> if present.
    main = soup.find("main") or soup.find("article") or soup.body or soup

    # Remove empty containers.
    for el in main.find_all(["div", "section"], recursive=True):
        if not el.get_text(strip=True) and not el.find(["img", "table", "pre", "code", "a"]):
            el.decompose()

    return str(main)


def _extract_main_html(rendered_html: str) -> tuple[Optional[str], str]:
    """
    Use Readability to extract the primary content (article-like pages).
    Falls back to cleaned body/main HTML if extraction fails.
    """
    try:
        doc = Document(rendered_html)
        title = (doc.short_title() or "").strip() or None
        summary_html = doc.summary(html_partial=True) or ""
        summary_html = summary_html.strip()
        if summary_html:
            return title, _clean_html_for_markdown(summary_html)
    except Exception:
        pass

    return None, _clean_html_for_markdown(rendered_html)


def _postprocess_markdown(markdown: str) -> str:
    # Normalize whitespace for LLM ingestion.
    markdown = markdown.replace("\r\n", "\n").replace("\r", "\n")
    markdown = re.sub(r"[ \t]+\n", "\n", markdown)
    markdown = re.sub(r"\n{3,}", "\n\n", markdown).strip()
    return markdown + "\n"


class ScrapeRequest(BaseModel):
    urls: List[HttpUrl] = Field(..., min_length=1, description="List of http(s) URLs to scrape")
    output_subdir: Optional[str] = Field(
        default=None,
        description="Optional subdirectory name under apps/api/.scrapes",
    )
    extract_main: bool = Field(
        default=True,
        description="Attempt to extract primary/main content (Readability) for more LLM-ready markdown",
    )
    wait_until: str = Field(
        default="networkidle",
        description="Playwright wait_until: one of 'load', 'domcontentloaded', 'networkidle'",
    )
    timeout_ms: int = Field(default=45000, ge=1, le=300000)


class ScrapeResult(BaseModel):
    url: HttpUrl
    ok: bool
    html_path: Optional[str] = None
    markdown_path: Optional[str] = None
    title: Optional[str] = None
    error: Optional[str] = None


class ScrapeResponse(BaseModel):
    output_dir: str
    results: List[ScrapeResult]


@router.post("/scrape", response_model=ScrapeResponse)
async def scrape(req: ScrapeRequest) -> ScrapeResponse:
    if req.wait_until not in {"load", "domcontentloaded", "networkidle"}:
        raise HTTPException(status_code=422, detail="wait_until must be one of: load, domcontentloaded, networkidle")

    out_dir = _output_dir(req.output_subdir)
    results: List[ScrapeResult] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        for url in req.urls:
            url_s = str(url)
            slug = _safe_slug(url_s)
            html_path = out_dir / f"{slug}.html"
            md_path = out_dir / f"{slug}.md"

            try:
                resp = await page.goto(url_s, wait_until=req.wait_until, timeout=req.timeout_ms)
                if resp is None:
                    raise RuntimeError("Navigation failed: no response")
                if resp.status >= 400:
                    raise RuntimeError(f"HTTP {resp.status}")

                # Get the fully-rendered DOM HTML.
                html = await page.content()
                title = await page.title()

                if req.extract_main:
                    extracted_title, main_html = _extract_main_html(html)
                    content_title = extracted_title or (title.strip() if title else None)
                else:
                    content_title = title.strip() if title else None
                    main_html = _clean_html_for_markdown(html)

                markdown_body = md(
                    main_html,
                    heading_style="ATX",
                    bullets="-",
                )
                markdown_body = _postprocess_markdown(markdown_body)

                if content_title:
                    markdown = f"# {content_title}\n\n" f"Source: {url_s}\n\n" f"{markdown_body}"
                else:
                    markdown = f"Source: {url_s}\n\n" f"{markdown_body}"

                html_path.write_text(html, encoding="utf-8")
                md_path.write_text(markdown, encoding="utf-8")

                results.append(
                    ScrapeResult(
                        url=url,
                        ok=True,
                        html_path=str(html_path),
                        markdown_path=str(md_path),
                        title=title or None,
                    )
                )
            except Exception as e:
                results.append(ScrapeResult(url=url, ok=False, error=str(e)))

        await context.close()
        await browser.close()

    return ScrapeResponse(output_dir=str(out_dir), results=results)


