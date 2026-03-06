"""Unit tests for app.services.article_structured (pure logic only)."""
import json
import pytest

from app.services import article_structured as art


class TestExtractJsonObject:
    """Tests for _extract_json_object()."""

    def test_empty_string_returns_none(self):
        assert art._extract_json_object("") is None
        assert art._extract_json_object("   ") is None

    def test_no_brace_returns_none(self):
        assert art._extract_json_object("no json here") is None

    def test_simple_object(self):
        text = '{"key": "value"}'
        result = art._extract_json_object(text)
        assert result == text
        assert json.loads(result) == {"key": "value"}

    def test_nested_object(self):
        text = '{"outer": {"inner": 1}}'
        result = art._extract_json_object(text)
        assert result == text
        assert json.loads(result) == {"outer": {"inner": 1}}

    def test_leading_trailing_prose(self):
        obj = '{"intro_commentary": "Hi", "sections": []}'
        text = f"Here is the JSON:\n{obj}\nEnd."
        result = art._extract_json_object(text)
        assert result == obj

    def test_markdown_code_fence_stripped(self):
        obj = '{"a": 1}'
        text = f"```json\n{obj}\n```"
        result = art._extract_json_object(text)
        assert result == obj

    def test_first_object_extracted(self):
        text = '{"first": 1} and {"second": 2}'
        result = art._extract_json_object(text)
        assert result == '{"first": 1}'

    def test_nested_braces_in_string_value(self):
        # Content can contain braces; we match by depth
        text = '{"content": "Text with { and } inside"}'
        result = art._extract_json_object(text)
        assert result == text
        parsed = json.loads(result)
        assert "{" in parsed["content"] and "}" in parsed["content"]


class TestParseStructuredResponse:
    """Tests for _parse_structured_response()."""

    def test_empty_string_returns_none(self):
        assert art._parse_structured_response("") is None

    def test_valid_response(self):
        data = {
            "intro_commentary": "Hey there!",
            "sections": [
                {"heading": "Intro", "content": "Some content.", "commentary": "A tip."},
                {"heading": "Part 2", "content": "More.", "commentary": ""},
            ],
        }
        text = json.dumps(data)
        result = art._parse_structured_response(text)
        assert result is not None
        assert result["intro_commentary"] == "Hey there!"
        assert len(result["sections"]) == 2
        assert result["sections"][0]["heading"] == "Intro"
        assert result["sections"][0]["content"] == "Some content."
        assert result["sections"][0]["commentary"] == "A tip."
        assert result["sections"][1]["heading"] == "Part 2"

    def test_no_sections_returns_none(self):
        data = {"intro_commentary": "Hi", "sections": []}
        assert art._parse_structured_response(json.dumps(data)) is None

    def test_missing_sections_key_returns_none(self):
        data = {"intro_commentary": "Hi"}
        assert art._parse_structured_response(json.dumps(data)) is None

    def test_sections_not_list_returns_none(self):
        data = {"intro_commentary": "Hi", "sections": "not a list"}
        assert art._parse_structured_response(json.dumps(data)) is None

    def test_non_dict_returns_none(self):
        assert art._parse_structured_response("[1, 2, 3]") is None

    def test_default_section_heading_when_missing(self):
        data = {
            "intro_commentary": "",
            "sections": [{"content": "Only content", "commentary": ""}],
        }
        text = json.dumps(data)
        result = art._parse_structured_response(text)
        assert result is not None
        assert result["sections"][0]["heading"] == "Section 1"

    def test_with_markdown_wrapper(self):
        data = {
            "intro_commentary": "Hi",
            "sections": [{"heading": "H", "content": "C", "commentary": ""}],
        }
        text = f"```json\n{json.dumps(data)}\n```"
        result = art._parse_structured_response(text)
        assert result is not None
        assert len(result["sections"]) == 1


class TestIsValidCached:
    """Tests for _is_valid_cached()."""

    def test_none_returns_false(self):
        assert art._is_valid_cached(None) is False

    def test_not_dict_returns_false(self):
        assert art._is_valid_cached([]) is False
        assert art._is_valid_cached("string") is False

    def test_empty_sections_returns_false(self):
        assert art._is_valid_cached({"sections": []}) is False

    def test_missing_sections_returns_false(self):
        assert art._is_valid_cached({}) is False
        assert art._is_valid_cached({"intro_commentary": "Hi"}) is False

    def test_sections_not_list_returns_false(self):
        assert art._is_valid_cached({"sections": "not a list"}) is False

    def test_one_section_returns_true(self):
        assert art._is_valid_cached({"sections": [{"heading": "H", "content": "C", "commentary": ""}]}) is True

    def test_multiple_sections_returns_true(self):
        assert art._is_valid_cached({
            "sections": [
                {"heading": "H1", "content": "C1", "commentary": ""},
                {"heading": "H2", "content": "C2", "commentary": ""},
            ]
        }) is True
