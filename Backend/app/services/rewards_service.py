"""Yatri Points rewards service — ledger management and redemptions.

Point values:
    Verified Trip:              5 pts
    Verified Crowd Report:     10 pts
    High Confidence Telemetry:  2 pts
    Daily Streak:               5 pts
    Weekly Streak:             25 pts

Redemption:
    500 pts = ₹50 voucher
"""

from __future__ import annotations

import logging
from datetime import datetime, date, timedelta
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import User, RewardTransaction, Trip

logger = logging.getLogger(__name__)

# ── Redemption Config ────────────────────────────────────────────────────────

REDEMPTION_RATE = 500  # points per redemption
REDEMPTION_VALUE_INR = 50


# ── Earn Points ──────────────────────────────────────────────────────────────

def award_points(
    db: Session,
    user: User,
    points: int,
    description: str,
) -> dict:
    """Award Yatri Points to a user and log the transaction."""
    user.reward_balance = (user.reward_balance or 0) + points

    txn = RewardTransaction(
        user_id=str(user.id),
        points=points,
        transaction_type="earn",
        description=description,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    return {
        "transaction_id": str(txn.id),
        "points_awarded": points,
        "new_balance": user.reward_balance,
        "description": description,
    }


def award_trip_points(db: Session, user: User) -> dict:
    """Award points for completing a verified trip."""
    return award_points(db, user, 5, "Verified trip completion")


# ── Streak Detection ─────────────────────────────────────────────────────────

def check_and_award_streak(db: Session, user: User) -> dict | None:
    """Check if the user has earned a daily or weekly streak bonus."""
    today = date.today()

    # Count distinct trip days in the last 7 days
    seven_days_ago = today - timedelta(days=7)
    trip_days = (
        db.query(func.count(func.distinct(func.date(Trip.started_at))))
        .filter(
            Trip.user_id == str(user.id),
            func.date(Trip.started_at) >= seven_days_ago,
        )
        .scalar() or 0
    )

    if trip_days >= 7:
        # Weekly streak
        return award_points(db, user, 25, "Weekly streak bonus (7 consecutive days)")
    elif trip_days >= 1:
        # Check if they had a trip yesterday too (daily streak)
        yesterday = today - timedelta(days=1)
        yesterday_trips = (
            db.query(func.count(Trip.id))
            .filter(
                Trip.user_id == str(user.id),
                func.date(Trip.started_at) == yesterday,
            )
            .scalar() or 0
        )
        if yesterday_trips > 0:
            return award_points(db, user, 5, "Daily streak bonus")

    return None


# ── Redeem Points ────────────────────────────────────────────────────────────

def redeem_points(db: Session, user: User) -> dict:
    """Redeem points for a voucher.

    Requires at least REDEMPTION_RATE points in balance.
    """
    balance = user.reward_balance or 0

    if balance < REDEMPTION_RATE:
        return {
            "success": False,
            "error": f"Insufficient balance. Need {REDEMPTION_RATE} points, have {balance}.",
            "balance": balance,
        }

    user.reward_balance = balance - REDEMPTION_RATE

    txn = RewardTransaction(
        user_id=str(user.id),
        points=-REDEMPTION_RATE,
        transaction_type="redeem",
        description=f"Redeemed ₹{REDEMPTION_VALUE_INR} voucher",
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    return {
        "success": True,
        "transaction_id": str(txn.id),
        "voucher_value_inr": REDEMPTION_VALUE_INR,
        "points_deducted": REDEMPTION_RATE,
        "new_balance": user.reward_balance,
    }


# ── Ledger Query ─────────────────────────────────────────────────────────────

def get_transaction_history(
    db: Session,
    user: User,
    limit: int = 20,
) -> list[dict]:
    """Return recent reward transactions for a user."""
    txns = (
        db.query(RewardTransaction)
        .filter(RewardTransaction.user_id == str(user.id))
        .order_by(RewardTransaction.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": str(t.id),
            "points": t.points,
            "type": t.transaction_type,
            "description": t.description,
            "timestamp": t.created_at.isoformat() if t.created_at else None,
        }
        for t in txns
    ]
