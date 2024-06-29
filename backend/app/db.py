import json
from datetime import datetime
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List, Optional, Sequence, Tuple
from uuid import UUID, uuid4

from fastapi import Depends, HTTPException, WebSocket, WebSocketException, status
from fastapi_users_db_sqlalchemy import (
    GUID,
    SQLAlchemyBaseOAuthAccountTableUUID,
    SQLAlchemyBaseUserTableUUID,
    SQLAlchemyUserDatabase,
    UUID_ID,
)
from fastapi_users_db_sqlalchemy.access_token import (
    SQLAlchemyAccessTokenDatabase,
    SQLAlchemyBaseAccessTokenTableUUID,
)
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    delete,
    func,
    select,
)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy_utils import ScalarListType  # type: ignore

DATABASE_URL = "sqlite+aiosqlite:///./test.db"

USER_IMAGE_DIR = Path(__file__).parent.parent / "user_images"


class Base(DeclarativeBase):
    pass


class BaseDatabase:
    def __init__(self, session: AsyncSession):
        self.session = session


class OAuthAccount(SQLAlchemyBaseOAuthAccountTableUUID, Base):
    pass


class User(SQLAlchemyBaseUserTableUUID, Base):
    oauth_accounts: Mapped[List[OAuthAccount]] = relationship(
        "OAuthAccount", lazy="joined"
    )
    username: Mapped[Optional[str]] = mapped_column(
        String(), unique=True, default=None, nullable=True
    )
    alias: Mapped[Optional[str]] = mapped_column(String(), default=None, nullable=True)
    avatar: Mapped[Optional[str]] = mapped_column(
        String(), default="./user_images/userprofile_default.svg", nullable=True
    )
    pss_list: Mapped[List[str]] = mapped_column(
        ScalarListType(str), default=[], nullable=False
    )
    is_bot: Mapped[bool] = mapped_column(Boolean(), default=False, nullable=False)
    notification: Mapped[bool] = mapped_column(Boolean(), default=True, nullable=False)
    emergency_contact: Mapped[Optional[str]] = mapped_column(
        String(), default=None, nullable=True
    )


class AccessToken(SQLAlchemyBaseAccessTokenTableUUID, Base):
    pass


class Chat(Base):
    __tablename__ = "chat"

    id: Mapped[UUID_ID] = mapped_column(GUID, primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(), nullable=False, default=datetime.now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(), nullable=False, default=datetime.now
    )


class UserChat(Base):
    __tablename__ = "user_chat"

    user_id: Mapped[UUID_ID] = mapped_column(ForeignKey("user.id"), primary_key=True)
    chat_id: Mapped[UUID_ID] = mapped_column(ForeignKey("chat.id"), primary_key=True)
    receiver_id: Mapped[UUID_ID] = mapped_column(ForeignKey("user.id"), nullable=False)
    is_seen: Mapped[bool] = mapped_column(Boolean(), default=False, nullable=False)
    last_message: Mapped[Optional[str]] = mapped_column(
        String(), default=None, nullable=True
    )
    whitelist: Mapped[List[str]] = mapped_column(
        ScalarListType(str), default=[], nullable=False
    )
    blacklist: Mapped[List[str]] = mapped_column(
        ScalarListType(str), default=[], nullable=False
    )
    topics_of_interest: Mapped[List[str]] = mapped_column(
        ScalarListType(str), default=[], nullable=False
    )
    unread_messages: Mapped[int] = mapped_column(Integer(), default=0, nullable=False)


class Message(Base):
    __tablename__ = "message"

    id: Mapped[UUID_ID] = mapped_column(GUID, primary_key=True, default=uuid4)
    sender_id: Mapped[UUID_ID] = mapped_column(ForeignKey("user.id"), nullable=False)
    chat_id: Mapped[UUID_ID] = mapped_column(ForeignKey("chat.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(), nullable=False, default=datetime.now
    )
    text: Mapped[str] = mapped_column(String(), nullable=False)


class UserDatabase(SQLAlchemyUserDatabase):
    async def get(self, user_id: UUID_ID) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)  # type: ignore
        result = await self.session.execute(stmt)
        return result.scalar()

    async def get_by_username(self, username: str) -> Optional[User]:
        stmt = select(User).where(
            (User.username == username) | (User.alias == username)
        )
        result = await self.session.execute(stmt)
        return result.scalar()


class AccessTokenDatabase(SQLAlchemyAccessTokenDatabase):
    pass


class ChatDatabase(BaseDatabase):
    async def create(self, chat: Chat) -> Chat:
        self.session.add(chat)
        await self.session.commit()
        return chat

    async def get(self, chat_id: UUID_ID) -> Optional[Chat]:
        stmt = select(Chat).where(Chat.id == chat_id)
        result = await self.session.execute(stmt)
        return result.scalar()

    async def update(self, chat: Chat):
        self.session.add(chat)
        await self.session.commit()
        await self.session.refresh(chat)


