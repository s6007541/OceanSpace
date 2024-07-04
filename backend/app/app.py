import asyncio
import os
from PIL import Image
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List
from uuid import UUID, uuid4

from fastapi import (
    Body,
    Depends,
    FastAPI,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    WebSocketException,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from httpx_oauth.clients.google import GoogleOAuth2  # type: ignore
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .connections import ChatEvent, ConnectionManager
from .db import (
    Chat,
    ChatDatabase,
    Message,
    MessageDatabase,
    User,
    UserChat,
    UserChatDatabase,
    UserDatabase,
    create_db_and_tables,
    get_async_session,
    get_chat_db,
    get_chat_info,
    get_message_db,
    get_user_db,
    get_user_chat_db,
    get_ws_current_user,
)
from .llm import SambaLLMClient
from .schemas import (
    MessageModel,
    PSSQuestionModel,
    UserChatModel,
    UserCreate,
    UserModel,
    UserRead,
    UserUpdate,
)
from .users import auth_backends, current_active_user, fastapi_users
from .utils import ENV, get_local_ip_address


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Not needed if you setup a migration system like Alembic
    await create_db_and_tables()
    yield


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    f"http://{get_local_ip_address()}:5173",
    "https://ocean-space.onrender.com",
    "https://oceanspace.onrender.com"
]

app = FastAPI(lifespan=lifespan)
connection_manager = ConnectionManager()
llm_client = SambaLLMClient()
google_oauth_client = GoogleOAuth2(
    ENV.get("GOOGLE_CLIENT_ID"), ENV.get("GOOGLE_CLIENT_SECRET")
)

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

app.include_router(
    fastapi_users.get_oauth_router(
        google_oauth_client,
        auth_backends[0],
        ENV.get("GOOGLE_CLIENT_SECRET"),
        associate_by_email=True,
    ),
    prefix="/auth/google",
    tags=["google auth"],
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
        notification=user.notification,
        emergencyContact=user.emergency_contact,
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


@app.put("/user-info", tags=["user info"])
async def update_user_info(
    body: Dict[str, Any] = Body(),
    user: User = Depends(current_active_user),
    user_db: UserDatabase = Depends(get_user_db),
):
    if "pss" in body:
        user.pss_list = user.pss_list + [body["pss"]]
    if "notification" in body:
        user.notification = body["notification"]
    if "emergencyContact" in body:
        user.emergency_contact = body["emergencyContact"]
    user_db.session.add(user)
    await user_db.session.commit()
    await user_db.session.refresh(user)
    return UserModel(
        id=str(user.id),
        email=user.email,
        username=user.username,
        alias=user.alias,
        avatar=user.avatar,
        pssList=user.pss_list,
        notification=user.notification,
        emergencyContact=user.emergency_contact,
    )


@app.get("/profile-image/{user_id}")
async def get_profile_image(
    user_id: str,
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


@app.get("/user-chats/{chat_id}", tags=["user chats"])
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


@app.get("/messages/{chat_id}", tags=["messages"])
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
            buffer=False,
            emotionMode="",
            persuasive=False,
        )
        for message in messages
    ]


@app.post("/pss")
async def predict_pss(
    pss_question: PSSQuestionModel, user: User = Depends(current_active_user)
):  
    print(pss_question.question)
    print(pss_question.answer)
    score = await llm_client.predict_pss(pss_question)
    return {"pss": score}


# Web socket handlers


