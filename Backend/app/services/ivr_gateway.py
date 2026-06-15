"""IVR Gateway — voice-based transit lookup service.

Provides a mock IVR interface where a caller can speak a stop name
and receive information about the next arriving vehicles.

In production, this would integrate with a telephony provider
(e.g., Twilio, Exotel) for actual voice call handling.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.db.models import IVRRequestLog, Vehicle

logger = logging.getLogger(__name__)

# ── Known stops (mock directory for development) ─────────────────────────────

_STOP_DIRECTORY: dict[str, dict] = {
    "koyambedu": {"lat": 13.0694, "lng": 80.1948, "name": "Koyambedu Bus Stand"},
    "broadway": {"lat": 13.0890, "lng": 80.2816, "name": "Broadway"},
    "tambaram": {"lat": 12.9249, "lng": 80.1000, "name": "Tambaram Railway Station"},
    "t nagar": {"lat": 13.0418, "lng": 80.2341, "name": "T. Nagar"},
    "central": {"lat": 13.0827, "lng": 80.2707, "name": "Chennai Central"},
    "egmore": {"lat": 13.0732, "lng": 80.2609, "name": "Egmore Railway Station"},
    "guindy": {"lat": 13.0067, "lng": 80.2206, "name": "Guindy"},
    "adyar": {"lat": 13.0063, "lng": 80.2574, "name": "Adyar Bus Depot"},
    "anna nagar": {"lat": 13.0860, "lng": 80.2101, "name": "Anna Nagar"},
    "vadapalani": {"lat": 13.0520, "lng": 80.2121, "name": "Vadapalani"},
    "cmbt": {"lat": 13.0694, "lng": 80.1948, "name": "CMBT"},
    "airport": {"lat": 12.9941, "lng": 80.1709, "name": "Chennai Airport"},
}


def resolve_stop(stop_name: str) -> dict | None:
    """Resolve a spoken stop name to coordinates.

    Uses fuzzy matching against the known directory.
    Returns None if no match found.
    """
    query = stop_name.strip().lower()

    # Exact match
    if query in _STOP_DIRECTORY:
        return _STOP_DIRECTORY[query]

    # Partial / substring match
    for key, data in _STOP_DIRECTORY.items():
        if query in key or key in query:
            return data

    return None


def lookup_vehicles_at_stop(
    db: Session,
    lat: float,
    lng: float,
    radius_km: float = 2.0,
) -> list[dict]:
    """Find vehicles near a resolved stop location.

    In production, this queries live GPS positions.
    For development, returns mock vehicle data.
    """
    # Try real DB first
    vehicles = db.query(Vehicle).limit(5).all()
    if vehicles:
        results = []
        for v in vehicles:
            results.append({
                "vehicle_id": v.vehicle_id,
                "route_id": v.route_id,
                "vehicle_type": v.vehicle_type,
                "eta_minutes": _mock_eta(v),
                "confidence": round(v.confidence_score, 2),
            })
        return results

    # Mock fallback for development
    return [
        {"vehicle_id": "MTC-27B-4521", "route_id": "27B", "vehicle_type": "bus", "eta_minutes": 4, "confidence": 0.85},
        {"vehicle_id": "MTC-21G-1198", "route_id": "21G", "vehicle_type": "bus", "eta_minutes": 9, "confidence": 0.72},
        {"vehicle_id": "METRO-BL-12", "route_id": "Blue Line", "vehicle_type": "metro", "eta_minutes": 3, "confidence": 0.95},
    ]


def _mock_eta(vehicle: Vehicle) -> int:
    """Generate a plausible ETA in minutes."""
    import random
    return random.randint(2, 15)


def process_ivr_call(
    db: Session,
    phone_number: str,
    spoken_stop: str,
) -> dict:
    """Process an IVR call: resolve stop → lookup vehicles → log request.

    Returns a response suitable for text-to-speech conversion.
    """
    stop = resolve_stop(spoken_stop)

    if not stop:
        log = IVRRequestLog(
            phone_number=phone_number,
            stop_name=spoken_stop,
            vehicles_returned=0,
        )
        db.add(log)
        db.commit()
        return {
            "success": False,
            "message_ta": f"'{spoken_stop}' என்ற நிறுத்தம் கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்.",
            "message_en": f"Stop '{spoken_stop}' not found. Please try again.",
            "vehicles": [],
        }

    vehicles = lookup_vehicles_at_stop(db, stop["lat"], stop["lng"])

    log = IVRRequestLog(
        phone_number=phone_number,
        stop_name=spoken_stop,
        resolved_lat=stop["lat"],
        resolved_lng=stop["lng"],
        vehicles_returned=len(vehicles),
    )
    db.add(log)
    db.commit()

    # Build voice response
    if not vehicles:
        msg_ta = f"{stop['name']} நிறுத்தத்தில் தற்போது வாகனங்கள் இல்லை."
        msg_en = f"No vehicles currently available at {stop['name']}."
    else:
        first = vehicles[0]
        msg_ta = (
            f"{stop['name']} நிறுத்தத்தில் அடுத்த வாகனம் "
            f"{first['route_id']} — {first['eta_minutes']} நிமிடங்களில் வரும்."
        )
        msg_en = (
            f"Next vehicle at {stop['name']}: "
            f"Route {first['route_id']} arriving in {first['eta_minutes']} minutes."
        )

    return {
        "success": True,
        "stop": stop,
        "message_ta": msg_ta,
        "message_en": msg_en,
        "vehicles": vehicles,
    }
