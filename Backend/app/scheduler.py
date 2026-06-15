"""Namma Transit scheduler — background jobs for transit intelligence."""

from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from app.realtime.ws_gateway import manager
from app.ml.load_tracker import cleanup_stale_vehicles

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(daemon=True)
_started = False


def _det_broadcast_val(seed: str, lo: int, hi: int) -> int:
    """Deterministic integer in [lo, hi] from a minute-aligned seed.

    Changes only when the minute ticks over, so broadcasts stay
    consistent within each minute but vary across time.
    """
    h = int(hashlib.md5(f"{seed}_{datetime.now().strftime('%Y%m%d%H%M')}".encode()).hexdigest()[:8], 16)
    return lo + (h % (hi - lo + 1))


def _broadcast_vehicle_update():
    manager.broadcast("vehicles", "vehicle_update", {
        "count": _det_broadcast_val("vehicle_count", 50, 200),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


def _broadcast_trs_update():
    manager.broadcast("trs", "trs_update", {
        "routes_updated": _det_broadcast_val("trs_routes", 5, 20),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


def _cleanup_stale_data():
    removed = cleanup_stale_vehicles()
    logger.info(f"Cleaned up {removed} stale vehicle entries")


def start_scheduler():
    global _started
    if _started:
        return
    scheduler.add_job(_broadcast_vehicle_update, "interval", seconds=30, id="ws_vehicles", replace_existing=True)
    scheduler.add_job(_broadcast_trs_update, "interval", minutes=5, id="ws_trs", replace_existing=True)
    scheduler.add_job(_cleanup_stale_data, "interval", minutes=10, id="cleanup_vehicles", replace_existing=True)
    scheduler.start()
    _started = True
    logger.info("Namma Transit scheduler started")


def stop_scheduler():
    global _started
    if scheduler.running:
        scheduler.shutdown(wait=False)
    _started = False
