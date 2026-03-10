"""
Send transactional emails (e.g. verification codes).
Uses Resend when RESEND_API_KEY is set; otherwise logs to stdout (dev).
"""
import os
import logging
from typing import Optional

from app.core.config import VERIFICATION_FROM_EMAIL

logger = logging.getLogger(__name__)


def send_verification_email(to_email: str, code: str) -> bool:
    """
    Send a 6-digit verification code to the given email.
    Returns True if sent (or skipped in dev), False on failure.
    """
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    subject = "Your Pennywise verification code"
    body = (
        f"Your verification code is: <strong>{code}</strong>\n\n"
        "It expires in 15 minutes. If you didn't request this, you can ignore this email."
    )

    if not api_key:
        logger.warning("RESEND_API_KEY not set; logging verification code instead of sending email.")
        # Print so it's always visible in the terminal when running uvicorn
        print(f"\n>>> Verification code for {to_email}: {code} <<<\n")
        logger.info("Verification code for %s: %s", to_email, code)
        return True

    try:
        import resend
        resend.api_key = api_key
        params = {
            "from": VERIFICATION_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": f"<p>{body.replace(chr(10), '<br>')}</p>",
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        # Resend free tier: can only send TO your Resend account email. If blocked, fall back to logging the code.
        err_msg = str(e).lower()
        if "only send" in err_msg and "your own email" in err_msg:
            logger.warning("Resend restricted recipient; logging code instead. Use your Resend account email or verify a domain.")
            print(f"\n>>> Verification code for {to_email}: {code} <<<\n")
            return True
        logger.exception("Failed to send verification email to %s: %s", to_email, e)
        return False
