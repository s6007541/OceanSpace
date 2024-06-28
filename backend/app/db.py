from datetime import datetime
from typing import AsyncGenerator, List, Optional, Sequence
from uuid import uuid4

from fastapi import Depends
from fastapi_users.db import (
    SQLAlchemyBaseOAuthAccountTableUUID,
    SQLAlchemyBaseUserTableUUID,
    SQLAlchemyUserDatabase,
)
from fastapi_users_db_sqlalchemy import GUID, UUID_ID
from fastapi_users_db_sqlalchemy.access_token import (
    SQLAlchemyAccessTokenDatabase,
    SQLAlchemyBaseAccessTokenTableUUID,
)
from sqlalchemy import Boolean, DateTime, Integer, String, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy_utils import ScalarListType  # type: ignore

DATABASE_URL = "sqlite+aiosqlite:///./test.db"


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
    avatar: Mapped[Optional[str]] = mapped_column(String(), default=None, nullable=True)
    pss_list: Mapped[List[str]] = mapped_column(
        ScalarListType(str), default=[], nullable=False
    )
    is_bot: Mapped[bool] = mapped_column(Boolean(), default=False, nullable=False)


class AccessToken(SQLAlchemyBaseAccessTokenTableUUID, Base):
    pass


class Chat(Base):
    id: Mapped[UUID_ID] = mapped_column(GUID, primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(), nullable=False, default=datetime.now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(), nullable=False, default=datetime.now
    )


class UserChat(Base):
    user_id: Mapped[UUID_ID] = mapped_column(GUID, primary_key=True)
    chat_id: Mapped[UUID_ID] = mapped_column(GUID, primary_key=True)
    receiver_id: Mapped[UUID_ID] = mapped_column(GUID, nullable=False)
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
    id: Mapped[UUID_ID] = mapped_column(GUID, primary_key=True, default=uuid4)
    sender_id: Mapped[UUID_ID] = mapped_column(GUID, nullable=False)
    chat_id: Mapped[UUID_ID] = mapped_column(GUID, nullable=False)
    content: Mapped[str] = mapped_column(String(), nullable=False)
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

    async def get_by_user_id(self, user_id: UUID_ID) -> Sequence[UserChat]:
        stmt = select(UserChat).where(UserChat.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()


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


engine = create_async_engine(DATABASE_URL)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


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
