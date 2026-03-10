import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.me import router as me_router
from app.api.routes.articles import router as articles_router
from app.api.routes.quizzes import router as quizzes_router
from app.api.routes.chat import router as chat_router

app = FastAPI(title="Pennywise API", version="0.1.0")

def _parse_csv_env(name: str, default: str) -> list[str]:
    raw = os.getenv(name, default)
    return [v.strip() for v in raw.split(",") if v.strip()]

# CORS
# - In dev, the web app runs on localhost:3000.
# - In prod, the web app is on Vercel (including preview deployments).
#
# Configure explicitly via:
# - CORS_ALLOW_ORIGINS="https://your-prod-domain.com,https://another-domain.com"
# - CORS_ALLOW_ORIGIN_REGEX="^https://.*\\.vercel\\.app$"
allow_origins = _parse_csv_env("CORS_ALLOW_ORIGINS", "http://localhost:3000")
allow_origin_regex = os.getenv("CORS_ALLOW_ORIGIN_REGEX", r"^https://.*\.vercel\.app$")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router, prefix="/auth")
app.include_router(me_router, prefix="/me")
app.include_router(articles_router)
app.include_router(quizzes_router)
app.include_router(chat_router)
