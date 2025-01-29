from uuid import UUID

from fastapi import APIRouter, Depends

from ..db import MessageDatabase, User, get_message_db
from ..users import auth_backends, current_active_user, fastapi_users
from ..schemas import MessageModel

router = APIRouter()


@router.get("/{chat_id}")
async def get_messages(
    chat_id: str,
    user: User = Depends(current_active_user),
    message_db: MessageDatabase = Depends(get_message_db),
):
    messages = await message_db.get_by_user_chat_id(user.id, UUID(chat_id))
    return [
        MessageModel(
            id=str(message.id),
            chatId=str(message.chat_id),
            senderId=str(message.sender_id),
            createdAt=int(message.created_at.timestamp() * 1000),
            timezone=0,
            text=message.text,
            buffer=False,
            emotionMode="",
            persuasive=False,
        )
        for message in messages
    ]
