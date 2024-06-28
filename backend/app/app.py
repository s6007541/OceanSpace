import os
from PIL import Image
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict, List
from uuid import UUID

from fastapi import Body, Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from .db import (
    Chat,
    ChatDatabase,
    MessageDatabase,
    User,
    UserChat,
    UserChatDatabase,
    UserDatabase,
    create_db_and_tables,
    get_async_session,
    get_chat_db,
    get_message_db,
    get_user_db,
    get_user_chat_db,
)
from .schemas import (
    MessageModel,
    UserChatModel,
    UserCreate,
    UserModel,
    UserRead,
    UserUpdate,
)
from .users import auth_backends, current_active_user, fastapi_users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Not needed if you setup a migration system like Alembic
    await create_db_and_tables()
    yield


origins = ["http://localhost:5173", "http://127.0.0.1:5173"]


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    fastapi_users.get_auth_router(auth_backends[0]),
    prefix="/auth",
    tags=["auth cookie"],
)
app.include_router(
    fastapi_users.get_auth_router(auth_backends[1]),
    prefix="/auth/jwt",
    tags=["auth jwt"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)


@app.get("/user-info", tags=["user info"])
async def get_current_user_info(user: User = Depends(current_active_user)) -> UserModel:
    return UserModel(
        id=str(user.id),
        email=user.email,
        username=user.username,
        alias=user.alias,
        avatar=user.avatar,
        pssList=user.pss_list,
    )


@app.get("/user-info/id/{user_id}", tags=["user info"])
async def get_user_info_by_id(
    user_id: str,
    user_db: UserDatabase = Depends(get_user_db),
) -> UserModel:
    fetched_user = await user_db.get(UUID(user_id))
    if fetched_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return UserModel(
        id=str(fetched_user.id),
        username=fetched_user.username,
        alias=fetched_user.alias,
        avatar=fetched_user.avatar,
    )


@app.get("/user-info/name/{username}", tags=["user info"])
async def get_user_info_by_name(
    username: str,
    user_db: UserDatabase = Depends(get_user_db),
) -> UserModel:
    fetched_user = await user_db.get_by_username(username)
    if fetched_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return UserModel(
        id=str(fetched_user.id),
        username=fetched_user.username,
        alias=fetched_user.alias,
        avatar=fetched_user.avatar,
    )


@app.get("/profile-image/{user_id}")
async def get_profile_image(
    user_id: str,
    user: User = Depends(current_active_user),
    user_db: UserDatabase = Depends(get_user_db),
):
    other_user = await user_db.get(UUID(user_id))

    if other_user is None:
        raise HTTPException(status_code=404, detail="Not found.")

    avatar = other_user.avatar
    if avatar is None or not os.path.exists(avatar):
        raise HTTPException(status_code=404, detail="Not found")

    if avatar.endswith(".svg"):
        return Response(content=open(avatar, "rb").read(), media_type="image/svg+xml")

    img = Image.open(avatar)
    img_bytes = img.tobytes()
    img_format = img.format
    assert img_format is not None
    return Response(content=img_bytes, media_type=f"image/{img_format.lower()}")


@app.get("/user-chats", tags=["user chats"])
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


@app.post("/user-chats", tags=["user chats"])
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
    if receiver.is_bot:
        new_receiver_chat = UserChat(
            user_id=UUID(receiver_id),
            chat_id=new_chat.id,
            receiver_id=user.id,
        )
        db.add(new_receiver_chat)
    await db.commit()


@app.put("/user-chats", tags=["user chats"])
async def update_user_chat(
    user_chat_model: UserChatModel,
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


@app.delete("/user-chats/{chat_id}", tags=["user chats"])
async def delete_user_chat(
    chat_id: str,
    user: User = Depends(current_active_user),
    user_chat_db: UserChatDatabase = Depends(get_user_chat_db),
):
    await user_chat_db.delete(user.id, UUID(chat_id))


@app.get("/messages/{chat_id}")
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
            text=message.text,
        )
        for message in messages
    ]
