from typing import Optional, Literal, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import DEV_USER_ID, require_env
from app.core.supabase_client import supabase

router = APIRouter()

# matches your SQL checks
class ProfileUpdate(BaseModel):
    age_range: Optional[Literal["lt_18", "18_24", "25_34", "35_44", "45_54", "55_64", "65_plus", "unknown"]] = None
    job_type: Optional[Literal["w2", "1099", "unknown"]] = None
    state: Optional[str] = None  # expects "CA" etc. (we won't over-validate yet)
    pay_frequency: Optional[Literal["weekly", "biweekly", "semi-monthly", "monthly", "unknown"]] = None
    net_income_range: Optional[Literal["lt_1500", "1500_2500", "2500_4000", "gt_4000", "unknown"]] = None
    rent_status: Optional[Literal["rent", "parents", "dorm", "other", "unknown"]] = None
    debt_status: Optional[Literal["none", "student_loans", "credit_card", "both"]] = None
    credit_card_status: Optional[Literal["no_card", "have_not_used", "use_sometimes", "use_often"]] = None
    emergency_buffer_range: Optional[Literal["zero", "lt_500", "500_2000", "gt_2000"]] = None
    priority: Optional[Literal["save", "credit", "debt", "unsure"]] = None
    interests: Optional[List[str]] = None

def _user_id() -> str:
    return require_env("DEV_USER_ID", DEV_USER_ID)

@router.get("/me")
def get_me():
    user_id = _user_id()
    resp = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
    rows = resp.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Profile not found. Complete onboarding.")
    return rows[0]

@router.put("/me")
def put_me(update: ProfileUpdate):
    user_id = _user_id()
    payload = update.model_dump(exclude_none=True)
    payload["user_id"] = user_id

    try:
        resp = supabase.table("profiles").upsert(payload, on_conflict="user_id").execute()
        rows = resp.data or []
        return rows[0] if rows else payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {e}")
