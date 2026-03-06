"""Unit tests for app.services.tip_generator (pure logic only)."""
from datetime import datetime, timezone, timedelta

import pytest

from app.services import tip_generator as tip


class TestShouldRegenerateTip:
    """Tests for should_regenerate_tip()."""

    def test_recent_tip_returns_false(self):
        # Tip from 1 hour ago should not regenerate
        now = datetime.now(timezone.utc)
        one_hour_ago = (now - timedelta(hours=1)).isoformat()
        assert tip.should_regenerate_tip(one_hour_ago) is False

    def test_old_tip_returns_true(self):
        # Tip from 25 hours ago should regenerate
        now = datetime.now(timezone.utc)
        old = (now - timedelta(hours=25)).isoformat()
        assert tip.should_regenerate_tip(old) is True

    def test_exactly_24_hours_returns_true(self):
        now = datetime.now(timezone.utc)
        exactly_24 = (now - timedelta(hours=24)).isoformat()
        assert tip.should_regenerate_tip(exactly_24) is True

    def test_just_under_24_hours_returns_false(self):
        now = datetime.now(timezone.utc)
        just_under = (now - timedelta(hours=23, minutes=59)).isoformat()
        assert tip.should_regenerate_tip(just_under) is False

    def test_iso_with_z_suffix(self):
        # Supabase often returns UTC with Z
        now = datetime.now(timezone.utc)
        one_hour_ago = (now - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%S.%f") + "Z"
        assert tip.should_regenerate_tip(one_hour_ago) is False

    def test_invalid_timestamp_returns_true(self):
        # On parse error, regenerate to be safe
        assert tip.should_regenerate_tip("not a date") is True
        assert tip.should_regenerate_tip("") is True
