"""
Personalized daily tips using profile data and an LLM.
Tips provide actionable financial guidance without recommending specific products or services.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Optional

from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import GEMINI_API_KEY, require_env
from app.core.supabase_client import supabase

log = logging.getLogger(__name__)

# Set to 0 for testing (regenerate every time), 24 for production (once per day)
TIP_REGENERATION_HOURS = 0  # Change to 24 for production

TIP_PROMPT_TEMPLATE = """You are a friendly financial education assistant. Generate a personalized, actionable tip for a user based on their profile.

IMPORTANT GUIDELINES:
- Be SPECIFIC and DIRECT - give practical advice they can apply today
- Provide general financial guidance with concrete numbers (e.g., "aim to save 20% of income", "keep 3-6 months in emergency fund") 
- Do NOT recommend specific products, services, banks, apps, or investment vehicles
- Make it relevant to their situation but VARY the topic - don't always focus on the same themes
- Be encouraging and conversational in tone
- Keep it concise (2-3 sentences max)
- Focus on actionable behaviors, habits, or mindset shifts

TOPIC VARIETY - Rotate between different areas:
- Emergency fund building (aim for 3-6 months of expenses)
- Savings strategies (50/30/20 rule, pay yourself first, automate savings)
- Budgeting techniques (zero-based budgeting, envelope method, tracking spending)
- Debt management (avalanche vs snowball method, extra payments)
- Credit building (utilization under 30%, payment history, credit mix)
- Income optimization (side hustles, negotiation, skills)
- Financial mindset (delayed gratification, needs vs wants, financial goals)
- Tax efficiency (deductions, tax-advantaged accounts, timing)

User Profile:
{profile_json}
{recent_tips_section}
Generate ONE practical tip for this user. IMPORTANT: Choose a topic that's DIFFERENT from any recent tips shown above. Explore a new financial area each time - avoid repeating the same themes. Include specific percentages, dollar amounts, or concrete actions when possible.

Respond with ONLY the tip text, no additional commentary or formatting."""


def _create_llm(temperature: float = 0.8) -> ChatGoogleGenerativeAI:
    """Create LLM instance for tip generation. Higher temperature (0.8) for more variety."""
    api_key = require_env("GEMINI_API_KEY", GEMINI_API_KEY)
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=temperature,
    )


def get_profile(user_id: str) -> Optional[dict]:
    """Fetch the user's profile from Supabase."""
    resp = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
    rows = resp.data or []
    return rows[0] if rows else None


def generate_tip_text(user_id: str) -> Optional[str]:
    """
    Generate a personalized educational tip for the user using their profile data.
    Avoids repeating topics from recent tips.
    Returns the tip text or None if generation fails.
    """
    profile = get_profile(user_id)
    if not profile:
        log.warning("Tip generation: no profile for user_id=%s", user_id)
        return None

    # Get recent tips to avoid topic repetition
    recent_tips = get_recent_tips(user_id, limit=5)
    
    # Create a focused profile summary for the prompt
    profile_summary = {
        "interests": profile.get("interests", []),
        "priority": profile.get("priority"),
        "debt_status": profile.get("debt_status"),
        "credit_card_status": profile.get("credit_card_status"),
        "emergency_buffer_range": profile.get("emergency_buffer_range"),
        "income_range": profile.get("net_income_range"),
        "rent_status": profile.get("rent_status"),
    }
    
    profile_json = json.dumps(profile_summary, separators=(",", ":"), indent=2)
    
    # Add recent tips context if available
    if recent_tips:
        recent_tips_text = "\n".join([f"- {tip[:100]}..." if len(tip) > 100 else f"- {tip}" for tip in recent_tips])
        prompt = TIP_PROMPT_TEMPLATE.format(
            profile_json=profile_json,
            recent_tips_section=f"\n\nRECENT TIPS (avoid these topics):\n{recent_tips_text}\n"
        )
    else:
        prompt = TIP_PROMPT_TEMPLATE.format(
            profile_json=profile_json,
            recent_tips_section=""
        )
    
    llm = _create_llm()
    try:
        response = llm.invoke(prompt)
        tip_text = response.content if hasattr(response, "content") else str(response)
        tip_text = tip_text.strip()
        
        # Basic validation
        if not tip_text or len(tip_text) < 20:
            log.warning("Tip generation: LLM returned invalid tip for user_id=%s", user_id)
            return None
            
        return tip_text
    except Exception as e:
        log.error("Tip generation: LLM failed for user_id=%s: %s", user_id, e)
        return None


