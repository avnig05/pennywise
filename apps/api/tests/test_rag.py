"""Unit tests for app.services.rag (pure logic only)."""
import pytest

from app.services import rag


class TestCosineSimilarity:
    """Tests for _cosine_similarity()."""

    def test_identical_vectors(self):
        v = [1.0, 0.0, 0.0]
        assert rag._cosine_similarity(v, v) == pytest.approx(1.0)

    def test_orthogonal_vectors(self):
        a = [1.0, 0.0, 0.0]
        b = [0.0, 1.0, 0.0]
        assert rag._cosine_similarity(a, b) == pytest.approx(0.0)

    def test_opposite_vectors(self):
        a = [1.0, 0.0, 0.0]
        b = [-1.0, 0.0, 0.0]
        assert rag._cosine_similarity(a, b) == pytest.approx(-1.0)

    def test_zero_vector_returns_zero(self):
        a = [1.0, 2.0, 3.0]
        b = [0.0, 0.0, 0.0]
        assert rag._cosine_similarity(a, b) == 0.0
        assert rag._cosine_similarity(b, a) == 0.0

    def test_same_direction_different_magnitude(self):
        a = [1.0, 2.0, 3.0]
        b = [2.0, 4.0, 6.0]
        assert rag._cosine_similarity(a, b) == pytest.approx(1.0)

    def test_arbitrary_vectors(self):
        a = [1.0, 2.0, 3.0]
        b = [1.0, 1.0, 1.0]
        sim = rag._cosine_similarity(a, b)
        assert -1.0 <= sim <= 1.0


class TestParseStepsFromResponse:
    """Tests for _parse_steps_from_response()."""

    def test_numbered_list(self):
        text = "1. First step.\n2. Second step.\n3. Third step."
        result = rag._parse_steps_from_response(text)
        assert result is not None
        assert len(result) == 3
        assert "First" in result[0]
        assert "Second" in result[1]
        assert "Third" in result[2]

    def test_step_label_pattern(self):
        text = "Step 1: Do this first.\nStep 2: Then do this.\nStep 3: Finally this."
        result = rag._parse_steps_from_response(text)
        assert result is not None
        assert len(result) >= 2
        assert "Do this first" in result[0] or "first" in result[0].lower()

    def test_single_step_returns_none(self):
        text = "1. Only one step here."
        result = rag._parse_steps_from_response(text)
        assert result is None

    def test_empty_string_returns_none(self):
        assert rag._parse_steps_from_response("") is None
        assert rag._parse_steps_from_response("   ") is None

    def test_no_steps_returns_none(self):
        text = "This is just a paragraph with no numbered steps."
        result = rag._parse_steps_from_response(text)
        assert result is None

    def test_step_pattern_case_insensitive(self):
        text = "STEP 1: First.\nSTEP 2: Second."
        result = rag._parse_steps_from_response(text)
        assert result is not None
        assert len(result) >= 2


class TestIs429:
    """Tests for _is_429()."""

    def test_429_in_message(self):
        e = Exception("Error 429: Rate limit exceeded")
        assert rag._is_429(e) is True

    def test_resource_exhausted(self):
        e = Exception("RESOURCE_EXHAUSTED quota")
        assert rag._is_429(e) is True

    def test_other_error_false(self):
        e = Exception("500 Internal Server Error")
        assert rag._is_429(e) is False

    def test_value_error_false(self):
        e = ValueError("Something else")
        assert rag._is_429(e) is False
