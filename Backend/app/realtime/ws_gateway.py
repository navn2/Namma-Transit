"""WebSocket realtime event gateway.

Channels:
  /ws/vehicles      — live vehicle position updates
  /ws/delays        — delay alerts
  /ws/trs           — TRS updates
  /ws/alerts        — triggered alerts
  /ws/rewards       — reward earned notifications
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self._rooms: dict[str, set[WebSocket]] = {}

    def _room(self, name: str) -> set[WebSocket]:
        if name not in self._rooms:
            self._rooms[name] = set()
        return self._rooms[name]

    async def connect(self, ws: WebSocket, room: str):
        await ws.accept()
        self._room(room).add(ws)
        logger.info(f"WebSocket connected to room '{room}' (total: {len(self._room(room))})")

    def disconnect(self, ws: WebSocket, room: str):
        self._room(room).discard(ws)
        if not self._room(room):
            self._rooms.pop(room, None)
        logger.info(f"WebSocket disconnected from room '{room}'")

    async def broadcast(self, room: str, event: str, data: Any):
        payload = json.dumps({"event": event, "data": data, "timestamp": datetime.now(timezone.utc).isoformat()})
        stale = set()
        for ws in self._room(room):
            try:
                await ws.send_text(payload)
            except Exception:
                stale.add(ws)
        for ws in stale:
            self.disconnect(ws, room)

    async def broadcast_to_all(self, event: str, data: Any):
        payload = json.dumps({"event": event, "data": data, "timestamp": datetime.now(timezone.utc).isoformat()})
        for room in list(self._rooms.keys()):
            stale = set()
            for ws in self._room(room):
                try:
                    await ws.send_text(payload)
                except Exception:
                    stale.add(ws)
            for ws in stale:
                self.disconnect(ws, room)


manager = ConnectionManager()

ROOM_MAP = {
    "vehicles": "/ws/vehicles",
    "delays": "/ws/delays",
    "trs": "/ws/trs",
    "alerts": "/ws/alerts",
    "rewards": "/ws/rewards",
}


async def ws_endpoint(ws: WebSocket, channel: str = "events"):
    room = ROOM_MAP.get(channel, f"/ws/{channel}")
    await manager.connect(ws, room)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws, room)
    except Exception:
        manager.disconnect(ws, room)
