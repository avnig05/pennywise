"""
Quick script to test the recommendations service.
Run from apps/api: python scripts/test_recommendations.py <user_id>

Requires: .env with GEMINI_API_KEY and Supabase credentials. 
          Articles must exist (keywords column recommended).
          Provide a user_id as command-line argument.
"""

import json
import sys
from pathlib import Path

# Add parent directory so we can import app
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.recommendations import get_recommended_articles, get_profile, get_articles_for_recommendation


def main():
    print("Testing recommendations service...\n")

    # 1. Get user_id from command line
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_recommendations.py <user_id>")
        print("Example: python scripts/test_recommendations.py 550e8400-e29b-41d4-a716-446655440000")
        sys.exit(1)
    
    user_id = sys.argv[1]
    print(f"Testing for user_id: {user_id}")

    # 2. Check profile exists
    profile = get_profile(user_id)
    if not profile:
        print(f"No profile found for user_id={user_id}. User needs to complete onboarding first.")
        sys.exit(1)
    print(f"Profile found (e.g. priority={profile.get('priority')}, interests={profile.get('interests')})\n")

    # 3. Check we have articles (with keywords for best results)
    articles_payload = get_articles_for_recommendation(limit=5)
    if not articles_payload:
        print("No articles found. Ingest some articles first (e.g. python scripts/ingest.py).")
        sys.exit(1)
    print(f"Candidate articles (sample): {len(articles_payload)} with keywords/metadata\n")

    # 4. Get recommendations (this calls the LLM)
    print("Calling get_recommended_articles(user_id, top_n=5)...")
    try:
        articles = get_recommended_articles(user_id, top_n=5)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

    print(f"Returned {len(articles)} recommended articles:\n")
    for i, a in enumerate(articles, 1):
        print(f"  {i}. {a.get('title', '')[:60]}...")
        print(f"     id={a.get('id')} category={a.get('category')} difficulty={a.get('difficulty')}")
    print("\nFull response (first article):")
    print(json.dumps(articles[0] if articles else {}, indent=2, default=str))
    print("\nDone.")


if __name__ == "__main__":
    main()
