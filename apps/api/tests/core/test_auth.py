import pytest
from fastapi import HTTPException
from fastapi import Request
from jose import JWTError
from unittest.mock import patch

from app.core import auth


def _make_request() -> Request:
    # Minimal ASGI scope for Request; headers/cookies are provided via parameters, not scope
    return Request({"type": "http"})


async def test_get_current_user_id_uses_authorization_header():
    """Bearer token in Authorization header should be preferred and decoded."""
    request = _make_request()
    token = "header-token"

    with patch.object(auth.jwt, "get_unverified_claims", return_value={"sub": "user-123"}) as mock_claims:
        user_id = await auth.get_current_user_id(
            request,
            authorization=f"Bearer {token}",
            sb_access_token=None,
        )

    assert user_id == "user-123"
    mock_claims.assert_called_once_with(token)


async def test_get_current_user_id_uses_cookie_when_no_header():
    """If Authorization header is missing, fall back to sb-access-token cookie."""
    request = _make_request()
    cookie_token = "cookie-token"

    with patch.object(auth.jwt, "get_unverified_claims", return_value={"sub": "user-xyz"}) as mock_claims:
        user_id = await auth.get_current_user_id(
            request,
            authorization=None,
            sb_access_token=cookie_token,
        )

    assert user_id == "user-xyz"
    mock_claims.assert_called_once_with(cookie_token)


async def test_get_current_user_id_missing_token_raises_401():
    """When neither header nor cookie is present, a 401 should be raised."""
    request = _make_request()

    with pytest.raises(HTTPException) as exc:
        await auth.get_current_user_id(
            request,
            authorization=None,
            sb_access_token=None,
        )

    assert exc.value.status_code == 401
    assert "Missing authentication token" in exc.value.detail


async def test_get_current_user_id_jwt_error_raises_401():
    """JWT parsing errors should be converted into a 401 HTTPException."""
    request = _make_request()

    with patch.object(auth.jwt, "get_unverified_claims", side_effect=JWTError("bad token")):
        with pytest.raises(HTTPException) as exc:
            await auth.get_current_user_id(
                request,
                authorization="Bearer bad",
                sb_access_token=None,
            )

    assert exc.value.status_code == 401
    assert "Invalid authentication token" in exc.value.detail


async def test_get_current_user_id_token_missing_sub_raises_401():
    """Actual auth code path: valid JWT shape but missing 'sub' raises 401."""
    request = _make_request()

    with patch.object(auth.jwt, "get_unverified_claims", return_value={"email": "a@b.com"}):
        with pytest.raises(HTTPException) as exc:
            await auth.get_current_user_id(
                request,
                authorization="Bearer some-token",
                sb_access_token=None,
            )
    assert exc.value.status_code == 401
    assert "missing user id" in exc.value.detail.lower()


async def test_get_current_user_id_optional_converts_failure_to_none():
    """Optional helper should swallow auth failures and return None."""
    request = _make_request()

    with patch.object(auth, "get_current_user_id", side_effect=HTTPException(status_code=401, detail="nope")):
        user_id = await auth.get_current_user_id_optional(
            request,
            authorization=None,
            sb_access_token=None,
        )

    assert user_id is None

