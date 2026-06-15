import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import init_db
from app.routes import transit_router

app = FastAPI(title="Namma Transit API", version="1.0.0")

origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    init_db()
    logger = logging.getLogger(__name__)
    logger.info("Namma Transit API started")

app.include_router(transit_router.router, prefix="/api/transit", tags=["Transit"])

@app.get("/")
def root():
    return {"status": "Namma Transit API is running", "version": app.version, "docs": "/docs"}
