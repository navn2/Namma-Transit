from datetime import datetime, timezone
import uuid
from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, JSON
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.db.session import Base

def _uuid():
    return str(uuid.uuid4())


# ─── USER ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    phone_number = Column(String(20), unique=True, nullable=True, index=True)
    city = Column(String(100), nullable=False, default="Chennai")
    language = Column(String(10), nullable=False, default="ta")  # ISO 639-1
    theme = Column(String(10), nullable=False, default="dark")
    reward_balance = Column(Integer, nullable=False, default=0)
    trust_score = Column(Float, nullable=False, default=1.0)  # 0.0 – 1.0
    push_subscription = Column(Text, nullable=True)
    # Notification preferences
    notifications_delay_alerts = Column(Boolean, nullable=False, default=True)
    notifications_transfer_risk = Column(Boolean, nullable=False, default=True)
    notifications_weekly = Column(Boolean, nullable=False, default=True)
    notifications_daily_report = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan")
    reliability_history = relationship("ReliabilityHistory", back_populates="user", cascade="all, delete-orphan")
    forecasts = relationship("ReliabilityForecast", back_populates="user", cascade="all, delete-orphan")
    otps = relationship("OTPToken", back_populates="user", cascade="all, delete-orphan")
    crowd_reports = relationship("CrowdReport", back_populates="user", cascade="all, delete-orphan")
    reward_transactions = relationship("RewardTransaction", back_populates="user", cascade="all, delete-orphan")


# ─── AUTH ────────────────────────────────────────────────────────────────────

class OTPToken(Base):
    __tablename__ = "otp_tokens"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    email = Column(String(255), nullable=False, index=True)
    otp_code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, nullable=False, default=False)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)

    user = relationship("User", back_populates="otps")


# ─── TRANSIT CORE ────────────────────────────────────────────────────────────

class Route(Base):
    """A scheduled transit route with metadata."""
    __tablename__ = "routes"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    route_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    vehicle_type = Column(String(20), nullable=False)  # bus | metro | rail
    operator = Column(String(50), nullable=False, default="MTC")
    stops = Column(JSON().with_variant(JSONB, "postgresql"), nullable=True)  # ordered list of stop names/IDs
    frequency_peak_min = Column(Integer, nullable=False, default=10)
    frequency_offpeak_min = Column(Integer, nullable=False, default=20)
    operating_start = Column(String(5), nullable=False, default="05:00")  # HH:MM
    operating_end = Column(String(5), nullable=False, default="23:00")    # HH:MM
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Vehicle(Base):
    """Real-time state of a tracked transit vehicle."""
    __tablename__ = "vehicles"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    vehicle_id = Column(String(50), unique=True, nullable=False, index=True)
    route_id = Column(String(50), nullable=False, index=True)
    vehicle_type = Column(String(20), nullable=False)  # bus | metro | rail
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)  # degrees 0–360
    speed_kmh = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=False, default=0.5)
    last_seen = Column(DateTime, nullable=False, default=datetime.utcnow)
    metadata_json = Column(Text, nullable=True)  # extra info (operator, license plate, etc.)


class TransitSegment(Base):
    """A segment of a transit route with reliability metrics."""
    __tablename__ = "transit_segments"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    segment_id = Column(String(50), unique=True, nullable=False, index=True)
    geom = Column(Text().with_variant(Geometry("LINESTRING", srid=4326), "postgresql"), nullable=True)
    route_id = Column(String(50), nullable=True, index=True)
    avg_delay_sec = Column(Float, nullable=False, default=0)
    avg_congestion = Column(Float, nullable=False, default=0)  # 0.0 – 1.0
    reliability_score = Column(Float, nullable=False, default=80.0)  # 0 – 100
    delay_history = Column(JSON().with_variant(JSONB, "postgresql"), nullable=True)  # recent delay samples
    peak_delay_multiplier = Column(Float, nullable=False, default=1.0)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


# ─── TRIPS ───────────────────────────────────────────────────────────────────

class Trip(Base):
    __tablename__ = "trips"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lng = Column(Float, nullable=False)
    route_type = Column(String(30), nullable=False)  # bus | metro | rail | multimodal
    duration_min = Column(Integer, nullable=True)
    distance_km = Column(Float, nullable=True)
    trs = Column(Integer, nullable=True)  # Trip Reliability Score 0–100
    fare_inr = Column(Float, nullable=True)
    transfers = Column(Integer, nullable=False, default=0)
    actual_delay_sec = Column(Integer, nullable=True)
    polyline = Column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    segment_ids = Column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    reward_points_earned = Column(Integer, nullable=False, default=0)

    user = relationship("User", back_populates="trips")


# ─── RELIABILITY & FORECASTS ────────────────────────────────────────────────

class ReliabilityHistory(Base):
    """Per-user daily reliability statistics."""
    __tablename__ = "reliability_history"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_user_reliability_date"),)

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    total_trips = Column(Integer, nullable=False, default=0)
    avg_trs = Column(Float, nullable=False, default=0)
    total_delay_sec = Column(Integer, nullable=False, default=0)
    reward_points_earned = Column(Integer, nullable=False, default=0)

    user = relationship("User", back_populates="reliability_history")


class ReliabilityForecast(Base):
    """ML-generated reliability forecast for a user's commute."""
    __tablename__ = "reliability_forecasts"
    __table_args__ = (UniqueConstraint("user_id", "forecast_date", name="uq_user_rel_forecast_date"),)

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    forecast_date = Column(Date, nullable=False)
    risk_level = Column(String(15), nullable=False)  # exceptional | reliable | moderate | risk | avoid
    predicted_delay_sec = Column(Integer, nullable=False, default=0)
    recommended_departure = Column(String(10), nullable=True)
    recommended_route = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    generated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="forecasts")


# ─── CROWD PULSE NETWORK ────────────────────────────────────────────────────

class CrowdReport(Base):
    """A crowd-sourced observation from a transit user."""
    __tablename__ = "crowd_reports"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    segment_id = Column(String(50), nullable=True, index=True)
    vehicle_id = Column(String(50), nullable=True)
    report_type = Column(String(30), nullable=False)  # delay | congestion | breakdown | route_deviation
    congestion_level = Column(String(10), nullable=True)  # low | medium | high
    delay_minutes = Column(Float, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    verified = Column(Boolean, nullable=False, default=False)
    confidence = Column(Float, nullable=False, default=0.5)
    raw_telemetry = Column(Text, nullable=True)  # JSON blob of sensor data
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="crowd_reports")


# ─── REWARDS ─────────────────────────────────────────────────────────────────

class RewardTransaction(Base):
    """Yatri Points ledger entry."""
    __tablename__ = "reward_transactions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    points = Column(Integer, nullable=False)
    transaction_type = Column(String(10), nullable=False)  # earn | redeem
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="reward_transactions")


# ─── EQUITY CHANNELS ────────────────────────────────────────────────────────

class SMSAlertSubscription(Base):
    """Users who subscribe to SMS delay alerts for a route."""
    __tablename__ = "sms_alert_subscriptions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    phone_number = Column(String(20), nullable=False, index=True)
    route_id = Column(String(50), nullable=False)
    language = Column(String(10), nullable=False, default="ta")
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class IVRRequestLog(Base):
    """Log of IVR voice lookups."""
    __tablename__ = "ivr_request_logs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    phone_number = Column(String(20), nullable=False, index=True)
    stop_name = Column(String(200), nullable=True)
    resolved_lat = Column(Float, nullable=True)
    resolved_lng = Column(Float, nullable=True)
    vehicles_returned = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
