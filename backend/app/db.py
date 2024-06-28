from typing import AsyncGenerator, List, Optional

from fastapi import Depends
from fastapi_users.db import (
    SQLAlchemyBaseOAuthAccountTableUUID,
    SQLAlchemyBaseUserTableUUID,
    SQLAlchemyUserDatabase,
)
from fastapi_users_db_sqlalchemy import UUID_ID
from fastapi_users_db_sqlalchemy.access_token import (
    SQLAlchemyAccessTokenDatabase,
    SQLAlchemyBaseAccessTokenTableUUID,
)
from sqlalchemy import Boolean, String, select
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


class UserDatabase(SQLAlchemyUserDatabase):
    async def get(self, user_id: UUID_ID) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
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


async def get_access_token_db(
    session: AsyncSession = Depends(get_async_session),
):
    yield AccessTokenDatabase(session, AccessToken)
