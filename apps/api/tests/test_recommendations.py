"""Unit tests for app.services.recommendations (pure logic only)."""
import pytest

from app.services import recommendations as rec


class TestNormalizeKeywords:
    """Tests for _normalize_keywords()."""

    def test_none_returns_empty_list(self):
        assert rec._normalize_keywords(None) == []

    def test_empty_list(self):
        assert rec._normalize_keywords([]) == []

    def test_list_of_strings(self):
        assert rec._normalize_keywords(["a", " b ", "c"]) == ["a", "b", "c"]

    def test_list_filters_falsy(self):
        assert rec._normalize_keywords(["a", "", None, "b"]) == ["a", "b"]

    def test_json_string_array(self):
        raw = '["budgeting", "savings", "credit score"]'
        assert rec._normalize_keywords(raw) == ["budgeting", "savings", "credit score"]

    def test_comma_separated_string(self):
        raw = "budgeting, savings, emergency fund"
        result = rec._normalize_keywords(raw)
        assert result == ["budgeting", "savings", "emergency fund"]

    def test_invalid_json_falls_back_to_comma_split(self):
        raw = "not json, but commas work"
        assert rec._normalize_keywords(raw) == ["not json", "but commas work"]

    def test_list_with_non_strings_converted_to_string(self):
        result = rec._normalize_keywords([1, 2.5, "text"])
        assert result == ["1", "2.5", "text"]


class TestParseTopIdsFromResponse:
    """Tests for _parse_top_ids_from_response()."""

    def test_valid_json_array(self):
        text = '["id-1", "id-2", "id-3", "id-4", "id-5"]'
        result = rec._parse_top_ids_from_response(text, expected_count=5)
        assert result == ["id-1", "id-2", "id-3", "id-4", "id-5"]

    def test_respects_expected_count(self):
        text = '["a", "b", "c", "d", "e"]'
        result = rec._parse_top_ids_from_response(text, expected_count=3)
        assert result == ["a", "b", "c"]

    def test_markdown_code_block_stripped(self):
        text = '```json\n["id-1", "id-2"]\n```'
        result = rec._parse_top_ids_from_response(text, expected_count=5)
        assert result == ["id-1", "id-2"]

    def test_invalid_json_returns_empty_list(self):
        text = "not valid json"
        result = rec._parse_top_ids_from_response(text, expected_count=5)
        assert result == []

    def test_non_list_json_returns_empty_list(self):
        text = '{"ids": ["a", "b"]}'
        result = rec._parse_top_ids_from_response(text, expected_count=5)
        assert result == []

    def test_filters_empty_ids(self):
        text = '["id-1", "", "id-2", null]'
        result = rec._parse_top_ids_from_response(text, expected_count=5)
        assert "id-1" in result and "id-2" in result
        assert "" not in result

    def test_uuid_strings(self):
        text = '["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"]'
        result = rec._parse_top_ids_from_response(text, expected_count=5)
        assert len(result) == 2
        assert result[0].startswith("550e8400")
