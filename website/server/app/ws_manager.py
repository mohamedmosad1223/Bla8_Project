"""
WebSocket Connection Manager
يدير الاتصالات المفتوحة لكل مستخدم ويتيح إرسال الرسائل الفورية.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, List, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections per user."""

    def __init__(self):
        # user_id -> list of open websockets (supports multi-device)
        self._connections: Dict[int, List[WebSocket]] = {}
        # Set of online user IDs for quick lookup
        self._online_users: Set[int] = set()

    # ── Connection lifecycle ─────────────────────────────────────────────

    async def connect(self, user_id: int, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self._connections.setdefault(user_id, []).append(websocket)
        self._online_users.add(user_id)
        logger.info(f"WS connected: user {user_id} (total conns: {len(self._connections[user_id])})")

    def disconnect(self, user_id: int, websocket: WebSocket):
        """Remove a WebSocket connection."""
        conns = self._connections.get(user_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns:
            self._connections.pop(user_id, None)
            self._online_users.discard(user_id)
        logger.info(f"WS disconnected: user {user_id}")

    # ── Messaging ────────────────────────────────────────────────────────

    async def send_to_user(self, user_id: int, data: dict):
        """Send a JSON payload to all connections of a specific user."""
        conns = self._connections.get(user_id, [])
        dead = []
        for ws in conns:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        # Cleanup broken connections
        for ws in dead:
            self.disconnect(user_id, ws)

    async def broadcast_to_users(self, user_ids: List[int], data: dict):
        """Send a JSON payload to multiple users."""
        for uid in user_ids:
            await self.send_to_user(uid, data)

    # ── Status helpers ───────────────────────────────────────────────────

    def is_online(self, user_id: int) -> bool:
        return user_id in self._online_users

    def get_online_users(self) -> Set[int]:
        return self._online_users.copy()


# ── Singleton instance used across the application ───────────────────────
manager = ConnectionManager()