class UserChatDatabase(BaseDatabase):
    async def create(self, user_chat: UserChat) -> UserChat:
        self.session.add(user_chat)
        await self.session.commit()
        return user_chat

    async def get(self, user_id: UUID_ID, chat_id: UUID_ID) -> Optional[UserChat]:
        stmt = select(UserChat).where(
            UserChat.user_id == user_id, UserChat.chat_id == chat_id
        )
        result = await self.session.execute(stmt)
        return result.scalar()

    async def get_by_user_id(self, user_id: UUID_ID) -> Sequence[Tuple[UserChat, Chat]]:
        stmt = (
            select(UserChat, Chat)
            .join(Chat, UserChat.chat_id == Chat.id)
            .where(UserChat.user_id == user_id)
            .order_by(Chat.updated_at.desc())
        )
        result = await self.session.execute(stmt)
        return [row.tuple() for row in result.fetchall()]

    async def get_by_chat_id(self, chat_id: UUID_ID) -> Sequence[UserChat]:
        stmt = select(UserChat).where(UserChat.chat_id == chat_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, user_chat: UserChat):
        self.session.add(user_chat)
        await self.session.commit()
        await self.session.refresh(user_chat)

    async def delete(self, user_id: UUID_ID, chat_id: UUID_ID):
        stmt = delete(UserChat).where(
            UserChat.user_id == user_id, UserChat.chat_id == chat_id
        )
        await self.session.execute(stmt)

        if not await self.get_by_chat_id(chat_id):
            stmt = delete(Chat).where(Chat.id == chat_id)
            await self.session.execute(stmt)
            stmt = delete(Message).where(Message.chat_id == chat_id)
            await self.session.execute(stmt)
        await self.session.commit()

    async def delete_and_return(
        self, user_id: UUID_ID, chat_id: UUID_ID
    ) -> Optional[UserChat]:
        stmt = (
            delete(UserChat)
            .where(UserChat.user_id == user_id, UserChat.chat_id == chat_id)
            .returning(UserChat)
        )
        result = await self.session.execute(stmt)

        if not self.get_by_chat_id(chat_id):
            del_stmt = delete(Chat).where(Chat.id == chat_id)
            await self.session.execute(del_stmt)
            del_stmt = delete(Message).where(Message.chat_id == chat_id)
            await self.session.execute(del_stmt)
        await self.session.commit()

        return result.scalar()


class MessageDatabase(BaseDatabase):
    async def create(self, message: Message) -> Message:
        self.session.add(message)
        await self.session.commit()
        return message

    async def get(self, message_id: UUID_ID) -> Optional[Message]:
        stmt = select(Message).where(Message.id == message_id)
        result = await self.session.execute(stmt)
        return result.scalar()

    async def get_by_chat_id(self, chat_id: UUID_ID) -> Sequence[Message]:
        stmt = select(Message).where(Message.chat_id == chat_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_user_chat_id(
        self, user_id: UUID_ID, chat_id: UUID_ID
    ) -> Sequence[Message]:
        statement = (
            select(Message, UserChat)
            .join(UserChat, Message.chat_id == UserChat.chat_id)
            .where(Message.chat_id == chat_id, UserChat.user_id == user_id)
            .order_by(Message.created_at)
        )
        results = await self.session.execute(statement)
        return results.scalars().all()


engine = create_async_engine(DATABASE_URL)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await init_user_db()


async def init_user_db() -> None:
    async with async_session_maker() as session:
        # Check if default data already exists
        result = await session.execute(select(func.count()).select_from(User))
        user_count = result.scalar_one()
        if user_count == 0:
            # Add LLM users
            with open(Path(__file__).parent.parent.parent / "llm_config.json") as f:
                llm_config_json: Dict[str, Any] = json.load(f)
            for llm_name, llm_dict in llm_config_json.items():
                user = User(
                    email=f"{llm_name.lower()}@gmail.com",
                    hashed_password="1234",
                    username=llm_dict["username"],
                    alias=llm_name,
                    avatar=str(
                        (
                            USER_IMAGE_DIR
                            / "SeaCharacters/Small-56px"
                            / llm_dict["avatar"]
                        )
                    ),
                    is_bot=True,
                )
                session.add(user)
            await session.commit()


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield UserDatabase(session, User, OAuthAccount)


async def get_chat_db(session: AsyncSession = Depends(get_async_session)):
    yield ChatDatabase(session)


async def get_user_chat_db(session: AsyncSession = Depends(get_async_session)):
    yield UserChatDatabase(session)


async def get_message_db(session: AsyncSession = Depends(get_async_session)):
    yield MessageDatabase(session)


async def get_access_token_db(
    session: AsyncSession = Depends(get_async_session),
):
    yield AccessTokenDatabase(session, AccessToken)


async def get_ws_current_user(
    websocket: WebSocket, db: AsyncSession = Depends(get_async_session)
):
    token = websocket.cookies.get("fastapiusersauth")
    if token is None:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason="Not authenticated"
        )
    access_token_result = await db.execute(select(AccessToken).filter(AccessToken.token == token))  # type: ignore
    access_token = access_token_result.scalars().first()
    if not access_token:
        raise HTTPException(status_code=401, detail="Invalid session token")
    user_result = await db.execute(select(User).filter(User.id == access_token.user_id))  # type: ignore
    user = user_result.unique().scalar_one()
    if not user:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason="Not authenticated"
        )
    return user


async def get_chat_info(
    user_id: UUID, chat_id: UUID, db: AsyncSession
) -> Optional[Tuple[UserChat, Chat, User]]:
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
    results = await db.execute(
        select(UserChat, Chat, User)
        .join(Chat, UserChat.chat_id == Chat.id)
        .join(User, UserChat.receiver_id == User.id)
        .where(UserChat.user_id == user_id, UserChat.chat_id == chat_id)
    )
    fetched = results.unique().fetchone()

    if fetched is None:
        return None

    return fetched.tuple()
