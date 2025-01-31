import asyncio
import datetime
import uuid
from typing import Any, AsyncGenerator, Dict, Optional, Tuple, Union
from uuid import UUID

from fastapi import WebSocketDisconnect
from fastapi_users_db_sqlalchemy import UUID_ID
from sqlalchemy.ext.asyncio import AsyncSession

from ..connections import ChatEvent, ConnectionManager, get_connection_manager
from ..db import Chat, Message, User, UserChat, get_chat_info


connection_manager = get_connection_manager()


async def try_sending(
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


async def fetch_chat_info(
    user_id: UUID, chat_id: UUID, db: AsyncSession
) -> Tuple[UserChat, Chat, User]:
    """
    Returns
    -------
    UserChat
        User chat information
    Chat
        Chat information
    User
        Receiver information
    """
    chat_info = await get_chat_info(user_id, chat_id, db)
    if chat_info is None:
        raise Exception(f"Chat '{chat_id}' not found")
    return chat_info


async def commit_message(
    message: Message, user_chat: UserChat, chat: Chat, is_seen: bool, db: AsyncSession
) -> None:
    await db.refresh(user_chat)
    await db.refresh(chat)

    created_at = message.created_at.astimezone(datetime.timezone.utc)
    if created_at > chat.updated_at:
        chat.updated_at = created_at
        user_chat.last_message = message.text
    user_chat.is_seen = is_seen
    if not is_seen:
        user_chat.unread_messages += 1

    db.add(message)
    db.add(user_chat)
    db.add(chat)
    await db.commit()


async def send_messages_async(
    connection_manager: ConnectionManager,
    message_generator: AsyncGenerator[str, None],
    user_id: UUID_ID,
    chat_id: UUID_ID,
    db: AsyncSession,
    still_connected: bool = True,
) -> bool:
    chat_id_str = str(chat_id)
    still_connected = await try_sending(
        still_connected, user_id, ChatEvent.MESSAGE_BEGIN, {"chatId": chat_id_str}
    )
    async for message in message_generator:
        await asyncio.sleep(2)
        user_chat, chat, llm_user = await fetch_chat_info(user_id, chat_id, db)
        new_message = Message(
            id=uuid.uuid4(),
            chat_id=chat_id,
            sender_id=llm_user.id,
            created_at=datetime.datetime.now(),
            text=message,
            is_seen=True,
        )
        await commit_message(new_message, user_chat, chat, False, db)
        if connection_manager.is_online(user_id):
            still_connected = await try_sending(
                still_connected,
                user_id,
                ChatEvent.MESSAGE,
                {
                    "messageId": str(new_message.id),
                    "chatId": str(new_message.chat_id),
                    "senderId": str(new_message.sender_id),
                    "createdAt": int(new_message.created_at.timestamp() * 1000),
                    "text": message,
                },
            )
    still_connected = await try_sending(
        still_connected, user_id, ChatEvent.MESSAGE_DONE, {"chatId": chat_id_str}
    )
    return still_connected
