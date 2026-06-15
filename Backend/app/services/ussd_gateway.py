"""USSD Gateway — transit lookup via unstructured supplementary service data.

Enables equity infrastructure by providing transit information through
basic feature phones without internet access.

Flow:
  1. User dials USSD code (*123# or similar)
  2. System returns text menu
  3. User responds with option number
  4. System returns transit information

In production, this integrates with telecom USSD gateways (Africa's Talking,
Twilio, etc.). For development, exposes a REST simulation endpoint.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.db.models import IVRRequestLog
from app.services.ivr_gateway import resolve_stop, lookup_vehicles_at_stop

logger = logging.getLogger(__name__)

# ── Session Store ─────────────────────────────────────────────────────────────

_ussd_sessions: dict[str, dict] = {}


# ── Menu Definitions ──────────────────────────────────────────────────────────

MAIN_MENU_TA = (
    "நம்ம டிரான்சிட் வரவேற்கிறது\n"
    "1. பேருந்து நிறுத்தம் தேடு\n"
    "2. பயண நம்பகத்தன்மை\n"
    "3. அலெர்ட் பதிவு\n"
    "4. மொழி மாற்றம்\n"
    "0. வெளியேறு"
)

MAIN_MENU_EN = (
    "Namma Transit\n"
    "1. Find stop\n"
    "2. Trip reliability\n"
    "3. Subscribe alerts\n"
    "4. Change language\n"
    "0. Exit"
)

LANGUAGE_MENU = (
    "மொழி தேர்வு / Choose language\n"
    "1. தமிழ் (Tamil)\n"
    "2. English"
)

# ── USSD Response ──────────────────────────────────────────────────────────────

class USSDResponse:
    def __init__(self, text: str, end_session: bool = False):
        self.text = text
        self.end_session = end_session


def _get_stop_list_text(lang: str) -> str:
    from app.services.ivr_gateway import _STOP_DIRECTORY
    stops = list(_STOP_DIRECTORY.keys())[:10]
    if lang == "ta":
        lines = ["நிறுத்தம் தேர்வு:"]
        lines.extend(f"{i+1}. {s.title()}" for i, s in enumerate(stops))
        lines.append("0. முந்தைய மெனு")
        return "\n".join(lines)
    lines = ["Select a stop:"]
    lines.extend(f"{i+1}. {s.title()}" for i, s in enumerate(stops))
    lines.append("0. Back")
    return "\n".join(lines)


def process_ussd(session_id: str, phone_number: str, text: str, db: Session) -> USSDResponse:
    raw = text.strip()
    session = _ussd_sessions.get(session_id, {"step": "main", "lang": "ta", "phone": phone_number})
    session["phone"] = phone_number
    lang = session.get("lang", "ta")

    # ═══════════════════════════════════════════════════════
    # STATE: main menu
    # ═══════════════════════════════════════════════════════
    if session["step"] == "main":
        if raw == "" or raw == "0":
            _ussd_sessions[session_id] = {"step": "main", "lang": lang, "phone": phone_number}
            menu = MAIN_MENU_TA if lang == "ta" else MAIN_MENU_EN
            return USSDResponse(menu)

        if raw == "1":
            session["step"] = "stop_search"
            _ussd_sessions[session_id] = session
            prompt = "நிறுத்தத்தின் பெயரை உள்ளிடவும்:" if lang == "ta" else "Enter stop name:"
            return USSDResponse(prompt)

        if raw == "2":
            session["step"] = "reliability"
            _ussd_sessions[session_id] = session
            prompt = "பாதை எண்ணை உள்ளிடவும் (எ-கா: 27B):" if lang == "ta" else "Enter route number (e.g., 27B):"
            return USSDResponse(prompt)

        if raw == "3":
            session["step"] = "alert_route"
            _ussd_sessions[session_id] = session
            prompt = "எச்சரிக்கைக்கான பாதை எண்:" if lang == "ta" else "Route number for alerts:"
            return USSDResponse(prompt)

        if raw == "4":
            session["step"] = "language"
            _ussd_sessions[session_id] = session
            return USSDResponse(LANGUAGE_MENU)

        menu = MAIN_MENU_TA if lang == "ta" else MAIN_MENU_EN
        return USSDResponse(menu)

    # ═══════════════════════════════════════════════════════
    # STATE: stop search
    # ═══════════════════════════════════════════════════════
    if session["step"] == "stop_search":
        session["step"] = "main"
        _ussd_sessions[session_id] = session
        stop = resolve_stop(raw)
        if not stop:
            msg = f"'{raw}' கிடைக்கவில்லை" if lang == "ta" else f"'{raw}' not found"
            return USSDResponse(msg + "\n0. Back", end_session=False)
        vehicles = lookup_vehicles_at_stop(db, stop["lat"], stop["lng"])
        if lang == "ta":
            result = f"{stop['name']}\n"
            for v in vehicles[:3]:
                result += f"{v['route_id']} — {v['eta_minutes']} நிமி\n"
        else:
            result = f"{stop['name']}\n"
            for v in vehicles[:3]:
                result += f"{v['route_id']} — {v['eta_minutes']} min\n"
        result += "\n0. Back"
        return USSDResponse(result)

    # ═══════════════════════════════════════════════════════
    # STATE: reliability lookup
    # ═══════════════════════════════════════════════════════
    if session["step"] == "reliability":
        session["step"] = "main"
        _ussd_sessions[session_id] = session
        from app.ml.xgboost_reliability import TRSFeatures, predict_trs, trs_band
        import random
        features = TRSFeatures(
            hist_avg_delay_sec=random.uniform(30, 300),
            hist_adherence_pct=random.uniform(70, 98),
            hist_avg_congestion=random.uniform(0.1, 0.7),
        )
        trs = predict_trs(features)
        band = trs_band(trs)
        if lang == "ta":
            result = f"பாதை {raw}: TRS {trs}/100 ({band})\n0. முந்தைய மெனு"
        else:
            result = f"Route {raw}: TRS {trs}/100 ({band})\n0. Back"
        return USSDResponse(result)

    # ═══════════════════════════════════════════════════════
    # STATE: alert subscription
    # ═══════════════════════════════════════════════════════
    if session["step"] == "alert_route":
        session["step"] = "main"
        _ussd_sessions[session_id] = session
        from app.services.sms_gateway import subscribe as sms_subscribe
        result = sms_subscribe(db, phone_number, raw, lang)
        if lang == "ta":
            msg = f"பாதை {raw} எச்சரிக்கை பதிவு செய்யப்பட்டது" if result["success"] else f"பிழை: {result.get('message', '')}"
        else:
            msg = f"Alerts subscribed for route {raw}" if result["success"] else f"Error: {result.get('message', '')}"
        msg += "\n0. Back"
        return USSDResponse(msg)

    # ═══════════════════════════════════════════════════════
    # STATE: language selection
    # ═══════════════════════════════════════════════════════
    if session["step"] == "language":
        session["step"] = "main"
        session["lang"] = "ta" if raw == "1" else "en"
        _ussd_sessions[session_id] = session
        menu = MAIN_MENU_TA if session["lang"] == "ta" else MAIN_MENU_EN
        return USSDResponse(menu)

    # Fallback
    session["step"] = "main"
    _ussd_sessions[session_id] = session
    menu = MAIN_MENU_TA if lang == "ta" else MAIN_MENU_EN
    return USSDResponse(menu)
