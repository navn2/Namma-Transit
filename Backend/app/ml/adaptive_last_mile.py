"""Adaptive Last-Mile Protection — transfer risk and alternative routing.

Prevents missed connections by computing transfer failure probability
and suggesting alternatives when delays push the risk above threshold.

Supported transfer patterns:
    Bus  → Metro
    Bus  → Train
    Metro → Bus
    Metro → Train
    Train → Metro
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

logger = logging.getLogger(__name__)

# Transfer risk threshold — above this value, alternative routing kicks in
TRANSFER_RISK_THRESHOLD = 0.60  # 60% chance of failure → trigger alert

# Minimum buffer (seconds) for a connection to be considered "safe"
SAFE_BUFFER_SEC = 300  # 5 minutes


@dataclass
class TransferLeg:
    """Represents one leg of a multi-modal trip."""
    mode: str                  # bus | metro | rail
    route_id: str
    departure_stop: str
    arrival_stop: str
    scheduled_arrival: datetime
    predicted_delay_sec: int = 0
    segment_reliability: float = 80.0  # 0–100


@dataclass
class TransferConnection:
    """The gap between two consecutive legs where a transfer happens."""
    from_leg: TransferLeg
    to_leg: TransferLeg
    scheduled_buffer_sec: int     # planned wait time between arrival & departure
    walk_time_sec: int = 120      # estimated walking time at transfer point


@dataclass
class TransferRisk:
    """Result of transfer risk analysis."""
    connection: TransferConnection
    failure_probability: float     # 0.0 – 1.0
    effective_buffer_sec: int      # remaining buffer after delay
    risk_level: str                # safe | warning | critical
    alternative_suggested: bool
    alternative_description: str | None = None


def compute_transfer_risk(connection: TransferConnection) -> TransferRisk:
    """Compute the probability that a transfer will fail.

    The model considers:
      - Scheduled buffer vs predicted delay on the arriving leg
      - Walking time at the transfer station
      - Reliability score of both legs
    """
    arriving = connection.from_leg
    departing = connection.to_leg

    # Effective buffer = scheduled buffer - arriving delay - walk time
    effective_buffer = (
        connection.scheduled_buffer_sec
        - arriving.predicted_delay_sec
        - connection.walk_time_sec
    )

    # Base failure probability from buffer analysis
    if effective_buffer >= SAFE_BUFFER_SEC:
        base_prob = 0.05  # very safe
    elif effective_buffer >= 180:
        base_prob = 0.15
    elif effective_buffer >= 60:
        base_prob = 0.40
    elif effective_buffer > 0:
        base_prob = 0.65
    else:
        base_prob = 0.90  # almost certainly missed

    # Reliability adjustment: low reliability on either leg amplifies risk
    reliability_factor = 1.0
    if arriving.segment_reliability < 60:
        reliability_factor += 0.2
    if departing.segment_reliability < 60:
        reliability_factor += 0.1

    failure_prob = min(1.0, base_prob * reliability_factor)

    # Determine risk level
    if failure_prob < 0.20:
        risk_level = "safe"
    elif failure_prob < TRANSFER_RISK_THRESHOLD:
        risk_level = "warning"
    else:
        risk_level = "critical"

    # Suggest alternative when critical
    suggest = failure_prob >= TRANSFER_RISK_THRESHOLD
    alt_desc = None
    if suggest:
        alt_desc = _suggest_alternative(connection)

    return TransferRisk(
        connection=connection,
        failure_probability=round(failure_prob, 3),
        effective_buffer_sec=max(0, effective_buffer),
        risk_level=risk_level,
        alternative_suggested=suggest,
        alternative_description=alt_desc,
    )


def _suggest_alternative(connection: TransferConnection) -> str:
    """Generate a human-readable alternative suggestion."""
    from_mode = connection.from_leg.mode
    to_mode = connection.to_leg.mode
    return (
        f"Consider taking an earlier {from_mode} departure or "
        f"switching to a direct {to_mode} route from "
        f"{connection.from_leg.departure_stop} to avoid the transfer "
        f"at {connection.from_leg.arrival_stop}."
    )


def evaluate_trip_transfers(legs: list[TransferLeg]) -> list[TransferRisk]:
    """Evaluate all transfer connections in a multi-modal trip.

    Returns a list of TransferRisk objects — one for each connection
    between consecutive legs.
    """
    risks: list[TransferRisk] = []
    for i in range(len(legs) - 1):
        from_leg = legs[i]
        to_leg = legs[i + 1]

        # Estimate scheduled buffer from leg timing
        arrival = from_leg.scheduled_arrival + timedelta(
            seconds=from_leg.predicted_delay_sec
        )
        # Assume departing leg leaves at its scheduled time
        scheduled_departure = to_leg.scheduled_arrival - timedelta(
            minutes=to_leg.segment_reliability / 20  # rough estimate
        )
        buffer_sec = max(0, int((scheduled_departure - from_leg.scheduled_arrival).total_seconds()))

        conn = TransferConnection(
            from_leg=from_leg,
            to_leg=to_leg,
            scheduled_buffer_sec=buffer_sec,
        )
        risks.append(compute_transfer_risk(conn))

    return risks


def overall_transfer_risk(risks: list[TransferRisk]) -> float:
    """Aggregate transfer risks into a single trip-level risk value.

    Uses the maximum failure probability across all connections —
    a trip is only as reliable as its weakest transfer.
    """
    if not risks:
        return 0.0
    return max(r.failure_probability for r in risks)
