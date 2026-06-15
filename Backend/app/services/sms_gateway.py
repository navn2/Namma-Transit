"""SMS Gateway — route delay notification service.

Sends SMS alerts about transit disruptions to subscribed phone numbers.
Supports multi-language messages (Tamil-first, English fallback).

In production, integrates with an SMS provider (Twilio, MSG91, etc.).
For development, logs messages to stdout.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.db.models import SMSAlertSubscription

logger = logging.getLogger(__name__)


# ── SMS Templates ────────────────────────────────────────────────────────────

TEMPLATES = {
    "delay": {
        "ta": "⚠️ நம்ம டிரான்சிட்: {route_id} பாதையில் {delay_min} நிமிட தாமதம். மாற்று வழி: {alternative}",
        "en": "⚠️ Namma Transit: Route {route_id} delayed by {delay_min} min. Alternative: {alternative}",
    },
    "disruption": {
        "ta": "🚫 நம்ம டிரான்சிட்: {route_id} பாதை இடையூறு. காரணம்: {reason}. தயவுசெய்து மாற்று வழியைப் பயன்படுத்தவும்.",
        "en": "🚫 Namma Transit: Route {route_id} disrupted. Reason: {reason}. Please use alternatives.",
    },
    "restored": {
        "ta": "✅ நம்ம டிரான்சிட்: {route_id} பாதை சீரானது. இயல்பான சேவை மீண்டும் தொடங்கியுள்ளது.",
        "en": "✅ Namma Transit: Route {route_id} restored. Normal service resumed.",
    },
}


def format_sms(
    template_key: str,
    language: str,
    **kwargs: Any,
) -> str:
    """Format an SMS message using a template and language."""
    templates = TEMPLATES.get(template_key, {})
    template = templates.get(language, templates.get("en", ""))
    try:
        return template.format(**kwargs)
    except KeyError:
        return template


# ── Send SMS (Mock) ──────────────────────────────────────────────────────────

def send_sms(phone_number: str, message: str) -> dict:
    """Send an SMS message.

    In development: logs the message.
    In production: calls SMS API (Twilio, MSG91, etc.)
    """
    logger.info(f"[SMS → {phone_number}] {message}")

    # Mock response
    return {
        "success": True,
        "phone_number": phone_number,
        "message": message,
        "provider": "mock",
        "timestamp": datetime.utcnow().isoformat(),
    }


# ── Subscription Management ─────────────────────────────────────────────────

def subscribe(
    db: Session,
    phone_number: str,
    route_id: str,
    language: str = "ta",
) -> dict:
    """Subscribe a phone number to delay alerts for a route."""
    # Check for existing subscription
    existing = (
        db.query(SMSAlertSubscription)
        .filter(
            SMSAlertSubscription.phone_number == phone_number,
            SMSAlertSubscription.route_id == route_id,
        )
        .first()
    )

    if existing:
        if existing.active:
            return {"success": True, "message": "Already subscribed", "subscription_id": str(existing.id)}
        else:
            existing.active = True
            existing.language = language
            db.commit()
            return {"success": True, "message": "Subscription reactivated", "subscription_id": str(existing.id)}

    sub = SMSAlertSubscription(
        phone_number=phone_number,
        route_id=route_id,
        language=language,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    # Send confirmation SMS
    confirm_msg = format_sms(
        "restored",  # reusing restored template for confirmation style
        language,
        route_id=route_id,
    ).replace("restored", "subscribed")
    send_sms(phone_number, f"நம்ம டிரான்சிட்: Route {route_id} alerts subscribed ✅")

    return {
        "success": True,
        "subscription_id": str(sub.id),
        "message": f"Subscribed to alerts for route {route_id}",
    }


def unsubscribe(
    db: Session,
    phone_number: str,
    route_id: str,
) -> dict:
    """Unsubscribe from alerts for a route."""
    sub = (
        db.query(SMSAlertSubscription)
        .filter(
            SMSAlertSubscription.phone_number == phone_number,
            SMSAlertSubscription.route_id == route_id,
        )
        .first()
    )

    if not sub:
        return {"success": False, "message": "No subscription found"}

    sub.active = False
    db.commit()

    return {"success": True, "message": f"Unsubscribed from route {route_id} alerts"}


# ── Broadcast Alerts ─────────────────────────────────────────────────────────

def broadcast_delay_alert(
    db: Session,
    route_id: str,
    delay_min: int,
    alternative: str = "Check app for alternatives",
) -> dict:
    """Send delay alerts to all subscribers of a route."""
    subscribers = (
        db.query(SMSAlertSubscription)
        .filter(
            SMSAlertSubscription.route_id == route_id,
            SMSAlertSubscription.active == True,
        )
        .all()
    )

    sent = 0
    for sub in subscribers:
        message = format_sms(
            "delay",
            sub.language,
            route_id=route_id,
            delay_min=delay_min,
            alternative=alternative,
        )
        result = send_sms(sub.phone_number, message)
        if result["success"]:
            sent += 1

    return {
        "route_id": route_id,
        "subscribers_notified": sent,
        "total_subscribers": len(subscribers),
    }
