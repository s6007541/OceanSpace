from typing import Any, Dict, List, Optional, Union

from fastapi import WebSocket
from fastapi_users_db_sqlalchemy import UUID_ID

SID = Any


class ChatEvent:
    MESSAGE: str = "message"
    UPDATE_CHAT: str = "update-chat"
    COMMIT_MESSAGES: str = "commit-messages"
    CHECKPOINT: str = "checkpoint"
    UNREAD_MESSAGES: str = "unread-messages"


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[UUID_ID, List[WebSocket]] = {}

    def add_connection(self, user_id: UUID_ID, ws: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].append(ws)
        else:
            self.active_connections[user_id] = [ws]

    def remove_connection(self, user_id: UUID_ID, ws: WebSocket):
        connection_list = self.active_connections[user_id]
        connection_list.remove(ws)
        if not connection_list:
            del self.active_connections[user_id]

    async def send(
        self,
        user_id: UUID_ID,
        event: str,
        data: Optional[Union[str, Dict[str, Any]]] = None,
    ):
        for ws in self.active_connections[user_id]:
            await ws.send_json({"type": event, "senderId": str(user_id), "data": data})

    def is_online(self, user_id: UUID_ID):
        return user_id in self.active_connections
