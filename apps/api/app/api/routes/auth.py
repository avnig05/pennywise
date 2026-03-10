"""
Auth-related endpoints: email verification for signup.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.services.email_verification import request_verification_code, verify_code_and_create_user

router = APIRouter()


class SendVerificationCodeBody(BaseModel):
    email: EmailStr


class VerifyAndCreateAccountBody(BaseModel):
    email: EmailStr
    code: str
    password: str
    name: str | None = None


@router.post("/send-verification-code")
async def send_verification_code(body: SendVerificationCodeBody):
    """
    Send a 6-digit verification code to the given email.
    Used before signup to ensure the email is valid.
    """
    success, message = request_verification_code(body.email)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"message": message}


@router.post("/verify-and-create-account")
async def verify_and_create_account(body: VerifyAndCreateAccountBody):
    """
    Verify the 6-digit code and create the user account (Supabase Auth).
    After this returns 200, the client should sign in with email/password.
    """
    success, message = verify_code_and_create_user(
        body.email, body.code, body.password, body.name
    )
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"message": "Account created. You can now sign in."}
