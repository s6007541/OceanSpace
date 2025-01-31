import asyncio
import traceback
from datetime import datetime, timezone
from functools import partial
from typing import Any, Awaitable, Callable, Dict, List, Optional, Set
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
    async_session_maker,
    get_ws_current_user,
    make_user_db,
)
from ..llm import get_llm_client
from ..scheduler import get_notification_scheduler
from ..schemas import MessageModel
from ..utils import messaging as msg


llm_client = get_llm_client()
connection_manager = get_connection_manager()
notification_scheduler = get_notification_scheduler()

router = APIRouter()


class SessionHandler:
    TASK_TYPE = Callable[[AsyncSession], Awaitable]
    TASK_QUEUE_TYPE = asyncio.Queue[Optional[TASK_TYPE]]

    def __init__(
        self, on_exception: Optional[Callable[[str, Exception], Awaitable]] = None
    ) -> None:
        self.on_exception = on_exception
        self._tasks: Set[asyncio.Task] = set()
        self._sessions: Dict[str, SessionHandler.TASK_QUEUE_TYPE] = {}
        self._is_dead = False
        self._clean_up_task: Set[asyncio.Task] = set()

    async def add_task(self, task_id: str, task: "SessionHandler.TASK_TYPE") -> bool:
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

    async def _handling_loop(self, task_id: str, q: TASK_QUEUE_TYPE) -> None:
        try:
            async with async_session_maker() as session:
                while True:
                    task = await q.get()
                    if task is None:
                        break
                    try:
                        await task(session)
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
    websocket: WebSocket, user: User = Depends(get_ws_current_user)
):
    user_id = user.id
    user_email = user.email

    async def exception_handler(task_id: str, _: Exception) -> None:
        print("[WebSocket] Exception occurred:", traceback.format_exc())
        await connection_manager.send(
            user_id, ChatEvent.MESSAGE_DONE, {"chatId": task_id}
        )

    print(f"[WebSocket] {user_email} connected")
    connection_manager.add_connection(user_id, websocket)
    session_handler = SessionHandler(on_exception=exception_handler)
    success: bool = True
    while success:
        try:
            data = await websocket.receive_json()
        except WebSocketDisconnect:
            success = False
            break
        message = MessageModel.model_validate(data["data"])
        chat_id = message.chatId
        if data["type"] == ChatEvent.MESSAGE:
            success = await session_handler.add_task(
                f"msg-{chat_id}", partial(handle_message, user_id, message)
            )
        elif data["type"] == ChatEvent.COMMIT_MESSAGES:
            success = await session_handler.add_task(
                f"cmmt-{chat_id}",
                partial(send_current_messages_to_llm, user_id, message),
            )
        elif data["type"] == ChatEvent.CHECKPOINT:
            success = await session_handler.add_task(
                f"ckpt-{chat_id}",
                partial(handle_checkpoint, user_id, data, message),
            )
    await connection_manager.remove_connection(user_id, websocket)
    await session_handler.close()
    print(f"[WebSocket] {user_email} disconnected.")


async def handle_message(user_id: UUID_ID, message: MessageModel, db: AsyncSession):
    still_connected: bool = True
    chat_id = UUID(message.chatId)

    # Get static info
    user_chat, chat, receiver = await msg.fetch_chat_info(user_id, chat_id, db)
    receiver_is_bot = receiver.is_bot
    receiver_id = receiver.id
    receiver_name = receiver.username
    user_chat_whitelist = user_chat.whitelist
    user_chat_blacklist = user_chat.blacklist

    # Commit user message
    created_at = datetime.fromtimestamp(message.createdAt / 1000)
    new_message = Message(
        id=uuid4(),
        sender_id=user_id,
        chat_id=chat_id,
        created_at=created_at,
        text=message.text,
        is_seen=False,
    )
    await msg.commit_message(new_message, user_chat, chat, True, db)
    still_connected = await msg.try_sending(
        still_connected, user_id, ChatEvent.MESSAGE, message.model_dump()
    )

    if receiver_is_bot:
        ## sucidal detection
        assert receiver_name is not None
        llm_name = receiver_name
        prediction = await llm_client.security_detection(new_message)

        still_connected = await msg.try_sending(
            still_connected,
            user_id,
            ChatEvent.SEC_DETECTION,
            {
                "chatId": str(chat_id),
                "pred": prediction,
            },
        )

        if not message.buffer:
            messages = await MessageDatabase(db).get_by_user_chat_id(user_id, chat_id)
            generator = llm_client.generate_reply(
                llm_name,
                user_id,
                user_chat_whitelist,
                user_chat_blacklist,
                list(messages),
                stream=True,
            )
            still_connected = await msg.send_messages_async(
                connection_manager, generator, user_id, chat_id, db, still_connected
            )
    else:
        result = await db.execute(
            select(UserChat, Chat)
            .join(Chat, UserChat.chat_id == Chat.id)
            .where(
                UserChat.user_id == receiver_id,
                UserChat.chat_id == message.chatId,
            )
        )

        receiver_user_chat: UserChat
        receiver_chat: Chat
        fetched_chat = result.fetchone()
        if fetched_chat is None:
            raise HTTPException(status_code=404, detail="Receiver chat not found.")
        receiver_user_chat, receiver_chat = fetched_chat

        created_at = new_message.created_at.astimezone(timezone.utc)
        if created_at > chat.updated_at:
            receiver_chat.updated_at = created_at
            receiver_user_chat.last_message = new_message.text
        receiver_user_chat.is_seen = True

        db.add(receiver_user_chat)
        db.add(receiver_chat)
        await db.commit()

        still_connected = await msg.try_sending(
            still_connected, receiver_id, ChatEvent.MESSAGE, message.model_dump()
        )

    if not still_connected:
        raise WebSocketDisconnect


async def send_current_messages_to_llm(
    user_id: UUID_ID, message: MessageModel, db: AsyncSession
):
    still_connected: bool = True
    chat_id = UUID(message.chatId)
    print(message.emotionMode)

    user_chat, _, llm_user = await msg.fetch_chat_info(user_id, chat_id, db)

    llm_name = llm_user.username
    user_chat_whitelist = user_chat.whitelist
    user_chat_blacklist = user_chat.blacklist
    assert llm_name is not None
    messages = list(await MessageDatabase(db).get_by_user_chat_id(user_id, chat_id))
    print([(m.text, m.sender_id) for m in messages])

    seen_messages: List[Message] = []
    unseen_messages: List[Message] = []
    for m in messages:
        if m.is_seen:
            seen_messages.append(m)
        else:
            m.is_seen = True
            unseen_messages.append(m)
    messages = seen_messages + unseen_messages

    if len(unseen_messages) == 0:
        # No unseen_messages, don't generate reply
        return
    await db.commit()  # Commit changes to the messages.

    generator = llm_client.generate_reply(
        llm_name,
        user_id,
        user_chat_whitelist,
        user_chat_blacklist,
        messages,
        message.emotionMode,
        stream=True,
    )
    still_connected = await msg.send_messages_async(
        connection_manager, generator, user_id, chat_id, db, still_connected
    )

    user = await make_user_db(db).get(user_id)
    if user is not None and user.notification:
        await notification_scheduler.analyze_and_schedule(
            messages, message.timezone, user_id, chat_id, db
        )

    if not still_connected:
        raise WebSocketDisconnect


async def handle_checkpoint(
    user_id: UUID_ID, data: Dict[str, Any], message: MessageModel, db: AsyncSession
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
