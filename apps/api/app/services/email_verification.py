"""
Email verification for signup: generate code, store in DB, send email, verify and create user.
"""
import random
import string
from datetime import datetime, timezone, timedelta

from app.core.config import VERIFICATION_CODE_EXPIRY_MINUTES
from app.core.supabase_client import supabase
from app.services.email_sender import send_verification_email


def _generate_code(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def request_verification_code(email: str) -> tuple[bool, str]:
    """
    Generate a 6-digit code, store it for the email, and send the email.
    Returns (success, message). Replaces any existing code for this email.
    """
    email = email.strip().lower()
    if not email:
        return False, "Email is required."

    code = _generate_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_CODE_EXPIRY_MINUTES)

    try:
        supabase.table("email_verification_codes").delete().eq("email", email).execute()
        supabase.table("email_verification_codes").insert({
            "email": email,
            "code": code,
            "expires_at": expires_at.isoformat(),
        }).execute()
    except Exception as e:
        return False, "Failed to save verification code."

    if not send_verification_email(email, code):
        return False, "Failed to send verification email. Try again later."

    return True, "Verification code sent. Check your email."


def verify_code_and_create_user(
    email: str, code: str, password: str, name: str | None
) -> tuple[bool, str]:
    """
    Verify the code for this email; if valid, create the user in Supabase Auth (email confirmed)
    and return (True, ""). Otherwise return (False, error_message).
    """
    email = email.strip().lower()
    code = code.strip()
    if not email or not code:
        return False, "Email and code are required."
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters."

    try:
        resp = (
            supabase.table("email_verification_codes")
            .select("code, expires_at")
            .eq("email", email)
            .limit(1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            return False, "Invalid or expired verification code. Request a new one."
        row = rows[0]
        if row["code"] != code:
            return False, "Invalid verification code."
        expires_at = datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00"))
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires_at:
            return False, "Verification code has expired. Request a new one."

        user_attrs = {
            "email": email,
            "password": password,
            "email_confirm": True,
        }
        if name:
            user_attrs["data"] = {"name": name}

        try:
            supabase.auth.admin.create_user(user_attrs)
        except Exception as e:
            err_str = str(e).lower()
            if "already" in err_str or "registered" in err_str or "user_already_exists" in err_str:
                return False, "An account with this email already exists. Sign in instead."
            raise

        supabase.table("email_verification_codes").delete().eq("email", email).execute()
        return True, ""
    except Exception as e:
        err_str = str(e).lower()
        if "already" in err_str or "registered" in err_str or "user_already_exists" in err_str:
            return False, "An account with this email already exists. Sign in instead."
        return False, "Could not create account. Please try again."
