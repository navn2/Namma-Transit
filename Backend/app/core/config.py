from dataclasses import dataclass
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

@dataclass(frozen=True)
class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "Namma Transit API")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres.your-project-ref:your-password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRY_HOURS: int = int(os.getenv("JWT_EXPIRY_HOURS", "72"))
    ARGON2_TIME_COST: int = int(os.getenv("ARGON2_TIME_COST", "2"))
    ARGON2_MEMORY_COST: int = int(os.getenv("ARGON2_MEMORY_COST", "65536"))

    WEBPUSH_VAPID_PRIVATE_KEY: str = os.getenv("WEBPUSH_VAPID_PRIVATE_KEY", "")
    WEBPUSH_VAPID_PUBLIC_KEY: str = os.getenv("WEBPUSH_VAPID_PUBLIC_KEY", "")
    WEBPUSH_VAPID_EMAIL: str = os.getenv("WEBPUSH_VAPID_EMAIL", "mailto:team@ecolens.app")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://ecolens.app")
    ENABLE_SCHEDULER: bool = os.getenv("ENABLE_SCHEDULER", "true").lower() == "true"
    REDIS_URL: str = os.getenv("REDIS_URL", "")

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
