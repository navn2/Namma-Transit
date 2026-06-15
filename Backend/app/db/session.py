import logging
import os
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

def _parse_pg_kwargs(url: str) -> dict:
    """Extract sslmode and other pg-specific kwargs from URL query, then strip them."""
    parsed = urlparse(url)
    qs = parse_qs(parsed.query, keep_blank_values=True)
    kwargs = {}
    sslmode = qs.pop("sslmode", None)
    if sslmode:
        kwargs["sslmode"] = sslmode[0]
    if qs:
        parsed = parsed._replace(query=urlencode(qs, doseq=True))
    else:
        parsed = parsed._replace(query="")
    return kwargs, urlunparse(parsed)

engine = None
try:
    if db_url.startswith("sqlite"):
        engine = create_engine(db_url, pool_pre_ping=True, future=True, connect_args=connect_args)
    else:
        pg_kwargs, clean_url = _parse_pg_kwargs(db_url)
        pg_connect_args = {**connect_args, "connect_timeout": 3, **pg_kwargs}
        engine = create_engine(clean_url, pool_pre_ping=True, future=True, connect_args=pg_connect_args)
        with engine.connect() as conn:
            pass
        logger.info("Connected to primary PostgreSQL database successfully.")
except (OperationalError, Exception) as e:
    logger.warning(
        f"Primary database connection failed ({e}). "
        f"Falling back to local SQLite database."
    )
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    fallback_db_path = f"sqlite:///{os.path.join(backend_dir, 'fallback.db')}"
    connect_args = {"check_same_thread": False}
    engine = create_engine(fallback_db_path, pool_pre_ping=True, future=True, connect_args=connect_args)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)
Base = declarative_base()

def init_db():
    from app.db import models  # noqa: F401
    from sqlalchemy import text
    Base.metadata.create_all(bind=engine)
    
    # Transit schema uses create_all; no legacy column migrations needed.
    logger.info("Database tables initialized (Namma Transit schema).")

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
