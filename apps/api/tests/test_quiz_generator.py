"""Unit tests for app.services.quiz_generator (pure logic only)."""
import json
import pytest

from app.services import quiz_generator as qg


def _valid_question(question_text: str = "What is budgeting?", correct_index: int = 0) -> dict:
    return {
        "question_text": question_text,
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_answer_index": correct_index,
    }


class TestParseQuizFromResponse:
    """Tests for _parse_quiz_from_response()."""

    def test_empty_string_returns_none(self):
        assert qg._parse_quiz_from_response("") is None
        assert qg._parse_quiz_from_response("   ") is None

    def test_valid_five_questions(self):
        questions = [_valid_question(f"Q{i}?", i % 4) for i in range(5)]
        text = json.dumps({"questions": questions})
        result = qg._parse_quiz_from_response(text)
        assert result is not None
        assert len(result) == 5
        assert result[0]["question_text"] == "Q0?"
        assert result[0]["correct_answer_index"] == 0

    def test_valid_six_questions(self):
        questions = [_valid_question(f"Q{i}?") for i in range(6)]
        text = json.dumps({"questions": questions})
        result = qg._parse_quiz_from_response(text)
        assert result is not None
        assert len(result) == 6

    def test_seven_questions_returned_as_is(self):
        questions = [_valid_question(f"Q{i}?") for i in range(7)]
        text = json.dumps({"questions": questions})
        result = qg._parse_quiz_from_response(text)
        assert result is not None
        assert len(result) == 7

    def test_fewer_than_five_questions_returns_none(self):
        questions = [_valid_question("Q1?"), _valid_question("Q2?")]
        text = json.dumps({"questions": questions})
        result = qg._parse_quiz_from_response(text)
        assert result is None

    def test_invalid_correct_answer_index_strict_path_excludes_it(self):
        # Strict path requires correct_answer_index in 0-3; 5th question has index 5 so only 4 valid.
        # Parser then uses regex fallback and returns all 5 (fallback does not re-validate).
        questions = [
            _valid_question("Q1?", 0),
            _valid_question("Q2?", 1),
            _valid_question("Q3?", 2),
            _valid_question("Q4?", 3),
            {"question_text": "Q5?", "options": ["A", "B", "C", "D"], "correct_answer_index": 5},  # invalid
        ]
        text = json.dumps({"questions": questions})
        result = qg._parse_quiz_from_response(text)
        assert result is not None
        assert len(result) == 5
        assert result[4]["correct_answer_index"] == 5

    def test_three_options_fail_strict_but_regex_fallback_returns_them(self):
        # Strict path requires exactly 4 options; regex fallback returns questions without re-validating.
        questions = [
            {"question_text": "Q?", "options": ["A", "B", "C"], "correct_answer_index": 0},
        ] * 5
        text = json.dumps({"questions": questions})
        result = qg._parse_quiz_from_response(text)
        assert result is not None
        assert len(result) == 5
        assert len(result[0]["options"]) == 3

    def test_markdown_code_block_stripped(self):
        questions = [_valid_question(f"Q{i}?") for i in range(5)]
        body = json.dumps({"questions": questions})
        text = f"```json\n{body}\n```"
        result = qg._parse_quiz_from_response(text)
        assert result is not None
        assert len(result) == 5

    def test_invalid_json_returns_none(self):
        assert qg._parse_quiz_from_response("not json") is None

    def test_regex_fallback_finds_object(self):
        # When direct parse fails, code looks for {...} in text
        questions = [_valid_question(f"Q{i}?") for i in range(5)]
        body = json.dumps({"questions": questions})
        text = f"Here is the quiz:\n{body}\nEnd."
        result = qg._parse_quiz_from_response(text)
        assert result is not None
        assert len(result) == 5

    def test_correct_answer_index_0_1_2_3_accepted(self):
        for idx in (0, 1, 2, 3):
            questions = [_valid_question("Q?", idx)] * 5
            text = json.dumps({"questions": questions})
            result = qg._parse_quiz_from_response(text)
            assert result is not None
            assert result[0]["correct_answer_index"] == idx
