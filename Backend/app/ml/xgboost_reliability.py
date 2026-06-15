"""XGBoost-based Trip Reliability Score (TRS) computation.

The TRS is the primary metric in Namma Transit.  It predicts how
*trustworthy* a transit trip is on a 0–100 scale.

Bands:
    90–100  Exceptional
    80–89   Reliable
    60–79   Moderate
    40–59   Risk
     0–39   Avoid
"""

from __future__ import annotations

import logging
import math
import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)

# ── TRS Band Thresholds ──────────────────────────────────────────────────────

TRS_BANDS = {
    "exceptional": (90, 100),
    "reliable":    (80, 89),
    "moderate":    (60, 79),
    "risk":        (40, 59),
    "avoid":       (0, 39),
}


def trs_band(score: int) -> str:
    for band, (lo, hi) in TRS_BANDS.items():
        if lo <= score <= hi:
            return band
    return "avoid"


# ── Feature Extraction ───────────────────────────────────────────────────────

@dataclass
class TRSFeatures:
    """Feature vector fed into the XGBoost model."""

    # Historical (from transit_segments / past trips)
    hist_avg_delay_sec: float = 0.0
    hist_adherence_pct: float = 95.0        # schedule adherence %
    hist_avg_congestion: float = 0.2        # 0.0–1.0

    # Realtime
    rt_traffic_factor: float = 1.0          # 1.0 = normal, >1 = congested
    rt_weather_risk: float = 0.0            # 0–10 composite
    rt_gps_confidence: float = 0.9          # 0.0–1.0
    rt_crowd_delay_avg: float = 0.0         # avg crowd-reported delay (min)

    # Contextual
    ctx_is_weekday: bool = True
    ctx_is_peak_hour: bool = False
    ctx_is_holiday: bool = False
    ctx_is_festival: bool = False

    # Transfer-specific
    transfer_count: int = 0
    transfer_buffer_sec: int = 300          # wait time between legs
    transfer_connection_risk: float = 0.1   # 0.0–1.0

    def to_array(self) -> np.ndarray:
        return np.array([
            self.hist_avg_delay_sec,
            self.hist_adherence_pct,
            self.hist_avg_congestion,
            self.rt_traffic_factor,
            self.rt_weather_risk,
            self.rt_gps_confidence,
            self.rt_crowd_delay_avg,
            float(self.ctx_is_weekday),
            float(self.ctx_is_peak_hour),
            float(self.ctx_is_holiday),
            float(self.ctx_is_festival),
            float(self.transfer_count),
            float(self.transfer_buffer_sec),
            self.transfer_connection_risk,
        ], dtype=np.float32).reshape(1, -1)


# ── XGBoost Model Wrapper ───────────────────────────────────────────────────

_model = None


def _load_model():
    """Load a pre-trained XGBoost model from disk.

    Falls back to a rule-based estimator when no trained model exists
    (expected during initial development / hackathon).
    """
    global _model
    try:
        import xgboost as xgb
        _model = xgb.Booster()
        _model.load_model("./models/trs_xgboost_v1.json")
        logger.info("XGBoost TRS model loaded from disk.")
    except Exception:
        _model = None
        logger.warning(
            "No trained XGBoost model found — using rule-based TRS estimator."
        )


def predict_trs(features: TRSFeatures) -> int:
    """Return a TRS score (0–100) for the given feature set.

    Uses the XGBoost model if available, otherwise applies a
    deterministic rule-based formula that mirrors the model's logic.
    """
    if _model is not None:
        try:
            import xgboost as xgb
            dmatrix = xgb.DMatrix(features.to_array())
            raw = float(_model.predict(dmatrix)[0])
            return max(0, min(100, int(round(raw))))
        except Exception as exc:
            logger.error("XGBoost prediction failed, falling back: %s", exc)

    return _rule_based_trs(features)


def _rule_based_trs(f: TRSFeatures) -> int:
    """Deterministic TRS estimator — mirrors trained model intent."""
    score = 100.0

    # Historical penalties
    score -= min(20, f.hist_avg_delay_sec / 30)        # up to -20 for heavy delays
    score -= (100 - f.hist_adherence_pct) * 0.3        # adherence gap penalty
    score -= f.hist_avg_congestion * 10                 # congestion penalty

    # Realtime penalties
    score -= max(0, (f.rt_traffic_factor - 1.0)) * 15  # traffic above normal
    score -= f.rt_weather_risk * 1.5                    # weather risk
    score -= (1 - f.rt_gps_confidence) * 10             # GPS uncertainty
    score -= f.rt_crowd_delay_avg * 2.5                 # crowd-reported delays

    # Contextual adjustments
    if f.ctx_is_peak_hour:
        score -= 5
    if f.ctx_is_holiday:
        score -= 3
    if f.ctx_is_festival:
        score -= 4
    if not f.ctx_is_weekday:
        score += 2  # weekends generally calmer for transit

    # Transfer penalties (cumulative)
    score -= f.transfer_count * 6
    score -= f.transfer_connection_risk * 15
    if f.transfer_buffer_sec < 180:
        score -= 8  # tight connection

    return max(0, min(100, int(round(score))))


# ── Segment-Level Reliability ────────────────────────────────────────────────

def segment_reliability(
    avg_delay_sec: float,
    avg_congestion: float,
    peak_delay_multiplier: float,
    is_peak: bool,
) -> float:
    """Return a segment reliability score 0–100."""
    base = 100.0
    base -= min(25, avg_delay_sec / 20)
    base -= avg_congestion * 20
    if is_peak:
        base -= (peak_delay_multiplier - 1.0) * 15
    return max(0.0, min(100.0, base))


# ── Route-Level TRS Aggregation ──────────────────────────────────────────────

def aggregate_route_trs(segment_scores: list[float], transfer_risks: list[float]) -> int:
    """Aggregate segment and transfer scores into a single route TRS."""
    if not segment_scores:
        return 50  # neutral default
    avg_segment = sum(segment_scores) / len(segment_scores)
    min_segment = min(segment_scores)
    # Weakest link gets extra weight — a single terrible segment drags TRS
    blended = 0.6 * avg_segment + 0.4 * min_segment
    # Transfer risk deductions
    for risk in transfer_risks:
        blended -= risk * 12
    return max(0, min(100, int(round(blended))))


# ── Weekly Retraining Stub ───────────────────────────────────────────────────

def retrain_model():
    """Placeholder for weekly automated XGBoost retraining.

    In production this fetches recent trip outcomes from the DB,
    prepares feature matrices, and calls xgb.train().
    """
    logger.info("XGBoost TRS model retraining triggered (stub).")
    # TODO: Implement real retraining pipeline
    pass
