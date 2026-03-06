"""Unit tests for app.services.keyword_extractor (pure logic only)."""
import pytest

from app.services import keyword_extractor as kw


class TestParseKeywordsFromResponse:
    """Tests for _parse_keywords_from_response()."""

    def test_empty_string_returns_empty_list(self):
        assert kw._parse_keywords_from_response("", max_keywords=10) == []

    def test_valid_json_array(self):
        text = '["budgeting", "savings", "credit score"]'
        result = kw._parse_keywords_from_response(text, max_keywords=10)
        assert result == ["budgeting", "savings", "credit score"]

    def test_strips_and_lowercases(self):
        text = '[" Budgeting ", "SAVINGS", "Credit Score "]'
        result = kw._parse_keywords_from_response(text, max_keywords=10)
        assert result == ["budgeting", "savings", "credit score"]

    def test_max_keywords_truncates(self):
        text = '["a", "b", "c", "d", "e"]'
        result = kw._parse_keywords_from_response(text, max_keywords=3)
        assert result == ["a", "b", "c"]

    def test_deduplicates_preserving_order(self):
        text = '["budgeting", "savings", "budgeting", "credit"]'
        result = kw._parse_keywords_from_response(text, max_keywords=10)
        assert result == ["budgeting", "savings", "credit"]

    def test_markdown_code_block_stripped(self):
        text = '```json\n["keyword1", "keyword2"]\n```'
        result = kw._parse_keywords_from_response(text, max_keywords=10)
        assert result == ["keyword1", "keyword2"]

    def test_extra_text_with_array_inside(self):
        text = 'Here are the keywords: ["budgeting", "savings"]'
        result = kw._parse_keywords_from_response(text, max_keywords=10)
        assert result == ["budgeting", "savings"]

    def test_invalid_json_returns_empty_list(self):
        text = "not json at all"
        result = kw._parse_keywords_from_response(text, max_keywords=10)
        assert result == []

    def test_filters_falsy_elements(self):
        text = '["a", "", null, "b"]'
        result = kw._parse_keywords_from_response(text, max_keywords=10)
        assert result == ["a", "b"]
