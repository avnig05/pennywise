from fastapi import FastAPI
from app.api.routes.health import router as health_router

app = FastAPI(title="Pennywise API", version="0.1.0")

# Routes
app.include_router(health_router)
