"""Namma Transit services package.

This module re-exports user management helpers that auth/profile
routers depend on. Environmental-specific functions have been removed.
"""

from __future__ import annotations

from datetime import datetime, date, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import User, Trip, ReliabilityHistory
from app.utils.argon2_handler import hash_password
from app.utils.jwt_handler import create_access_token


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def user_to_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "city": user.city,
        "theme": user.theme,
        "language": user.language,
        "reward_balance": user.reward_balance or 0,
        "trust_score": round(user.trust_score or 1.0, 2),
    }


def profile_to_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "phone_number": user.phone_number,
        "city": user.city,
        "language": user.language,
        "theme": user.theme,
        "reward_balance": user.reward_balance or 0,
        "trust_score": round(user.trust_score or 1.0, 2),
        "notifications": {
            "delay_alerts": user.notifications_delay_alerts,
            "transfer_risk": user.notifications_transfer_risk,
            "weekly_summary": user.notifications_weekly,
            "daily_report": user.notifications_daily_report,
        },
    }


def create_user(
    db: Session,
    name: str,
    email: str,
    password: str,
    use_everyday: bool = False,
    commute_destination: str | None = None,
    commute_destination_coords: str | None = None,
):
    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_tokens_for_user(user: User) -> str:
    return create_access_token({"user_id": str(user.id), "email": user.email})


def ensure_user(db: Session, name="Demo User", email="demo@nammatransit.app", password="SecurePass123"):
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user
    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