@app.websocket("/wss")
async def websocket_endpoint(
    websocket: WebSocket,
    user: User = Depends(get_ws_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    print(f"[WebSocket] {user.email} connected")
    connection_manager.add_connection(user.id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await db.refresh(user)
            if data["type"] == ChatEvent.MESSAGE:
                await handle_message(user, data, db)
            elif data["type"] == ChatEvent.COMMIT_MESSAGES:
                await send_current_messages_to_llm(user, data, db)
            elif data["type"] == ChatEvent.CHECKPOINT:
                await handle_checkpoint(user, data, db)
    except WebSocketDisconnect:
        connection_manager.remove_connection(user.id, websocket)
        print(f"[WebSocket] {user.email} disconnected.")


async def handle_message(user: User, message: Dict[str, Any], db: AsyncSession):
    # Send message
    message_model = MessageModel.model_validate(message["data"])
    chat_info = await get_chat_info(user.id, UUID(message_model.chatId), db)

    if chat_info is None:
        raise HTTPException(status_code=404, detail="User chat not found.")

    user_chat, chat, receiver = chat_info

    created_at = datetime.fromtimestamp(message_model.createdAt / 1000)

    user_chat.last_message = message_model.text
    user_chat.is_seen = True
    chat.updated_at = created_at

    new_message = Message(
        id=uuid4(),
        sender_id=user.id,
        chat_id=chat.id,
        created_at=created_at,
        text=message_model.text,
    )

    db.add(user_chat)
    db.add(chat)
    db.add(new_message)

    if receiver.is_bot:
        ## sucidal detection
        llm_name = receiver.username
        assert llm_name is not None
        prediction = await llm_client.security_detection(new_message)
            
        if connection_manager.is_online(user.id):
            await connection_manager.send(
                user.id,
                ChatEvent.SEC_DETECTION,
                {
                    "pred": prediction,
                },
            )
            
        if not message_model.buffer:
            llm_name = receiver.username
            assert llm_name is not None
            messages = await MessageDatabase(db).get_by_user_chat_id(user.id, chat.id)
            sentences = await llm_client.generate_reply(
                llm_name, user, user_chat, list(messages)
            )

            # Send sentence one by one
            for sentence in sentences:
                new_message = Message(
                    sender_id=receiver.id,
                    chat_id=chat.id,
                    text=sentence,
                )

                user_chat.last_message = sentence
                user_chat.is_seen = False
                chat.updated_at = new_message.created_at

                db.add(new_message)
                db.add(user_chat)
                db.add(chat)

                await connection_manager.send(
                    user.id,
                    ChatEvent.MESSAGE,
                    {
                        "messageId": str(new_message.id),
                        "chatId": str(new_message.chat_id),
                        "senderId": str(new_message.sender_id),
                        "createdAt": int(new_message.created_at.timestamp() * 1000),
                        "text": sentence,
                    },
                )
    else:
        result = await db.execute(
            select(UserChat, Chat)
            .join(Chat, UserChat.chat_id == Chat.id)
            .where(
                UserChat.user_id == receiver.id,
                UserChat.chat_id == message_model.chatId,
            )
        )

        receiver_user_chat: UserChat
        receiver_chat: Chat
        fetched_chat = result.fetchone()
        if fetched_chat is None:
            raise HTTPException(status_code=404, detail="Receiver chat not found.")
        receiver_user_chat, receiver_chat = fetched_chat

        receiver_user_chat.last_message = message_model.text
        receiver_user_chat.is_seen = True
        receiver_chat.updated_at = created_at

        db.add(receiver_user_chat)
        db.add(receiver_chat)

        if connection_manager.is_online(receiver.id):
            await connection_manager.send(
                receiver.id, ChatEvent.MESSAGE, message_model.model_dump()
            )

    await db.commit()


async def send_current_messages_to_llm(
    user: User, message: Dict[str, Any], db: AsyncSession
):
    message_model = MessageModel.model_validate(message["data"])
    print(message_model.emotionMode)
    chat_info = await get_chat_info(user.id, UUID(message_model.chatId), db)
    
    if chat_info is None:
        raise WebSocketException(code=status.WS_1002_PROTOCOL_ERROR)

    user_chat, chat, llm_user = chat_info

    llm_name = llm_user.username
    assert llm_name is not None
    messages = list(await MessageDatabase(db).get_by_user_chat_id(user.id, chat.id))
    print([(m.text, m.sender_id) for m in messages])
    
    sentences = await llm_client.generate_reply(llm_name, user, user_chat, messages, message_model.emotionMode)

    # Send sentence one by one
    for sentence_i, sentence in enumerate(sentences):
        # await time.sleep(2)
        await asyncio.sleep(2)
        new_message = Message(
            id=uuid4(),
            chat_id=chat.id,
            sender_id=llm_user.id,
            created_at=datetime.now(),
            text=sentence,
        )

        user_chat.last_message = sentence
        user_chat.is_seen = False
        user_chat.unread_messages += 1
        chat.updated_at = new_message.created_at

        db.add(new_message)
        db.add(user_chat)
        db.add(chat)

        if connection_manager.is_online(user.id):
            await connection_manager.send(
                user.id,
                ChatEvent.MESSAGE,
                {
                    "messageId": str(new_message.id),
                    "chatId": str(new_message.chat_id),
                    "senderId": str(new_message.sender_id),
                    "createdAt": int(new_message.created_at.timestamp() * 1000),
                    "text": sentence,
                    "last_one": (sentence_i + 1) == len(sentences),
                },
            )
        await db.commit()

    # await db.commit()


async def handle_checkpoint(user: User, message: Dict[str, Any], db: AsyncSession):
    topic_list = ["ความรัก", "การเงิน", "การงาน", "ครอบครัว", "การเรียน"]
    n_messages = message.get("nMessages", 20)

    message_model = MessageModel.model_validate(message["data"])
    chat_id = UUID(message_model.chatId)
    messages = await MessageDatabase(db).get_by_user_chat_id(user.id, chat_id)

    topics = await llm_client.predict_topics(user, list(messages), topic_list, n_messages)

    user_chat = await UserChatDatabase(db).get(user.id, chat_id)
    if user_chat is None:
        raise WebSocketException(code=status.WS_1002_PROTOCOL_ERROR)
    user_chat.topics_of_interest = topics
    db.add(user_chat)

    await connection_manager.send(user.id, ChatEvent.CHECKPOINT, {"topics": topics})
    await db.commit()

