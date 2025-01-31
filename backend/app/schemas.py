import uuid
from typing import Optional, List, Union

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
    notification: bool = True
    emergencyContact: Optional[str] = None


class UserChatModel(BaseModel):
    userId: str
    chatId: str
    receiverId: str
    isSeen: bool
    lastMessage: Optional[str] = None
    whitelist: List[str] = []
    blacklist: List[str] = []
    topicsOfInterest: List[str] = []
    unreadMessages: int = 0
    createdAt: int
    updatedAt: int


class MessageModel(BaseModel):
    id: Optional[str] = None
    clientId: Optional[str] = None
    chatId: str
    senderId: str
    createdAt: int
    timezone: Union[str, int]
    text: str
    buffer: bool
    emotionMode: str
    persuasive: bool


class PSSQuestionModel(BaseModel):
    question: str
    answer: str
