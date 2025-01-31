import asyncio
from typing import Any, Dict, List, Optional, Tuple, Union

from fastapi import WebSocket
from fastapi_users_db_sqlalchemy import UUID_ID

SID = Any
MESSAGE_TYPE = Tuple[int, asyncio.Condition, Any]


class ChatEvent:
    AUTHENTICATE: str = "authenticate"
    MESSAGE: str = "message"
    MESSAGE_BEGIN: str = "message-begin"
    MESSAGE_DONE: str = "message-done"
    UPDATE_CHAT: str = "update-chat"
    COMMIT_MESSAGES: str = "commit-messages"
    CHECKPOINT: str = "checkpoint"
    UNREAD_MESSAGES: str = "unread-messages"
    SEC_DETECTION: str = "sec-detection"


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[
            UUID_ID,
            Tuple[asyncio.Task, asyncio.Queue[Optional[MESSAGE_TYPE]], List[WebSocket]],
        ] = {}

        self._counter = 0
        self._result_pool: Dict[int, Optional[Exception]] = {}

    def _next_task_id(self) -> int:
        task_id = self._counter
        self._counter += 1
        return task_id

    def add_connection(self, user_id: UUID_ID, ws: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id][-1].append(ws)
        else:
            q = asyncio.Queue()
            ws_list = [ws]
            t = asyncio.create_task(self._sending_loop(q, ws_list))
            self.active_connections[user_id] = (t, q, ws_list)

    async def remove_connection(self, user_id: UUID_ID, ws: WebSocket) -> None:
        t, q, ws_list = self.active_connections[user_id]
        ws_list.remove(ws)
        if not ws_list:
            del self.active_connections[user_id]
            await q.put(None)
            await t

    async def send(
        self,
        user_id: UUID_ID,
        event: str,
        data: Optional[Union[str, Dict[str, Any]]] = None,
    ) -> None:
        _, q, _ = self.active_connections[user_id]
        task_id = self._next_task_id()
        condition = asyncio.Condition()
        message = {"type": event, "senderId": str(user_id), "data": data}
        metadata = (task_id, condition, message)
        await q.put(metadata)
        async with condition:
            await condition.wait_for(lambda: task_id in self._result_pool)
        exc = self._result_pool.pop(task_id)
        if exc is not None:
            raise exc

    async def _sending_loop(
        self, q: asyncio.Queue[Optional[MESSAGE_TYPE]], ws_list: List[WebSocket]
    ) -> None:
        while True:
            metadata = await q.get()
            if metadata is None:
                break
            task_id, condition, message = metadata
            try:
                for ws in ws_list:
                    await ws.send_json(message)
                self._result_pool[task_id] = None
            except Exception as e:
                self._result_pool[task_id] = e
            async with condition:
                condition.notify_all()

    def is_online(self, user_id: UUID_ID):
        return user_id in self.active_connections


_connection_manager: Optional[ConnectionManager] = None


def get_connection_manager() -> ConnectionManager:
    global _connection_manager
    if _connection_manager is None:
        _connection_manager = ConnectionManager()
    return _connection_manager
