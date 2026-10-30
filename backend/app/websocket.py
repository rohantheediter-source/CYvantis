"""
Authenticated WebSocket fan-out.

Messages are envelopes: {"type": "event" | "alert" | "incident" | "hello", "data": {...}}.
Each connection is bound to the authenticated user; captured honeypot passwords are
redacted for every non-admin connection before sending.
"""
import asyncio
import copy
import json
import logging
from typing import Dict

from fastapi import WebSocket

from app.security import REDACTED

logger = logging.getLogger("cyvantis.ws")

MAX_CONNECTIONS = 200
SEND_TIMEOUT_SECONDS = 5


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, user) -> bool:
        if len(self.active_connections) >= MAX_CONNECTIONS:
            await websocket.close(code=1013)
            return False
        await websocket.accept()
        self.active_connections[websocket] = {"username": user.username, "role": user.role}
        return True

    def disconnect(self, websocket: WebSocket):
        self.active_connections.pop(websocket, None)

    @staticmethod
    def _for_role(message: dict, role: str) -> dict:
        if role == "admin" or message.get("type") != "event":
            return message
        msg = copy.deepcopy(message)
        if msg.get("data", {}).get("password"):
            msg["data"]["password"] = REDACTED
        return msg

    async def broadcast(self, message: dict):
        dead = []
        cache: Dict[str, str] = {}
        for ws, info in list(self.active_connections.items()):
            role = info["role"]
            payload = cache.get(role)
            if payload is None:
                payload = cache[role] = json.dumps(self._for_role(message, role), default=str)
            try:
                await asyncio.wait_for(ws.send_text(payload), timeout=SEND_TIMEOUT_SECONDS)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    async def broadcast_event(self, event_data: dict):
        """Backward-compatible helper."""
        await self.broadcast({"type": "event", "data": event_data})


manager = ConnectionManager()
