"""Unit tests for app.services.chunker."""
import pytest

from app.services.chunker import chunk_text, DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP


class TestChunkText:
    """Tests for chunk_text()."""

    def test_empty_string_returns_empty_list(self):
        result = chunk_text("")
        assert result == []

    def test_short_text_single_chunk(self):
        text = "This is a short article about budgeting."
        result = chunk_text(text)
        assert len(result) == 1
        assert result[0] == text

    def test_long_text_multiple_chunks(self):
        paragraph = "This is a sentence. " * 20  # ~380 chars
        text = (paragraph + "\n\n") * 4  # well over 1000 chars
        result = chunk_text(text)
        assert len(result) >= 2
        for chunk in result:
            assert len(chunk) <= DEFAULT_CHUNK_SIZE + 50

    def test_custom_chunk_size(self):
        text = "A " * 200  # 400 chars
        result = chunk_text(text, chunk_size=100, chunk_overlap=10)
        assert len(result) >= 2
        for chunk in result:
            assert len(chunk) <= 110

    def test_custom_chunk_overlap(self):
        text = "Word " * 300  # 1500 chars
        result = chunk_text(text, chunk_size=400, chunk_overlap=50)
        assert len(result) >= 2

    def test_splits_on_paragraphs(self):
        p1 = "First paragraph. " * 30
        p2 = "Second paragraph. " * 30
        text = p1 + "\n\n" + p2
        result = chunk_text(text, chunk_size=500, chunk_overlap=0)
        assert len(result) >= 1
        combined = " ".join(result)
        assert "First" in combined and "Second" in combined
