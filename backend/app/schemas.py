import uuid
from typing import Optional, List

from fastapi_users import schemas
from pydantic import BaseModel


class UserRead(schemas.BaseUser[uuid.UUID]):
    pass


class UserCreate(schemas.BaseUserCreate):
    pass


class UserUpdate(schemas.BaseUserUpdate):
    pass


class UserModel(BaseModel):
    id: str
    email: Optional[str] = None
    username: Optional[str] = None
    alias: Optional[str] = None
    avatar: Optional[str] = None
    pssList: List[str] = []


class UserChatModel(BaseModel):
    user_id: str
    chat_id: str
    receiver_id: str
    is_seen: bool
    last_message: Optional[str] = None
    whitelist: List[str] = []
    blacklist: List[str] = []
    topics_of_interest: List[str] = []
    unread_messages: int = 0