def get_latest_tip(user_id: str) -> Optional[dict]:
    """
    Get the most recent tip for the user from the database.
    Returns dict with tip_text and tip_timestamp, or None if no tips exist.
    """
    try:
        resp = (
            supabase.table("tips")
            .select("tip_text, tip_timestamp")
            .eq("user_id", user_id)
            .order("tip_timestamp", desc=True)
            .limit(1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            return None
        return rows[0]
    except Exception as e:
        log.error("Failed to fetch latest tip for user_id=%s: %s", user_id, e)
        return None


def get_recent_tips(user_id: str, limit: int = 5) -> list[str]:
    """
    Get the most recent N tips for the user to avoid topic repetition.
    Returns list of tip texts (most recent first).
    """
    try:
        resp = (
            supabase.table("tips")
            .select("tip_text")
            .eq("user_id", user_id)
            .order("tip_timestamp", desc=True)
            .limit(limit)
            .execute()
        )
        rows = resp.data or []
        tips = [row["tip_text"] for row in rows if row.get("tip_text")]
        log.info("Found %d recent tips for user_id=%s", len(tips), user_id)
        return tips
    except Exception as e:
        log.error("Failed to fetch recent tips for user_id=%s: %s", user_id, e)
        return []


def should_regenerate_tip(tip_timestamp_str: str) -> bool:
    """
    Check if the tip should be regenerated based on TIP_REGENERATION_HOURS threshold.
    tip_timestamp_str should be an ISO format timestamp from Supabase.
    """
    try:
        # Parse ISO timestamp (Supabase returns UTC)
        tip_time = datetime.fromisoformat(tip_timestamp_str.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        elapsed_hours = (now - tip_time).total_seconds() / 3600
        return elapsed_hours >= TIP_REGENERATION_HOURS
    except Exception as e:
        log.error("Failed to parse tip timestamp: %s", e)
        return True  # Regenerate on error to be safe


def save_tip(user_id: str, tip_text: str) -> bool:
    """
    Save a new tip to the database with current timestamp.
    Returns True if successful, False otherwise.
    """
    try:
        payload = {
            "user_id": user_id,
            "tip_text": tip_text,
            "tip_timestamp": datetime.now(timezone.utc).isoformat(),
        }
        log.info("Attempting to save tip for user_id=%s with payload: %s", user_id, payload)
        result = supabase.table("tips").insert(payload).execute()
        log.info("Successfully saved tip for user_id=%s. Result: %s", user_id, result.data)
        return True
    except Exception as e:
        import traceback
        log.error("Failed to save tip for user_id=%s: %s", user_id, str(e))
        log.error("Full error traceback: %s", traceback.format_exc())
        log.error("Payload was: %s", payload)
        return False


def get_or_generate_tip(user_id: str) -> Optional[dict]:
    """
    Get the current tip for the user, generating a new one if:
    - No tip exists
    - The latest tip is older than TIP_REGENERATION_HOURS hours
    
    Returns dict with 'tip_text' and 'tip_timestamp', or None on failure.
    """
    # Check for existing tip
    latest_tip = get_latest_tip(user_id)
    
    # If no tip exists, or tip is older than 24 hours, generate new one
    if not latest_tip or should_regenerate_tip(latest_tip["tip_timestamp"]):
        log.info("Generating new tip for user_id=%s", user_id)
        new_tip_text = generate_tip_text(user_id)
        
        if not new_tip_text:
            # If generation fails and we have an old tip, return it anyway
            if latest_tip:
                log.warning("Tip generation failed for user_id=%s, returning stale tip", user_id)
                return latest_tip
            return None
        
        # Save the new tip
        if save_tip(user_id, new_tip_text):
            return {
                "tip_text": new_tip_text,
                "tip_timestamp": datetime.now(timezone.utc).isoformat(),
            }
        else:
            # If save fails but we have an old tip, return it
            if latest_tip:
                return latest_tip
            return None
    
    # Return the existing valid tip
    return latest_tip

