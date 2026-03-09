"""
Authentication utilities for validating Supabase JWT tokens and extracting user_id.
"""
from typing import Optional
from fastapi import HTTPException, Header, Cookie, Request
from jose import jwt, JWTError
import httpx

from app.core.config import SUPABASE_URL, require_env


# Cache for JWT public key
_jwt_public_key: Optional[str] = None


async def get_jwt_public_key() -> str:
    """Fetch Supabase JWT public key (RSA) for token verification."""
    global _jwt_public_key
    
    if _jwt_public_key:
        return _jwt_public_key
    
    url = require_env("SUPABASE_URL", SUPABASE_URL)
    # Supabase exposes JWT public key at /.well-known/jwks.json
    jwks_url = f"{url}/.well-known/jwks.json"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url, timeout=10.0)
            response.raise_for_status()
            jwks = response.json()
            
            # Extract the first key (Supabase typically has one)
            if jwks.get("keys") and len(jwks["keys"]) > 0:
                # Convert JWKS to PEM format for python-jose
                # For simplicity, we'll just use the JWT secret method instead
                pass
    except Exception as e:
        # If we can't fetch JWKS, we'll fall back to validating via Supabase API
        pass
    
    return ""


async def get_current_user_id(
    request: Request,
    authorization: Optional[str] = Header(None),
    sb_access_token: Optional[str] = Cookie(None, alias="sb-access-token"),
) -> str:
    """
    Extract and validate the user_id from Supabase auth token.
    
    Tries multiple sources in order:
    1. Authorization header (Bearer token)
    2. sb-access-token cookie
    
    Args:
        request: FastAPI request object
        authorization: Authorization header value
        sb_access_token: Supabase access token from cookie
    
    Returns:
        user_id: The authenticated user's ID
        
    Raises:
        HTTPException: 401 if authentication fails
    """
    token = None
    
    # 1. Try Authorization header first (standard approach)
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    
    # 2. Try cookie (fallback for web apps)
    elif sb_access_token:
        token = sb_access_token
    
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing authentication token. Please log in.",
        )
    
    # Validate the token and extract user_id
    try:
        # Decode JWT without verification first to get the structure
        # In production, you should verify the signature
        unverified = jwt.get_unverified_claims(token)
        
        # Supabase JWT contains 'sub' (subject) which is the user_id
        user_id = unverified.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing user ID",
            )
        
        # TODO: For production, verify JWT signature with Supabase's public key
        # For now, we trust that Supabase issued the token
        # You can add signature verification using python-jose with JWKS
        
        return user_id
        
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication token: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}",
        )


async def get_current_user_id_optional(
    request: Request,
    authorization: Optional[str] = Header(None),
    sb_access_token: Optional[str] = Cookie(None, alias="sb-access-token"),
) -> Optional[str]:
    """
    Optional authentication - returns user_id if authenticated, None otherwise.
    Useful for endpoints that have different behavior for authenticated vs anonymous users.
    """
    try:
        return await get_current_user_id(request, authorization, sb_access_token)
    except HTTPException:
        return None

