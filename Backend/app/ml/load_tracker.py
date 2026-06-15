"""Transit vehicle occupancy and route load tracker.

Tracks how many active users are on a given transit route or vehicle
using in-memory dictionaries (Redis-compatible interface for production).
"""

from __future__ import annotations

import logging
import time
from collections import defaultdict
from typing import Any
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Global Redis client connection (fallback to local mock if none configured)
_redis = None
if settings.REDIS_URL:
    try:
        _redis = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
        _redis.ping()
        logger.info("Connected to Redis cache successfully for load tracking.")
    except Exception as e:
        logger.warning(f"Failed to connect to Redis ({e}). Falling back to in-memory load tracker.")
        _redis = None

# In-memory stores (fallback/mock)
_vehicle_occupancy: dict[str, int] = defaultdict(int)
_route_load: dict[str, int] = defaultdict(int)
_route_inflow: dict[str, list[float]] = defaultdict(list)  # timestamps of recent route assignments
_vehicle_last_seen: dict[str, float] = {}

# Capacity thresholds per vehicle type
VEHICLE_CAPACITY = {
    "bus": 60,
    "metro": 300,
    "rail": 150,
    "default": 80,
}

# TTL for stale vehicle entries (seconds)
VEHICLE_TTL_SEC = 600  # 10 minutes


def register_user_on_route(route_id: str, vehicle_id: str | None = None) -> None:
    """Register a user starting a trip on a route (and optionally a vehicle)."""
    if _redis:
        try:
            _redis.incr(f"route_load:{route_id}")
            _redis.rpush(f"route_inflow:{route_id}", str(time.time()))
            _redis.expire(f"route_inflow:{route_id}", 300)
            if vehicle_id:
                _redis.incr(f"vehicle_occupancy:{vehicle_id}")
                _redis.set(f"vehicle_last_seen:{vehicle_id}", str(time.time()), ex=VEHICLE_TTL_SEC)
            logger.info(f"[REDIS CONNECTION] INCR route_load:{route_id}")
            return
        except Exception as e:
            logger.error(f"Redis write error: {e}")

    logger.info(f"[REDIS MOCK] INCR route_load:{route_id}")
    _route_load[route_id] += 1
    _route_inflow[route_id].append(time.time())
    if vehicle_id:
        logger.info(f"[REDIS MOCK] INCR vehicle_occupancy:{vehicle_id}")
        _vehicle_occupancy[vehicle_id] += 1
        _vehicle_last_seen[vehicle_id] = time.time()


def deregister_user_from_route(route_id: str, vehicle_id: str | None = None) -> None:
    """Deregister a user when they complete a trip."""
    if _redis:
        try:
            curr_route = int(_redis.get(f"route_load:{route_id}") or 0)
            if curr_route > 0:
                _redis.decr(f"route_load:{route_id}")
                logger.info(f"[REDIS CONNECTION] DECR route_load:{route_id}")
            if vehicle_id:
                curr_veh = int(_redis.get(f"vehicle_occupancy:{vehicle_id}") or 0)
                if curr_veh > 0:
                    _redis.decr(f"vehicle_occupancy:{vehicle_id}")
            return
        except Exception as e:
            logger.error(f"Redis write error: {e}")

    if _route_load[route_id] > 0:
        logger.info(f"[REDIS MOCK] DECR route_load:{route_id}")
        _route_load[route_id] -= 1
    if vehicle_id and _vehicle_occupancy[vehicle_id] > 0:
        logger.info(f"[REDIS MOCK] DECR vehicle_occupancy:{vehicle_id}")
        _vehicle_occupancy[vehicle_id] -= 1


def get_route_load(route_id: str) -> int:
    """Current number of active users on a route."""
    if _redis:
        try:
            val = int(_redis.get(f"route_load:{route_id}") or 0)
            logger.info(f"[REDIS CONNECTION] GET route_load:{route_id} -> {val}")
            return val
        except Exception as e:
            logger.error(f"Redis read error: {e}")

    val = _route_load.get(route_id, 0)
    logger.info(f"[REDIS MOCK] GET route_load:{route_id} -> {val}")
    return val


def get_vehicle_occupancy(vehicle_id: str) -> int:
    """Current tracked occupancy of a vehicle."""
    if _redis:
        try:
            val = int(_redis.get(f"vehicle_occupancy:{vehicle_id}") or 0)
            logger.info(f"[REDIS CONNECTION] GET vehicle_occupancy:{vehicle_id} -> {val}")
            return val
        except Exception as e:
            logger.error(f"Redis read error: {e}")

    val = _vehicle_occupancy.get(vehicle_id, 0)
    logger.info(f"[REDIS MOCK] GET vehicle_occupancy:{vehicle_id} -> {val}")
    return val


def get_occupancy_pct(vehicle_id: str, vehicle_type: str = "default") -> float:
    """Return occupancy as a percentage of vehicle capacity (0.0–1.0)."""
    occ = get_vehicle_occupancy(vehicle_id)
    cap = VEHICLE_CAPACITY.get(vehicle_type, VEHICLE_CAPACITY["default"])
    return min(1.0, occ / max(1, cap))


def get_inflow_rate(route_id: str, window_sec: int = 120) -> float:
    """Users per minute assigned to this route in the last window."""
    now = time.time()
    cutoff = now - window_sec
    if _redis:
        try:
            elements = _redis.lrange(f"route_inflow:{route_id}", 0, -1)
            timestamps = [float(x) for x in elements]
            recent = [t for t in timestamps if t >= cutoff]
            # Prune old entries in Redis
            _redis.delete(f"route_inflow:{route_id}")
            if recent:
                _redis.rpush(f"route_inflow:{route_id}", *[str(x) for x in recent])
                _redis.expire(f"route_inflow:{route_id}", 300)
                return len(recent) / (window_sec / 60.0)
            return 0.0
        except Exception as e:
            logger.error(f"Redis inflow read error: {e}")

    timestamps = _route_inflow.get(route_id, [])
    recent = [t for t in timestamps if t >= cutoff]
    _route_inflow[route_id] = recent
    if not recent:
        return 0.0
    return len(recent) / (window_sec / 60.0)


def project_load(route_id: str, minutes_ahead: int, avg_trip_duration_min: float = 30.0) -> int:
    """Project how many users will be on a route in N minutes."""
    current = get_route_load(route_id)
    inflow = get_inflow_rate(route_id)          # users/min
    outflow = current / max(1, avg_trip_duration_min)  # users/min leaving
    projected = current + (inflow - outflow) * minutes_ahead
    return max(0, int(round(projected)))


def is_overcrowded(vehicle_id: str, vehicle_type: str = "default") -> bool:
    """True if vehicle is at or above 85% capacity."""
    return get_occupancy_pct(vehicle_id, vehicle_type) >= 0.85


def crowding_level(vehicle_id: str, vehicle_type: str = "default") -> str:
    """Return a human-readable crowding level."""
    pct = get_occupancy_pct(vehicle_id, vehicle_type)
    if pct < 0.4:
        return "low"
    elif pct < 0.7:
        return "medium"
    elif pct < 0.85:
        return "high"
    else:
        return "overcrowded"


def cleanup_stale_vehicles() -> int:
    """Remove vehicles not seen within TTL. Returns count of removed."""
    now = time.time()
    stale = [
        vid for vid, ts in _vehicle_last_seen.items()
        if now - ts > VEHICLE_TTL_SEC
    ]
    for vid in stale:
        _vehicle_occupancy.pop(vid, None)
        _vehicle_last_seen.pop(vid, None)
    return len(stale)
