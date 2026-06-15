"""Crowd Pulse Network — passive telemetry ingestion and verification.

Transforms passengers into anonymous telemetry nodes by:
1. Accepting sensor captures (GPS, accelerometer, gyroscope, stop sequences)
2. Running fraud prevention checks (GPS validation, speed checks, duplicates)
3. Matching captures to known transit routes/segments
4. Scoring confidence and verifying reports
5. Awarding Yatri Points for validated contributions
"""

from __future__ import annotations

import logging
import math
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.db.models import CrowdReport, User, TransitSegment

logger = logging.getLogger(__name__)

# ── Yatri Point Awards ───────────────────────────────────────────────────────

POINTS_VERIFIED_TRIP = 5
POINTS_VERIFIED_REPORT = 10
POINTS_HIGH_CONFIDENCE_TELEMETRY = 2
POINTS_DAILY_STREAK = 5
POINTS_WEEKLY_STREAK = 25

# ── Fraud Prevention Thresholds ──────────────────────────────────────────────

MAX_SPEED_KMH = 120          # anything faster is likely GPS spoofing
MIN_REPORT_INTERVAL_SEC = 30  # no duplicate reports within 30s
MIN_TRUST_SCORE = 0.2        # below this, reports are auto-rejected
GPS_ACCURACY_THRESHOLD_M = 50  # reject if GPS accuracy is too low


@dataclass
class TelemetryPayload:
    """Sensor data uploaded by a user's device."""
    user_id: str
    lat: float
    lng: float
    speed_kmh: float | None = None
    heading: float | None = None
    gps_accuracy_m: float | None = None
    accelerometer: list[float] | None = None  # [x, y, z]
    gyroscope: list[float] | None = None
    stop_sequence: list[str] | None = None    # ordered stop IDs passed
    timestamp: float | None = None            # unix timestamp


@dataclass
class CrowdReportPayload:
    """A user-submitted observation about transit conditions."""
    user_id: str
    report_type: str       # delay | congestion | breakdown | route_deviation
    lat: float
    lng: float
    segment_id: str | None = None
    vehicle_id: str | None = None
    congestion_level: str | None = None   # low | medium | high
    delay_minutes: float | None = None
    raw_telemetry: str | None = None      # JSON string of sensor data


@dataclass
class ValidationResult:
    """Result of fraud prevention checks."""
    valid: bool
    reason: str | None = None
    confidence: float = 0.5


# ── Fraud Prevention ─────────────────────────────────────────────────────────

def validate_telemetry(payload: TelemetryPayload, user: User) -> ValidationResult:
    """Run fraud prevention checks on incoming telemetry."""

    # Trust score gate
    if (user.trust_score or 1.0) < MIN_TRUST_SCORE:
        return ValidationResult(False, "User trust score too low")

    # Speed validation
    if payload.speed_kmh is not None and payload.speed_kmh > MAX_SPEED_KMH:
        return ValidationResult(False, f"Speed {payload.speed_kmh} km/h exceeds maximum")

    # GPS accuracy check
    if payload.gps_accuracy_m is not None and payload.gps_accuracy_m > GPS_ACCURACY_THRESHOLD_M:
        return ValidationResult(False, f"GPS accuracy {payload.gps_accuracy_m}m too low")

    # Basic coordinate sanity
    if not (-90 <= payload.lat <= 90 and -180 <= payload.lng <= 180):
        return ValidationResult(False, "Invalid coordinates")

    # Compute confidence from available signals
    confidence = _compute_telemetry_confidence(payload)

    return ValidationResult(True, None, confidence)


def _compute_telemetry_confidence(payload: TelemetryPayload) -> float:
    """Compute a confidence score (0.0–1.0) for a telemetry reading."""
    score = 0.5

    # GPS accuracy bonus
    if payload.gps_accuracy_m is not None:
        if payload.gps_accuracy_m < 10:
            score += 0.2
        elif payload.gps_accuracy_m < 30:
            score += 0.1

    # Speed reasonableness bonus
    if payload.speed_kmh is not None and 0 < payload.speed_kmh < 80:
        score += 0.1

    # Multi-sensor bonus (accelerometer + gyroscope present)
    if payload.accelerometer and payload.gyroscope:
        score += 0.15

    # Stop sequence consistency bonus
    if payload.stop_sequence and len(payload.stop_sequence) >= 2:
        score += 0.1

    return min(1.0, score)


# ── Report Processing ────────────────────────────────────────────────────────

def validate_crowd_report(
    db: Session,
    payload: CrowdReportPayload,
    user: User,
) -> ValidationResult:
    """Validate a crowd-submitted report."""

    if (user.trust_score or 1.0) < MIN_TRUST_SCORE:
        return ValidationResult(False, "User trust score too low")

    # Duplicate detection: check for recent reports from same user
    recent = (
        db.query(CrowdReport)
        .filter(
            CrowdReport.user_id == payload.user_id,
            CrowdReport.report_type == payload.report_type,
        )
        .order_by(CrowdReport.created_at.desc())
        .first()
    )
    if recent:
        time_diff = (datetime.utcnow() - recent.created_at).total_seconds()
        if time_diff < MIN_REPORT_INTERVAL_SEC:
            return ValidationResult(False, "Duplicate report — too soon")

    # Coordinate sanity
    if not (-90 <= payload.lat <= 90 and -180 <= payload.lng <= 180):
        return ValidationResult(False, "Invalid coordinates")

    # Cross-reference with known segments
    confidence = 0.5
    if payload.segment_id:
        segment = (
            db.query(TransitSegment)
            .filter(TransitSegment.segment_id == payload.segment_id)
            .first()
        )
        if segment:
            confidence += 0.2  # known segment boost

    # Vehicle ID present adds confidence
    if payload.vehicle_id:
        confidence += 0.1

    return ValidationResult(True, None, min(1.0, confidence))


def process_crowd_report(
    db: Session,
    payload: CrowdReportPayload,
    user: User,
) -> dict:
    """Validate and store a crowd report. Awards points if valid."""
    validation = validate_crowd_report(db, payload, user)

    if not validation.valid:
        return {
            "accepted": False,
            "reason": validation.reason,
            "points_awarded": 0,
        }

    report = CrowdReport(
        user_id=payload.user_id,
        segment_id=payload.segment_id,
        vehicle_id=payload.vehicle_id,
        report_type=payload.report_type,
        congestion_level=payload.congestion_level,
        delay_minutes=payload.delay_minutes,
        lat=payload.lat,
        lng=payload.lng,
        verified=validation.confidence >= 0.7,
        confidence=validation.confidence,
        raw_telemetry=payload.raw_telemetry,
    )
    db.add(report)

    # Award Yatri Points
    points = POINTS_VERIFIED_REPORT if validation.confidence >= 0.7 else POINTS_HIGH_CONFIDENCE_TELEMETRY
    user.reward_balance = (user.reward_balance or 0) + points

    # Adjust trust score based on report quality
    if validation.confidence >= 0.7:
        user.trust_score = min(1.0, (user.trust_score or 0.5) + 0.01)
    elif validation.confidence < 0.3:
        user.trust_score = max(0.0, (user.trust_score or 0.5) - 0.02)

    db.commit()
    db.refresh(report)

    return {
        "accepted": True,
        "report_id": str(report.id),
        "confidence": validation.confidence,
        "verified": report.verified,
        "points_awarded": points,
        "new_balance": user.reward_balance,
    }
