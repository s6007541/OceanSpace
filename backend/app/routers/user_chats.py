from datetime import datetime
from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..connections import ChatEvent, get_connection_manager
from ..db import (
    Chat,
    ChatDatabase,
    NotificationTaskDatabase,
    User,
    UserChat,
    UserChatDatabase,
    UserDatabase,
    get_async_session,
    get_chat_db,
    get_notification_task_db,
    get_user_chat_db,
)
from ..scheduler import get_notification_scheduler
from ..schemas import UserChatModel
from ..users import current_active_user

router = APIRouter()
connection_manager = get_connection_manager()
notification_scheduler = get_notification_scheduler()


@router.get("")
async def get_current_user_chats(
    user: User = Depends(current_active_user),
    user_chat_db: UserChatDatabase = Depends(get_user_chat_db),
) -> List[UserChatModel]:
    results = await user_chat_db.get_by_user_id(user.id)
    return [
        UserChatModel(
            userId=str(user_chat.user_id),
            chatId=str(user_chat.chat_id),
            receiverId=str(user_chat.receiver_id),
            isSeen=user_chat.is_seen,
            lastMessage=user_chat.last_message,
            whitelist=user_chat.whitelist,
            blacklist=user_chat.blacklist,
            topicsOfInterest=user_chat.topics_of_interest,
            unreadMessages=user_chat.unread_messages,
            createdAt=int(chat.created_at.timestamp() * 1000),
            updatedAt=int(chat.updated_at.timestamp() * 1000),
        )
        for user_chat, chat in results
    ]


@router.get("/{chat_id}")
async def get_user_chat_by_id(
    chat_id: str,
    user: User = Depends(current_active_user),
    chat_db: ChatDatabase = Depends(get_chat_db),
    user_chat_db: UserChatDatabase = Depends(get_user_chat_db),
) -> UserChatModel:
    user_chat = await user_chat_db.get(user.id, UUID(chat_id))
    chat = await chat_db.get(UUID(chat_id))
    if user_chat is None or chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return UserChatModel(
        userId=str(user_chat.user_id),
        chatId=str(user_chat.chat_id),
        receiverId=str(user_chat.receiver_id),
        isSeen=user_chat.is_seen,
        lastMessage=user_chat.last_message,
        whitelist=user_chat.whitelist,
        blacklist=user_chat.blacklist,
        topicsOfInterest=user_chat.topics_of_interest,
        unreadMessages=user_chat.unread_messages,
        createdAt=int(chat.created_at.timestamp() * 1000),
        updatedAt=int(chat.updated_at.timestamp() * 1000),
    )


@router.post("")
async def create_user_chat(
    body: Dict[str, Any] = Body(),
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    receiver_id = body.get("receiverId")
    if receiver_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)
    new_chat = Chat()
    db.add(new_chat)
    await db.commit()
    await db.refresh(new_chat)

    new_user_chat = UserChat(
        user_id=user.id,
        chat_id=new_chat.id,
        receiver_id=UUID(receiver_id),
    )
    db.add(new_user_chat)

    receiver = await UserDatabase(db, User).get(UUID(receiver_id))
    if receiver is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    if not receiver.is_bot:
        new_receiver_chat = UserChat(
            user_id=UUID(receiver_id),
            chat_id=new_chat.id,
            receiver_id=user.id,
        )
        db.add(new_receiver_chat)
    await db.commit()
    if connection_manager.is_online(user.id):
        await connection_manager.send(user.id, ChatEvent.UPDATE_CHAT)


@router.put("")
async def update_user_chat(
    user_chat_model: UserChatModel,
    user: User = Depends(current_active_user),
    chat_db: ChatDatabase = Depends(get_chat_db),
    user_chat_db: UserChatDatabase = Depends(get_user_chat_db),
):
    chat = await chat_db.get(UUID(user_chat_model.chatId))
    user_chat = await user_chat_db.get(
        UUID(user_chat_model.userId), UUID(user_chat_model.chatId)
    )
    if chat is None or user_chat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    chat.updated_at = datetime.fromtimestamp(user_chat_model.updatedAt / 1000)
    user_chat.is_seen = user_chat_model.isSeen
    user_chat.last_message = user_chat_model.lastMessage
    user_chat.whitelist = user_chat_model.whitelist
    user_chat.blacklist = user_chat_model.blacklist
    user_chat.unread_messages = user_chat_model.unreadMessages

    await user_chat_db.update(user_chat)
    await chat_db.update(chat)
    await user_chat_db.session.commit()
    await chat_db.session.commit()
    if connection_manager.is_online(user.id):
        await connection_manager.send(user.id, ChatEvent.UPDATE_CHAT)


@router.delete("/{chat_id}")
async def delete_user_chat(
    chat_id: str,
    user: User = Depends(current_active_user),
    user_chat_db: UserChatDatabase = Depends(get_user_chat_db),
    notification_task_db: NotificationTaskDatabase = Depends(get_notification_task_db),
):
    chat_uuid = UUID(chat_id)
    # Delete notification tasks first as it has a foreign key constraint
    tasks = await notification_task_db.delete_by_chat_id_and_return(chat_uuid)
    await user_chat_db.delete(user.id, chat_uuid)
    for task in tasks:
        notification_scheduler.remove_task(task.id)
    await notification_task_db.session.commit()
    await user_chat_db.session.commit()
    if connection_manager.is_online(user.id):
        await connection_manager.send(user.id, ChatEvent.UPDATE_CHAT)
