import asyncio
import traceback
from datetime import datetime
from typing import Any, Awaitable, Callable, Dict, Optional, Set, Tuple, Union
from uuid import UUID, uuid4

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    WebSocketException,
    status,
)
from fastapi_users_db_sqlalchemy import UUID_ID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..connections import ChatEvent, get_connection_manager
from ..db import (
    Chat,
    Message,
    MessageDatabase,
    User,
    UserChat,
    UserChatDatabase,
    get_async_session,
    get_chat_info,
    get_ws_current_user,
)
from ..llm import get_llm_client
from ..scheduler import get_notification_scheduler
from ..schemas import MessageModel


llm_client = get_llm_client()
connection_manager = get_connection_manager()
notification_scheduler = get_notification_scheduler()

router = APIRouter()


class SessionHandler:
    def __init__(
        self, on_exception: Optional[Callable[[str, Exception], Awaitable]] = None
    ) -> None:
        self.on_exception = on_exception
        self._tasks: Set[asyncio.Task] = set()
        self._sessions: Dict[str, asyncio.Queue[Optional[Awaitable]]] = {}
        self._is_dead = False
        self._clean_up_task: Set[asyncio.Task] = set()

    async def add_task(self, task_id: str, task: Awaitable) -> bool:
        if self._is_dead:
            return False

        if task_id not in self._sessions:
            q = asyncio.Queue()
            t = asyncio.create_task(self._handling_loop(task_id, q), name=task_id)
            self._tasks.add(t)
            t.add_done_callback(self._clean_up)
            self._sessions[task_id] = q

        await self._sessions[task_id].put(task)
        return not self._is_dead

    async def _handling_loop(self, task_id: str, q: asyncio.Queue) -> None:
        try:
            while True:
                task = await q.get()
                if task is None:
                    break
                try:
                    await task
                except WebSocketDisconnect as e:
                    raise e
                except Exception as e:
                    if self.on_exception is not None:
                        await self.on_exception(task_id, e)
        except WebSocketDisconnect:
            pass

    def _clean_up(self, task: asyncio.Task) -> None:
        t = asyncio.create_task(self._clean_up_async(task))
        self._clean_up_task.add(t)
        t.add_done_callback(self._clean_up_task.discard)

    async def _clean_up_async(self, _) -> None:
        if self._is_dead:
            return
        if self._tasks:
            for task in self._tasks:
                await self._sessions[task.get_name()].put(None)
            _, pending = await asyncio.wait(self._tasks, timeout=60)
            for task in pending:
                task.cancel()
        self._tasks.clear()
        self._sessions.clear()
        self._is_dead = True

    async def close(self) -> None:
        await self._clean_up_async(None)


