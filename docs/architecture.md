# Architecture (WIP)

## Goal
Build an interactive finance education app with personalized recommendations and a source-backed assistant.

## High-level components
- **Web app (apps/web):** UI, onboarding, dashboard, chat interface.
- **API (apps/api):** business logic, recommendations, chat orchestration, auth checks.
- **Supabase:** Postgres database + Auth (OAuth).
- **AI Provider:** Gemini/Groq (initially), used behind the API.
- **Knowledge base (later):** curated finance sources used for citations.

## Core user flow (MVP)
1) User logs in
2) User completes onboarding/profile
3) User sees recommended topics
4) User opens a topic and asks questions
5) Assistant responds with citations and disclaimers

## Non-goals (for early MVP)
- Full scraping pipeline at scale
- Automated portfolio / trading advice
- Complex gamification systems

## Key risks
- **Accuracy & trust:** hallucinations/outdated info → must use citations and guardrails
- **Cost blowups:** model calls + ingestion → caching and rate limits
- **Engagement:** content must be short and interactive