@router.websocket("/wss")
async def websocket_endpoint(
    websocket: WebSocket,
    user: User = Depends(get_ws_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    async def exception_handler(task_id: str, _: Exception) -> None:
        print("[WebSocket] Exception occurred:", traceback.format_exc())
        await connection_manager.send(
            user.id, ChatEvent.MESSAGE_DONE, {"chatId": task_id}
        )

    print(f"[WebSocket] {user.email} connected")
    connection_manager.add_connection(user.id, websocket)
    session_handler = SessionHandler(on_exception=exception_handler)
    success: bool = True
    while success:
        try:
            data = await websocket.receive_json()
        except WebSocketDisconnect:
            success = False
            break
        await db.refresh(user)
        message = MessageModel.model_validate(data["data"])
        if data["type"] == ChatEvent.MESSAGE:
            success = await session_handler.add_task(
                message.chatId, handle_message(user.id, message, db)
            )
        elif data["type"] == ChatEvent.COMMIT_MESSAGES:
            success = await session_handler.add_task(
                message.chatId,
                send_current_messages_to_llm(user.id, user, message, db),
            )
        elif data["type"] == ChatEvent.CHECKPOINT:
            success = await session_handler.add_task(
                message.chatId, handle_checkpoint(user.id, data, message, db)
            )
    connection_manager.remove_connection(user.id, websocket)
    await session_handler.close()
    print(f"[WebSocket] {user.email} disconnected.")


async def handle_message(
    # user: User, message: MessageModel, db: AsyncSession
    user_id: UUID_ID,
    message: MessageModel,
    db: AsyncSession,
):
    still_connected: bool = True
    chat_id = UUID(message.chatId)

    # Commit user message
    user_chat, chat, receiver = await _fetch_chat_info(user_id, chat_id, db)
    created_at = datetime.fromtimestamp(message.createdAt / 1000)
    new_message = Message(
        id=uuid4(),
        sender_id=user_id,
        chat_id=chat.id,
        created_at=created_at,
        text=message.text,
    )
    await _commit_message(new_message, user_chat, chat, True, db)
    still_connected = await _try_sending(
        still_connected, user_id, ChatEvent.UPDATE_CHAT
    )

    if receiver.is_bot:
        ## sucidal detection
        llm_name = receiver.username
        assert llm_name is not None
        prediction = await llm_client.security_detection(new_message)

        still_connected = await _try_sending(
            still_connected,
            user_id,
            ChatEvent.SEC_DETECTION,
            {
                "chatId": str(chat.id),
                "pred": prediction,
            },
        )

        if not message.buffer:
            llm_name = receiver.username
            assert llm_name is not None
            messages = await MessageDatabase(db).get_by_user_chat_id(user_id, chat.id)
            async for sentence in llm_client.generate_reply(
                llm_name,
                user_id,
                user_chat.whitelist,
                user_chat.blacklist,
                list(messages),
                stream=True,
            ):
                user_chat, chat, receiver = await _fetch_chat_info(user_id, chat_id, db)
                new_message = Message(
                    sender_id=receiver.id,
                    chat_id=chat.id,
                    created_at=datetime.now(),
                    text=sentence,
                )
                await _commit_message(new_message, user_chat, chat, False, db)
                still_connected = await _try_sending(
                    still_connected,
                    user_id,
                    ChatEvent.MESSAGE,
                    {
                        "messageId": str(new_message.id),
                        "chatId": str(new_message.chat_id),
                        "senderId": str(new_message.sender_id),
                        "createdAt": int(new_message.created_at.timestamp() * 1000),
                        "text": sentence,
                    },
                )
            still_connected = await _try_sending(
                still_connected,
                user_id,
                ChatEvent.MESSAGE_DONE,
                {"chatId": message.chatId},
            )
    else:
        result = await db.execute(
            select(UserChat, Chat)
            .join(Chat, UserChat.chat_id == Chat.id)
            .where(
                UserChat.user_id == receiver.id,
                UserChat.chat_id == message.chatId,
            )
        )

        receiver_user_chat: UserChat
        receiver_chat: Chat
        fetched_chat = result.fetchone()
        if fetched_chat is None:
            raise HTTPException(status_code=404, detail="Receiver chat not found.")
        receiver_user_chat, receiver_chat = fetched_chat

        receiver_user_chat.last_message = message.text
        receiver_user_chat.is_seen = True
        receiver_chat.updated_at = created_at

        db.add(receiver_user_chat)
        db.add(receiver_chat)
        await db.commit()

        still_connected = await _try_sending(
            still_connected, receiver.id, ChatEvent.MESSAGE, message.model_dump()
        )

    if not still_connected:
        raise WebSocketDisconnect


async def send_current_messages_to_llm(
    # user: User, message: MessageModel, db: AsyncSession
    user_id: UUID_ID,
    user: User,
    message: MessageModel,
    db: AsyncSession,
):
    still_connected: bool = True
    chat_id = UUID(message.chatId)
    print(message.emotionMode)

    user_chat, chat, llm_user = await _fetch_chat_info(user_id, chat_id, db)

    llm_name = llm_user.username
    assert llm_name is not None
    messages = list(await MessageDatabase(db).get_by_user_chat_id(user_id, chat.id))
    print([(m.text, m.sender_id) for m in messages])

    async for sentence in llm_client.generate_reply(
        llm_name,
        user_id,
        user_chat.whitelist,
        user_chat.blacklist,
        messages,
        message.emotionMode,
        stream=True,
    ):
        await asyncio.sleep(2)
        user_chat, chat, llm_user = await _fetch_chat_info(user_id, chat_id, db)
        new_message = Message(
            id=uuid4(),
            sender_id=llm_user.id,
            chat_id=chat.id,
            created_at=datetime.now(),
            text=sentence,
        )
        await _commit_message(new_message, user_chat, chat, False, db)
        if connection_manager.is_online(user_id):
            still_connected = await _try_sending(
                still_connected,
                user_id,
                ChatEvent.MESSAGE,
                {
                    "messageId": str(new_message.id),
                    "chatId": str(new_message.chat_id),
                    "senderId": str(new_message.sender_id),
                    "createdAt": int(new_message.created_at.timestamp() * 1000),
                    "text": sentence,
                },
            )
        await db.commit()
    still_connected = await _try_sending(
        still_connected, user_id, ChatEvent.MESSAGE_DONE, {"chatId": message.chatId}
    )

    await db.refresh(user)
    if user.notification:
        await notification_scheduler.analyze_and_schedule(
            messages, message.timezone, user_id, llm_user, user_chat, chat, db
        )

    if not still_connected:
        raise WebSocketDisconnect


async def handle_checkpoint(
    # user: User, data: Dict[str, Any], message: MessageModel, db: AsyncSession
    user_id: UUID_ID,
    data: Dict[str, Any],
    message: MessageModel,
    db: AsyncSession,
):
    topic_list = ["ความรัก", "การเงิน", "การงาน", "ครอบครัว", "การเรียน"]
    n_messages = data.get("nMessages", 20)

    chat_id = UUID(message.chatId)
    messages = await MessageDatabase(db).get_by_user_chat_id(user_id, chat_id)

    topics = await llm_client.predict_topics(
        user_id, list(messages), topic_list, n_messages
    )

    user_chat = await UserChatDatabase(db).get(user_id, chat_id)
    if user_chat is None:
        raise WebSocketException(code=status.WS_1002_PROTOCOL_ERROR)
    user_chat.topics_of_interest = topics
    db.add(user_chat)

    await db.commit()
    await connection_manager.send(user_id, ChatEvent.CHECKPOINT, {"topics": topics})


# ----------------------------- Helper functions -------------------------------#


async def _try_sending(
    still_connected: bool,
    user_id: UUID_ID,
    event: str,
    data: Optional[Union[str, Dict[str, Any]]] = None,
) -> bool:
    if not still_connected:
        return False
    try:
        await connection_manager.send(user_id, event, data)
        return True
    except WebSocketDisconnect:
        return False


async def _fetch_chat_info(
    user_id: UUID, chat_id: UUID, db: AsyncSession
) -> Tuple[UserChat, Chat, User]:
    chat_info = await get_chat_info(user_id, chat_id, db)
    if chat_info is None:
        raise WebSocketException(code=status.WS_1002_PROTOCOL_ERROR)
    return chat_info


async def _commit_message(
    message: Message, user_chat: UserChat, chat: Chat, is_seen: bool, db: AsyncSession
) -> None:
    user_chat.last_message = message.text
    user_chat.is_seen = is_seen
    if not is_seen:
        user_chat.unread_messages += 1
    chat.updated_at = message.created_at

    db.add(message)
    db.add(user_chat)
    db.add(chat)
    await db.commit()


# ------------------------------------------------------------------------------#
